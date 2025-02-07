// components:
import Banner from './banner.js'
import CalList from './calList.js'
import Menu from './menu.js'
import QuickNav from './quickNav.js'
import Toolbar from './toolbar.js'
// support:
import dataPool from './dataPool.js'
import helpers from './calHelpers.js'
import siteConfig from './siteConfig.js'

export default {
  template: `
<Banner :banner="banner" />
<Toolbar :expanded="expanded" />
<Menu v-if="expanded.tool === 'menu'"/>
<section class="c-cal-body">
<div v-if="loading" class="c-cal-body__loading">Loading...</div>
<div v-else-if="error" class="c-cal-body__error">{{ error }}</div>
<div class="c-cal-body__list" v-else>
<CalList :cal="cal" :lastEvent="lastEvent"></CalList>
</div>
</section>
<QuickNav @nav-left="shiftRange(-1)" @nav-right="shiftRange(1)"></QuickNav>
`, 
  components: { Banner, CalList, Menu, QuickNav, Toolbar },
  // called once per site load 
  created() {
    // watch the params of the route to fetch the data again
    // https://router.vuejs.org/guide/advanced/data-fetching.html
    this.$watch(
      // source: a function that returns the object to watch.
      // in this case: the query parameters of the url.
      // (  i think because the route doesn't exist immediately )
      () => this.$route.query,
      // callback ( below )
      this.queryChanged,
      // call when created ( as well as on changed )
      { immediate: true }
    )
  },
  // this might be easier to use than "query changed"?
  // but doesn't seem to be called?
  // https://router.vuejs.org/guide/advanced/navigation-guards.html
  beforeRouteUpdate(to, from) {
    console.log(`beforeRouteUpdate ${to.fullPath}, ${from.fullPath}`);
  },
  data() {
    // determines lastEvent on page load, rather on query changes.
    // assumes the query changes only due to jumping dates or loading more events.
    const lastEvent = this.getLastEvent();
    console.log(`last event was ${lastEvent || "nothing"}`);
    //
    return {
      loading: false,
      error: null,
      banner: siteConfig.banner,
      // updated during queryChanged()
      lastEvent,
      // the toolbar wants an object with one property:
      // 'expanded' containing the name of the expanded 
      expanded: {
        tool: this.getExpanded()
      },
      // presumably start and end are meant to be inclusive. 
      // this is updated by "queryChanged" when the url changes.
      // ( not sure if that's the best pattern... good enough for now? )
      cal: {
        start: dayjs(),
        end: dayjs(),
        // the fetched data
        data: [],
      }
    }
  },
  methods: {
    getExpanded() {
      // default to 'false' if expanded isn't part of the query.
      const { expanded = false } = this.$route.query;
      return expanded;
    },
    // find the page we came from using the query
    getLastEvent() {
      // declare a variable "eventId" pulled from  query "at", use null as default.
      const { at: eventId = null } = this.$route.query;
      // grab the id from the event
      const match = eventId ? eventId.match(/event-(.*)/) : null; 
      // id as a string, or the blank string.
      return match ? match[1] : "";
    },
    // watches for a change in the query parameter to fetch new data
    // tbd: beforeRouteUpdate() might be a better hook
    queryChanged(q, oldq) {
      const changed = !oldq || (q.start  !== oldq.start);
      if (changed) {
        // dayjs returns 'now' if q.start is missing.
        const start = dayjs(q.start); 
        if (!start.isValid()) {
          this.error = `Invalid start date: "${q.start}"`;
        } else {
          // fetch happens in background, over time.
          // TODO: some indication that the app is loading new data
          this.fetchFrom(start); 
          this.banner = this.pickBanner(start);
        }
      }
    },
    // for now, display the banner based on the requested start day
    // ( could also show it if *any* date is in there.
    pickBanner(start) {
      let banner = siteConfig.banner; // default banner.
      const fest = siteConfig.getFestival(start);
      if (fest) {
        const festStart = dayjs(fest.startdate);
        const festEnd = dayjs(fest.enddate);
        const startsWithin = helpers.within(start, festStart, festEnd);
        if (startsWithin) {
          banner = fest;
        }
      }
      return banner;
    },
    // shift the current range by a week.
    // along with fetchFrom this means if today is a monday
    // we see monday-sunday; and then shift to the next/previous monday.
    shiftRange(dir) {
      const q = { ...this.$route.query }; // *copy* the query object.
      const start = this.cal.start.add(dir, 'week');
      q.start = start.format("YYYY-MM-DD"); // add/replace the start.
      this.$router.replace({query: q});     // request the new page.
    },
    // fetch six days of events from 'start' ( including 'start'. )
    // 'start' should be a valid dayjs date.
    async fetchFrom(start) {
      const end = start.add(6, 'day');
      const logFmt = "YYYY-MM-DD"
      this.error = null;
      this.loading = true;
      try {
        const data = await dataPool.getRange(start, end);
        // TODO: when to replace cal start/end? before or after the get?
        this.cal.start = start;
        this.cal.end = end;
        this.cal.data = groupByDay(start, end, data.events);
        // console.log(JSON.stringify(data));
      } catch (err) {
        console.error(err);
        console.trace();
        this.error = err.toString();
      } finally {
        this.loading = false;
      }
    },
  },
}

// given api data returned by the server, generate a contiguous array of days.
// each day contains the dayjs date, and an array of events for that day.
// [ { date, events: [] }, ... ]
// this helps calList show every day of the week, including days with no events.
// NOTE: assumes that the incoming eventData is sorted.
function groupByDay( start, end, eventData ) {
  // create entries for every day between start and end ( inclusive )
  const length = end.diff(start, 'day') + 1;
  const allDays = Array.from({length}, (_, idx) => {
    return {
      date: start.add(idx,'day'),
      events: []
    };
  });
  eventData.forEach((evt) => {
    const date = dayjs(evt.date);
    const idx = date.diff(start, 'day');
    const currDay = allDays[idx]; // a reference to the entry; not a copy.
    currDay.events.push(evt);
  });
  return allDays;
};

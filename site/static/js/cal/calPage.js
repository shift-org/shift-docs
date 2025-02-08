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
<QuickNav :shortcuts="shortcuts" @nav-left="shiftRange(-1)" @nav-right="shiftRange(1)"></QuickNav>
`, 
  components: { Banner, CalList, Menu, QuickNav, Toolbar },
  beforeRouteEnter(to, from, next) {
    // called before the route that renders this component is confirmed.
    // does NOT have access to `this` component instance,
    // because it has not been created yet when this guard is called!
    const lastEvent = from.params.caldaily_id || null;
    console.log(`beforeRouteEnter last event was ${lastEvent || "nothing"}`);
    next(vm => {
      // access to component public instance via `vm`
      vm.lastEvent = lastEvent;
    });
  },
  beforeMount() {
    this.updateData(this.$route.query);
  },
  beforeRouteUpdate(to, from) { 
    console.log(`beforeRouteUpdate ${to.fullPath}, ${from.fullPath}`);
    this.updateData(to.query);
  },
  data() {
    return {
      loading: false,
      error: null,
      // default, updated when the url changes.
      banner: siteConfig.banner,
      // set during beforeRouteEnter()
      lastEvent: null,
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
      },
      // for the bottom nav panel:
      shortcuts: [{
        id: "left",
        icon: "⇦",
        label: "Earlier",
        emit: "navLeft"
      },{
        id: "right",
        icon: "⇨",
        label: "Later",
        emit: "navRight"
      },{
        id: "add",
        icon: "+",
        label: "Add",
        url:"/addevent/"
      },{
        id: "info",
        icon: "ℹ", //  ⛭ or a shift gear icon?
        label: "Info",
        url: "/pages/mission_statement/"
      },{
        id: "donate",
        icon: "$",
        label: "Donate",
        url: "/pages/donate"
      },{
        id: "favorites",
        icon: "☆",
        label: "Favorites"
        // TODO: router navigate to 
      }]
    }
  },
  methods: {
    getExpanded() {
      // default to 'false' if expanded isn't part of the query.
      const { expanded = false } = this.$route.query;
      return expanded;
    },
    // watches for a change in the query parameter to fetch new data
    updateData(q) {
      // if start is missing, dayjs returns now()
      const start = dayjs(q.start); 
      if (!start.isValid()) {
        this.error = `Invalid start date: "${q.start}"`;
      } else {
        // TBD: change to computed?
        this.banner = this.pickBanner(start);
        // fetch happens in background, over time.
        // it sets this.loading, which triggers an animation
        this.fetchFrom(start); 
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
      // TBD: could maybe do a thing of evaluating the previous page
      // and unwinding rather than pushing the history in case they're
      // using navLeft as a back-button.
      this.$router.push({query: q});        // request the new page.
    },
    // fetch six days of events from 'start' ( including 'start'. )
    // 'start' should be a valid dayjs date.
    async fetchFrom(start) {
      const end = start.add(6, 'day');
      this.error = null;
      this.loading = true;
      try {
        const data = await dataPool.getRange(start, end);
        // TODO: when to replace cal start/end? before or after the get?
        this.cal.start = start;
        this.cal.end = end;
        this.cal.data = groupByDay(start, end, data.events);
        // ex. August 16, 2018
        const startDate = start.format("MMMM D, YYYY");
        document.title = `${siteConfig.title} - Calendar - ${startDate}`;
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
  // console.log(JSON.stringify(allDays));
  return allDays;
};

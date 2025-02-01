import TopBar from './topBar.js'
import CalList from './calList.js'
import QuickNav from './quickNav.js'
//
import siteConfig from './siteConfig.js'
import dataPool from './dataPool.js'
import helpers from './calHelpers.js'

// dayJs or null
function makeGoodRange(start, end) {
  if (!end || end.subtract(start) > siteConfig.daysToFetch.max) {
    end =  start.add(siteConfig.daysToFetch.default, 'day')
  }
  return end;
}

export default {
  template: `
<TopBar :banner="banner"></TopBar>
<section class="c-cal-body">
<div v-if="loading" class="c-cal-body__loading">Loading...</div>
<div v-else-if="error" class="c-cal-body__error">{{ error }}</div>
<div class="c-cal-body__list" v-else>
<CalList :cal="cal" :lastEvent="lastEvent"></CalList>
</div>
</section>
<QuickNav :cal="cal"></QuickNav>
`, 
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
    log.console(`beforeRouteUpdate ${to},  ${from}`);
  },
  data() {
    // we do this just once ( rather than every time the query changes while on this page )
    // we assume the query is only changing due to jumping dates or loading more events
    // when that happens -- we want to reset the top event.
    // TBD: do we?
    const lastEvent = this.getLastEvent();
    console.log(`last event was ${lastEvent || "nothing"}`);
    //
    return {
      loading: false,
      error: null,
      // default banner data
      // updated during queryChanged()
      banner: siteConfig.banner,
      // updated during queryChanged()
      lastEvent,
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
    // find the page we came from using the query
    getLastEvent() {
      // declare a variable "eventId" pulled from  query "at", use null as default.
      const { at: eventId = null } = this.$route.query;
      // grab the id from the event
      const match = eventId ? eventId.match(/event-(.*)/) : null; 
      // id as a string, or the blank string.
      return match ? match[1] : "";
    },
    queryChanged(q, oldq) {
      // note: this doesn't require 'enddate' to be in the url
      // ( and doesn't try to add it if its missing )
      const changed = !oldq || 
                (q.startdate  !== oldq.startdate) ||
                (q.enddate  !== oldq.enddate);
      if (changed) {
        const start = dayjs(q.startdate); // dayjs returns 'now' if startdate is missing.
        if (!start.isValid()) {
          this.error = `Invalid start date: "${q.startdate}"`;
        } else {
          const end = makeGoodRange(start, q.enddate ? dayjs(q.enddate) : null);
          this.fetchData(start, end); // fetch happens in background, over time.
          this.banner = this.pickBanner(start);
        }
      }
    },
    // for now, display the banner based on the requested start day
    // ( could also show it if *any* date is in there.
    pickBanner(start) {
      let banner = siteConfig.banner; // default banner.
      const fest = siteConfig.getFestival(this.cal.start);
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
    async fetchData(start, end) {
      const logFmt = "YYYY-MM-DD"
      console.log(`fetching ${start.format(logFmt)} to ${end.format(logFmt)}`);
    
      this.error = null;
      this.loading = true;

      // TODO: timeout?
      try {
        if (end.isBefore(start)) {
          throw new Error(`requesting invalid date range: ${start} to ${end}`);
        }
        //
        const data = await dataPool.getRange(start, end);
        // when to replace the dayes? before or after the get?
        this.cal.start = start;
        this.cal.end = end;
        this.cal.data = groupByDay(data.events);
        // console.log(JSON.stringify(data));
      } catch (err) {
        this.error = err.toString();
      } finally {
        this.loading = false;
      }
    },
  },
  components: { TopBar, CalList, QuickNav },
}

// takes the api events data and splits into an array of days:
// [{ label, date: 'YYYY-MM-DD', events: [] }, ... ]
// the "id" of an event is the "calevent" id 
// it also has its "caldaily_id"
function groupByDay( eventData, showDetails=false ) {
  // group events by day:
  let allDays = [], currDay = null;
  // assumes the dates are sorted; but the times within each might not be.
  // ( FIX: order the times on the server )
  eventData.forEach(( evt, index ) => {
    // each evt is a combined event listing + daily.
    const date = evt.date;
    if (!currDay || currDay.date !== date) {
        // it's a brand new day.
        currDay = {
            date,
            events: [],
        };
        allDays.push(currDay);
    }
    currDay.events.push(evt);
  });
  // sort the times within each day
  // ( times are listed as a 24hr string "17:30:00" )
  allDays.forEach(day => {
    day.events.sort(helpers.compareTimes);
  });
  return allDays;
};


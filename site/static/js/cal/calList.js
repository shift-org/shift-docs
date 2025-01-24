/**
 * display slit of events:
 * equivalent of viewEvents()
 */
// /Users/ionous/dev/shift/shift-docs/site/themes/s2b_hugo_theme/static/lib/dayjs/dayjs.min.js

import { RouterLink } from 'vue-router'
import dataPool from './dataPool.js'
import helpers from './calHelpers.js'

const Term = {
  template: `
<dt :class="termClass">{{ label }}</dt>
<dd :class="valueClass"><slot></slot></dd>
`,
  props: {
    type: String,
    label: String
  },
  computed: {
    termClass() {
      return [ `c-event__term c-event__term--${this.type}` ] 
    },
    valueClass() {
      return [ `c-event__value c-event__value--${this.type}` ]
    }
  }
};

const Event = {
  template: `
<article 
  class="c-event"
  :class="{ 'c-event--cancelled': evt.cancelled, 
            'c-event--featured': evt.featured }"
  :data-event-id="evt.id">
<h3 class="c-event__title"><router-link 
  :to="{name: 'event', params: {caldaily_id: evt.caldaily_id}}"
>{{ evt.title }}</router-link></h3>
<dl>
  <Term type="time" label="Start Time">{{ friendlyTime }}</Term>
  <Term type="news" label="Newsflash" v-if="evt.newsflash">{{ evt.newsflash }}</Term>
  <Term type="author" label="Organizer">{{ evt.organizer }}</Term>
  <Term type="loc" label="Location">
    <a target="_blank" rel="noopener nofollow external" title="Opens in a new window" href="mapLink">{{ join(evt.venue, evt.address) }}</a>
    <div v-if="evt.locdetails">{{ evt.locdetails }}</div>
  </Term>
  <Term type="tags" label="Tags">
    <ul class="c-event__tags">
      <li :class="tag('audience', audienceTag)">{{ audienceLabel }}</li>
      <li :class="tag('area', areaTag)">{{ areaLabel }}</li>
      <li :class="tag('safety', safetyTag)" v-if="evt.safetyplan">{{ safetyLabel }}</li>
    </ul>
  </Term>
</dl>
</article>
`,
  props: {
    evt: Object,
  },
  components: { Term },
  computed: {
    friendlyTime() {
      return dayjs(this.evt.time, 'hh:mm:ss').format('h:mm A');
    },
    // maybe this should include hovertext, or something for more details?
    audienceTag() {
      return helpers.getAudienceTag(this.evt.audience);
    },
    audienceLabel() {
      return  helpers.getAudienceLabel(this.evt.audience);
    },
    areaTag() {
      return helpers.getAreaTag(this.evt.area);
    },
    areaLabel() {
      return helpers.getAreaLabel(this.evt.area);
    },
    safetyTag() {
      return this.evt.safetyplan ? "yes" : "no";
    },
    safetyLabel() {
      return this.evt.safetyplan ? "COVID Safety plan" : "No COVID plan";
    },
    mapLink() {
      return helpers.getMapLink(this.evt.address);
    }
  },
  methods: {
    yesNo(v) { return v ? "yes" : "no" },
    // return a list of classes, ex:
    // c-event__audience c-event_audience-G
    tag(name, tag) {
      tag = tag || "unknown";
      return [`c-event__${name}`, `c-event__${name}-${tag}`];
    },
    join(a, b) {
      return [a, b].filter(Boolean).join(", ");
    }
  }
};

export default {
  template: `
<div v-if="loading" class="loading">Loading...</div>
<div v-if="error" class="error">{{ error }}</div>
<article v-for="day in days" 
  class="c-day" 
  :data-date="day.date">
  <h2>{{ longDate(day.date) }}</h2>
  <Event v-for="evt in day.events" :evt="evt"></Event>
</article>
`,  
  data() {
    return {
      loading: false,
      error: null,
      days: [],
    }
  },
  components: { Event },
  created() {
    // watch the params of the route to fetch the data again
    // https://router.vuejs.org/guide/advanced/data-fetching.html
    this.$watch(
      // source: a function that returns the object to watch.
      // in this case: the query parameters of the url.
      // (  i think because the route doesn't exist immediately )
      () => this.$route.query,
      // callback ( below )
      this.fetchData,
      // call when created ( as well as on changed )
      { immediate: true }
    )
  },
  methods: {
    longDate(when) {
      const date = dayjs(when);
      const now = dayjs();
      let format;
      if (date.year() !== now.year()) {
        // Wed, January 22, 2025
        format = 'ddd, MMMM D, YYYY';
      } else if (!date.isSame(now, 'week'))
        // Wed, January 22
        format  = 'ddd, MMMM D';
      else if (!date.isSame(now, 'day')) {
        // Thursday  — Jan 22
        format = 'dddd — MMM D'
      } else {
        format = '[Today] — ddd, MMM D'
      }
      return date.format(format);
    },

    async fetchData(query) {
      // read the days to view from the url.
      const options = getInitialView(query);

      // FIX: lazyLoadEventImages
      // FIX: handler for #load-more

      this.error = this.post = null;
      this.loading = true;
      try {
        const data= await dataPool.getRange(options.startdate, options.enddate);
        this.days = groupByDay(data);
        // console.log(JSON.stringify(data));
      } catch (err) {
        this.error = err.toString();
      } finally {
        this.loading = false;
      }
    },
  },
 
}

// default range of days to show.
const dayRange = 10;

// compute range and details settings from the url options.
// the returned object gets passed to getEventHTML().
function getInitialView(options) {
    const today = dayjs().startOf('day');
    const start = dayjs(options.startdate); // if start or end are missing ( from the url )
    const end   = dayjs(options.enddate);   // then dayjs returns today.
    const inRange = today >= start && today <= end;
    const from = (inRange && options.pp) ? today : start;
    return {
      // since this year's PP will be in range
      // ( as will the normal calendar events page )
      // 'from' is today; for other PP pages it's options startdate.
      startdate: from,
      // if there was an enddate, use it; otherwise use a fixed number of days.
      enddate: options.enddate ? end : from.add(dayRange, 'day'),
      // pass this on to the events listing.
      show_details: options.show_details,
    };
}

// takes the api events data and splits into an array of days:
// [{ label, date: 'YYYY-MM-DD', events: [] }, ... ]
// the "id" of an event is the "calevent" id 
// it also has its "caldaily_id"
function groupByDay( data, showDetails=false ) {
  // group events by day:
  let allDays = [], currDay = null;
  // assumes the dates are sorted; but the times within each might not be.
  // ( FIX: order the times on the server )
  data.events.forEach(( evt, index ) => {
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

    // fix: move these into the template.
    // evt.displayStartTime = dayjs(evt.time, 'hh:mm:ss').format('h:mm A');
    // evt.displayDate = dayjs(evt.date).format('ddd, MMM D, YYYY');
    // if (evt.endtime) {
    //   evt.displayEndTime = dayjs(evt.endtime, 'hh:mm:ss').format('h:mm A');
    // }

    
    // if (showDetails) {
    //   evt.expanded = true;
    // }
    // evt.webLink = helpers.getWebLink(evt.weburl);
    // evt.contactLink = helpers.getContactLink(evt.contact);

    // evt.shareLink = '/calendar/event-' + evt.caldaily_id;
    // evt.exportlink = '/api/ics.php?id=' + evt.id;
  });
  // sort the times within each day
  // ( times are listed as a 24hr string "17:30:00" )
  allDays.forEach(day => {
    day.events.sort(helpers.compareTimes);
  });
  return allDays;
};


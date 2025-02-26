<!-- 
 * display list of events:
 * equivalent of viewEvents()
 -->
<script>
// globals:
import dayjs from 'dayjs'
// components:
import EventSummary from './EventSummary.vue'
import DateDivider from './DateDivider.vue'
// support:
import { fetchRange } from './calList.js'
import helpers from './calHelpers.js'
import siteConfig from './siteConfig.js'

export default {
  components: { EventSummary, DateDivider },
  emits: [ 'pageLoaded' ],
  // called before the component is fully created
  // ( doesnt have access to `this` )
  beforeRouteEnter(to, from, next) {
    // remember where we came from ( so we can scroll it into view )
    const lastEvent = from.params.caldaily_id || null;
    console.log(`beforeRouteEnter last event was ${lastEvent || "nothing"}`);
    next(vm => {
      // access to component public instance via `vm`
      vm.lastEvent = lastEvent;
      vm.updateRange(to.query.start);
    });
  },
  // triggered when naving left/right through weeks.
  beforeRouteUpdate(to, from) { 
    if (to.query.start !== from.query.start) {
      console.log(`beforeRouteUpdate ${to.fullPath}, ${from.fullPath}`);
      return this.updateRange(to.query.start);
    }
  },
  data() {
    return { 
      // defaults to now; overridden by query parameters
      // ( via beforeRoute* )
      start: dayjs(),
      // set during beforeRouteEnter()
      // provides a way to scroll to the specified event
      lastEvent: null,
      // an array of days
      // each day containing an array of event instances ( a joined calevent + caldaily )
      days: [],
    };
  },
  computed: {
    // the starting date as a string
    startdate() {
      return this.start.format("YYYY-MM-DD");
    },
    // festival of the current year
    // if there's a winter fest that goes over the year boundary:
    // well... you'll have to code that.
    fest() {
      return siteConfig.getFestival(this.start);
    },
  },
  methods: {
    // return true if there should be a dividing line 
    // before ( when dir < 0 ) or after ( when dir > 0 )
    divides(day, index, dir) {
      let okay = false;
      // don't ever put a dividing line before the first element
      if (index > 0) {
        const fest = this.fest;
        if (fest) {
          const festStart = dayjs(fest.startdate);
          const festEnd = dayjs(fest.enddate);

          const curr = dayjs(day.date);
          const other = curr.add(dir, 'day');
          const cin = helpers.within(curr, festStart, festEnd);
          const oin = helpers.within(other, festStart, festEnd);

          // current day is within the festival; the other is outside.
          return cin && !oin;
        }
      }
      return okay
    },
    // promise six days of events including 'start'.
    // 'start' should be a valid dayjs date.
    // emits the 'pageLoaded' event when done.
    updateRange(start) {
      return fetchRange(start).then((page) => {
        this.start = page.range.start;
        this.days = page.range.days;
        this.$emit("pageLoaded", page);
      }).catch((error) => {
        console.error("updateRange error:", error);
        this.$emit("pageLoaded", null, error);
      });
    },
  }
}
</script>
<template> 
  <article 
    v-for="(day, index) in days" :key="day.date.format('YYYY-MM-DD')" 
    class="c-day"
    :data-date="day.date">
    <h2 v-if="divides(day, index, -1)" class="c-day__division c-day__division--start">
      {{fest.title}} Starts
    </h2>
    <DateDivider :date="day.date" />
    <EventSummary 
        v-for="evt in day.events" :key="evt.caldaily_id" 
        :evt="evt" 
        :focused="lastEvent === evt.caldaily_id"
        :startdate="startdate"/>
    <h2 v-if="divides(day, index, 1)" class="c-day__division c-day__division--end">
      {{fest.title}} Ends
    </h2>
  </article>
</template>
<style>
  
.c-day__division--start {
  margin-top: 2em;
  background-color: black;
  color: white;
}
.c-day__division--end {
  margin-bottom: 2em;
  background-color: black;
  color: white;
}
</style>
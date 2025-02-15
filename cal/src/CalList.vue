<script>
/**
 * display list of events:
 * equivalent of viewEvents()
 */
// globals:
import dayjs from 'dayjs'
// components:
import EventSummary from './EventSummary.vue'
// support:
import siteConfig from './siteConfig.js'
import helpers from './calHelpers.js'

export default {
  props: {
    cal: {
      // cal should contain start, end, [data]
      type: Object, 
      required: true,
    },
    // not required; scrolls to this event 
    lastEvent: [ String, null ], 
  },
  computed: {
    // the startdate as a string
    startdate() {
      return this.cal.start.format("YYYY-MM-DD");
    },
    // an array of days
    // each day containing an array of event instances ( a joined calevent + caldaily )
    days() {
      return this.cal.data;
    },
    // festival of the current year
    // if there's a winter fest that goes over the year boundary:
    // well... you'll have to code that.
    fest() {
      return siteConfig.getFestival(this.cal.start);
    },
  },
  components: { EventSummary },
  methods: {
    longDate: helpers.longDate,

    divides(day, index, dir) {
      let okay = false;
      // don't ever put a dividing line before the first element
      if (index > 0) {
        const fest = this.fest;
        if (fest) {
          // tbd: should we be pre-building these?
          const festStart = dayjs(fest.startdate);
          const festEnd = dayjs(fest.enddate);

          // ditto dates....
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
    <h3>{{ longDate(day.date) }}</h3>
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
</style>
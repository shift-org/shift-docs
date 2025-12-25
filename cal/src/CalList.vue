<!-- 
 * display a list of events:
 * equivalent of viewEvents()
 -->
<script>
// globals:
import dayjs from 'dayjs'
// components:
import EventSummary from './EventSummary.vue'
import DateDivider from './DateDivider.vue'
import NewsItem from './NewsItem.vue'
// support:
import { fetchRange } from './calList.js'
import helpers from './calHelpers.js'
import siteConfig from './siteConfig.js'

export default {
  components: { EventSummary, DateDivider, NewsItem },
  emits: [ 'pageLoaded' ],
  // called before the component is fully created
  // ( doesnt have access to `this` )
  beforeRouteEnter(to, from, next) {
    next(vm => {
      // access to component instance via `vm`
      vm.updateRange(to.query.start);
    });
  },
  // triggered when naving left/right through weeks.
  beforeRouteUpdate(to, from) { 
    if (to.query.start !== from.query.start) {
      console.log(`CalList beforeRouteUpdate ${to.fullPath}, ${from.fullPath}`);
      return this.updateRange(to.query.start);
    }
  },
  data() {
    return { 
      // defaults to now; overridden by query parameters
      // ( via beforeRoute* )
      start: dayjs(),
      // array of days:
      // each day containing an array of source records.
      days: [],
    };
  },
  computed: {
    // the starting date as a string
    startdate() {
      return this.start.format("YYYY-MM-DD");
    },
  },
  methods: {
    // promise six days of records including 'start'.
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
    <DateDivider :date="day.date" />
    <template v-for="rec in day.records" :key="`${rec.type}-${rec.uid}`">
      <h2 v-if="rec.type == 'calfestival'"
      class="c-day__festival" :class="{
         'c-day__festival--start': rec.start,
         'c-day__festival--end': rec.end,
      }">
        {{rec.title}} {{rec.start ? "Starts": "Ends"}}
      </h2>
      <EventSummary v-else-if="rec.type == 'caldaily'" :evt="rec" />
      <NewsItem v-else-if="rec.type == 'news'" :news="rec" />
      <template v-else-if="rec.type == 'social'">
        <p>Social</p>
        <img v-if="rec.image" :alt="rec.image.alt" :src="rec.image.url">
        <div v-html="rec.description"></div>
        <span>via: <a :href="rec.link">pdx social</a></span>
      </template>
      <template>
        <!-- unknown record type '{{rec.type}}' -->
      </template>
    </template>
  </article>
</template>
<style>
  
/** the pedalp start/end divider */
.c-day__festival {
  background-color: var(--active-bg);
  color: var(--divider-text);
  text-align: center;
  padding: 1em;
}  
.c-day__festival--start {
  margin-top: 2em;
}
.c-day__festival--end {
  margin-bottom: 2em;
}
</style>
<!-- 
 * Requests search results from the server, and displays them.
 * TODO: requests should limit to say 10-20 events; and next/prev navigate
 -->
<script>
import dayjs from 'dayjs'
import EventSummary from './EventSummary.vue'
import { fetchSearch } from './calSearch.js'

export default {
  components: { EventSummary },
  emits: [ 'pageLoaded' ],
  // called before the component is fully created
  // ( doesnt have access to `this` )
  beforeRouteEnter(to, from, next) {
    console.log(`CalSearch beforeRouteEnter ${to.fullPath}, ${from.fullPath}`);
    // TODO: remember where we came from?
    // ex. could lastEvent or starting date, etc.
    // ex. lastEvent for going to an event and back to search
    next(vm => {
      // access to component public instance via `vm`
      // vm.lastEvent = lastEvent;
      vm.updateSearch();
    });
  },
  // triggered when naving left/right through weeks.
  beforeRouteUpdate(to, from) { 
    if (to.query.start !== from.query.start) {
      console.log(`CalSearch beforeRouteUpdate ${to.fullPath}, ${from.fullPath}`);
      return this.updateSearch(to.query.start);
    }
  },
  data() {
    return { 
      // an array of search results ( joined calevent + caldaily records )
      events: [],
      lastEvent: null,
    };
  },
  computed: {
    q() {
      return this.$route.query.q;  
    },
    offset() {
      return this.$route.query.offset || 0;
    },
  },
  methods: {
    // emits the 'pageLoaded' event when done.
    updateSearch() {
      const { q, offset } = this;
      return fetchSearch(q, offset).then((page) => {
        const { events } = page.data;
        this.events = events;
        this.$emit("pageLoaded", page);
      }).catch((error) => {
        console.error("updateSearch error:", error);
        this.$emit("pageLoaded", null, error);
      });
    },
  },
}
</script>
<template> 
  <div class="c-search__summary">
    Found {{events.length}} events containing "{{q}}".
  </div>
  <EventSummary 
      v-for="evt in events" :key="evt.caldaily_id" 
      :evt="evt" 
      :focused="lastEvent === evt.caldaily_id" 
      :showDate="true"/>
</template>
<style>
/* margin/padding matches EventSummary -- 
  fix: probably the container should handle that uniformly if it can.
 */
.c-search__summary {
  margin: 10px 20px;
  width: 1em auto;
  text-align: center;
  font-weight: bold;
}
</style>
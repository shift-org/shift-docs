<!-- 
 * Requests search results from the server, and displays them.
 -->
<script>
import dayjs from 'dayjs'
import EventSummary from './EventSummary.vue'
import { fetchSearch } from './calSearch.js'
import siteConfig from './siteConfig.js'

export default {
  components: { EventSummary },
  emits: [ 'pageLoaded' ],
  // called before the component is fully created
  // ( doesnt have access to `this` )
  beforeRouteEnter(to, from, next) {
    console.log(`CalSearch beforeRouteEnter ${to.fullPath}, ${from.fullPath}`);
    next(vm => {
      // access to component public instance via `vm`
      // vm.lastEvent = lastEvent;
      vm.updateSearch(to.query);
    });
  },
  // triggered when naving left/right through weeks.
  beforeRouteUpdate(to, from) { 
    console.log(`CalSearch beforeRouteUpdate to:${to.fullPath}, from: ${from.fullPath}`);
    return this.updateSearch(to.query);
  },
  data() {
    return { 
      // an array of search results ( joined calevent + caldaily records )
      events: [],
      pageNum: 1,
      fullCount: 0,
      searchWidth: 0,
    };
  },
  computed: {
    q() {
      return this.$route.query.q;  
    },
    offset() {
      return this.$route.query.offset || 0;
    },
    itemCount() {
      return this.events.length;
    },
    totalPages() {
      return this.searchWidth > 0 ? Math.ceil(this.fullCount / this.searchWidth) : 0;
    },
    isFirstPage() {
      return !this.offset;
    },
    pluralized() {
      return  'event' + (this.fullCount !== 1 ? 's' :'');
    }
  },
  methods: {
    // emits the 'pageLoaded' event when done.
    updateSearch({q, offset, all: searchAll}) {
      return fetchSearch(q, parseInt(offset || 0), searchAll).then((page) => {
        this.events = page.data.events;
        this.pageNum = page.data.pageNum;
        this.fullCount = page.data.fullCount; 
        this.searchWidth = page.data.searchWidth;
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
  <h3 class="c-divder c-divder--center">
    <div>Found {{fullCount}} {{pluralized}} containing "{{q}}"</div>
    <div v-if="totalPages > 1">Showing page {{pageNum}} of {{totalPages}}</div>
  </h3>
  <EventSummary 
      v-for="evt in events" :key="evt.caldaily_id" 
      :evt="evt" 
      :showDate="true"/>
</template>
<style>
/* note: margin/padding matches EventSummary */
.c-search__summary {
  margin: 10px 20px;
  width: 1em auto;
  text-align: center;
  font-weight: bold;
}
</style>
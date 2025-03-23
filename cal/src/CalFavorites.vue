<!-- 
 * Requests favorites results from the server, and displays them.
 -->
<script>
import dayjs from 'dayjs'
import EventSummary from './EventSummary.vue'
import favorites from './support/favorites.js'
import { buildPage } from './calFavorites.js'

export default {
  components: { EventSummary },
  emits: [ 'pageLoaded' ],
  // called before the component is fully created
  // ( doesnt have access to `this` )
  beforeRouteEnter(to, from, next) {
    console.log(`CalFavorites beforeRouteEnter ${to.fullPath}, ${from.fullPath}`);
    favorites.fetch().then((store) => {
      next(vm => {
        vm.store = store;
        const page = buildPage();
        vm.$emit("pageLoaded", page);
      });
    });
  },
  // triggered when naving left/right
  beforeRouteUpdate(to, from) { 
    console.log(`CalFavorites beforeRouteUpdate to:${to.fullPath}, from: ${from.fullPath}`);
  },
  data() {
    return { 
      store: [],
    };
  }
}
</script>
<template> 
  <h3 class="c-divder c-divder--center">Favorites</h3>
  <EventSummary 
      v-for="(entry, key) in store" :key 
      :evt="entry.data" 
      :showDate="true"/>
</template>
<style>
</style>
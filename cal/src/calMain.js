/**
 * entry point for the single page application.
 */
import { createApp } from 'vue'
import { createWebHistory, createRouter } from 'vue-router'
import './style.css'

// our main page:
import CalMain from './CalMain.vue'

// the sub pages ( display inside of CalMain )
import CalList from './CalList.vue'
import CalSearch from './CalSearch.vue'
import CalFavorites from './CalFavorites.vue'
import EventDetails from './EventDetails.vue'
import CalBeta from './CalBeta.vue'
// import Empty from './Empty.vue'

// the source of records displayed by CalList.
import sourcePool from './sources/sourcePool.js' 
import socialSource from './sources/socialSource.js'
import eventSource from './sources/eventSource.js'
import festivalSource from './sources/festivalSource.js'

sourcePool.register(socialSource, eventSource, festivalSource);

// the router reads and writes the user's address bar
const router = createRouter({
  history: createWebHistory(),
  routes: [
    // paths do url matching 
    { 
      name: "events",  // names are used by the templates to jump from place to place
      path: "/events/", 
      component: CalList,
    }, 
    { 
      // search gets a query containing q="what to search"
      name: "search",  
      path: "/events/search", 
      component: CalSearch,
    }, 
    { 
      // search gets a query containing q="what to search"
      name: "favorites",  
      path: "/events/favorites", 
      component: CalFavorites,
    }, 
    { 
      name: 'EventDetails', 
      // series and caldaily can match numbers
      // ( this prevents conflicts with other sub-event pages )
      // slug is optional
      path: '/events/:series_id(\\d+)/:caldaily_id(\\d+)/:slug?', 
      component: EventDetails 
    },
    { 
      name: "beta",  
      path: "/events/beta", 
      component: CalBeta,
    }, 
  ],
})

createApp(CalMain)
.use(router)
.mount('#app');

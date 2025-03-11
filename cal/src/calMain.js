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
// import Empty from './Empty.vue'

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
  ],
})

createApp(CalMain)
.use(router)
.mount('#app');

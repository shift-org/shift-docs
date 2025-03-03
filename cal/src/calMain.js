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
import EventDetails from './EventDetails.vue'
// import Empty from './Empty.vue'

// the router reads and writes the user's address bar
const router = createRouter({
  history: createWebHistory(),
  routes: [
    // paths do url matching 
    { 
      name: "calendar",  // names are used by the templates to jump from place to place
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
      name: 'EventDetails', 
      // caldaily_id only match numbers
      // ( this prevents conflicts with other sub-event pages )
      // slug is optional
      path: '/events/:caldaily_id(\\d+)/:slug?', 
      component: EventDetails 
    },
  ],
})

createApp(CalMain)
.use(router)
.mount('#app');

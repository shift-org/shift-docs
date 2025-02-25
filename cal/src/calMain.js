/**
 * entry point for the single page application.
 */
import { createApp } from 'vue'
import { createWebHistory, createRouter } from 'vue-router'
import './style.css'

// our main pages:
import CalMain from './CalMain.vue'
import CalList from './CalList.vue'
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
    // { 
    //   name: "search",  
    //   path: "/events/search", 
    //   component: Search,
    // }, 
    { 
      name: 'EventDetails', 
      // caldaily_id will only match numbers
      // slug is optional
      // tbd: any next and prev events might want to use ?rel=next, ?rel=prev
      // to avoid potential conflict with the slug
      path: '/events/:caldaily_id(\\d+)/:slug?', 
      component: EventDetails 
    },
  ],
})

createApp(CalMain)
.use(router)
.mount('#app');

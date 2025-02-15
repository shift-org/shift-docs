/**
 * entry point for the single page application.
 */
import { createApp } from 'vue'
import { createWebHistory, createRouter } from 'vue-router'
import './style.css'

// our main pages:
import App from './App.vue'
import CalPage from './CalPage.vue'
import EventDetails from './EventDetails.vue'

// the router reads and writes the user's address bar
const router = createRouter({
  history: createWebHistory(),
  routes: [
    // paths do url matching 
    // temp: use a new set of paths for prototyping
    { 
      name: "calendar",
      path: "/events/", 
      component: CalPage,
    }, 
    // named elements are used by the javascript code to link from place to place
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

createApp(App)
.use(router)
.mount('#app');

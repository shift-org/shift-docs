import { createApp } from 'vue'
import { createWebHistory, createRouter, RouterView } from 'vue-router'
// try this to get rid of the devtools:
// const { createApp } = Vue
// const { createRouter, createWebHistory } = VueRouter

// these are stored in static temporarily
// we probably want to put them in asse 
// and loop to minify in calevents/single.html
// ( or even combine them with a buld and use import map )
import CalPage from './calPage.js'
import SingleEvent from './singleEvent.js'

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
    { name: 'event', path: '/events/event-:caldaily_id', component: SingleEvent },
  ],
})

createApp({
  components:{
    RouterView,
  },
  // tbd: can we this template with something more direct?
  // ex. put this in the events.html page maybe?
  template: ` <router-view></router-view>`})
.use(router)
.mount('#app');

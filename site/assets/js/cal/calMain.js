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
import menu from '/slim/menu.js'

const siteinfo = {
  header: {
    logo: "/img/cal/logos/shift-logo.svg#shift-logo",
    title: "Ride Calendar",
    // https://www.shift2bikes.org
    banner: {
      image: "/images/pp/pp2024-banner.png",
      // interestingly, clicking on the banner in the main site
      // navigates to the image.s
      target: "pedalpalooza.org",
      alt: "Pedalpalooza",
    }
  },
  menu: menu,
};

// the router reads and writes the user's address bar
const router = createRouter({
  history: createWebHistory(),
  routes: [
    // paths do url matching 
    // temp: use a new set of paths for prototyping
    { 
      name: "calendar",
      path: "/slim/", 
      component: CalPage,
      props: { siteinfo },
    }, 
    // named elements are used by the javascript code to link from place to place
    { name: 'event', path: '/slim/event-:caldaily_id', component: SingleEvent },

    // TODO: .... something for event add preview ... 
    // TODO: .... something for the real urls ...
    // { path: "/pedalpalooza-calendar/", component: CalPage }
  ],
})

createApp({
  components:{
    RouterView,
  },
  // tbd: can we this template with something more direct?
  // ex. put this in the slim.html page maybe?
  template: ` <router-view></router-view>`})
.use(router)
.mount('#app');

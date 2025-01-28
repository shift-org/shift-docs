/**
 * global constants
 * ( we might want some of this customizable )
 */
import menu from '/events/menu.js'
import pedalp from '/events/pedalp.js'

export default {
  header: {
    logo: "/img/cal/logos/shift-logo.svg#shift-logo",
    title: "Ride Calendar",
    // https://www.shift2bikes.org
    banner: {
      image: "/images/pp/pp2024-banner.png",
      // interestingly, clicking on the banner in the main site
      // navigates to the image.s
      target: "https://pedalpalooza.org",
      alt: "Pedalpalooza",
    }
  },
  // hugo generated menu data 
  // a json version of what's in hugo.toml
  menu: menu,
  daysToFetch: 10,

  // generate start and 
  pedalp,
};
/**
 * global constants
 * ( we might want some of this customizable )
 */
import menu from '/events/menu.js'
import pedalp from '/events/pedalp.js'

export default {
  logo: "/img/cal/logos/shift-logo.svg#shift-logo",
  // banner matches the format of the pedalp.js data
  // ( as generated with buildPedalDates.html )
  banner: {
    image: "/images/shiftlogo.jpg",
    target: "/pages/mission_statement/",
    title: "Ride Calendar",
    alt: "The shift to bikes logo",
  },
  // hugo generated menu data 
  // a json version of what's in hugo.toml
  menu: menu,
  daysToFetch: {
    default: 7,
    max: 10, 
  }, 

  // generate start and 
  pedalp,
};
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
  defaultRideBanner: {
    alt: "Default image for a community organized ride.",
    image: "/img/banner_bikes_city.jpg"
  },
  // hugo generated menu data 
  // a json version of what's in hugo.toml
  // see buildMenu.html
  menu: menu,
  // hugo generated info on all pedalpalooza events
  // see buildPedalDates.html
  pedalp,
  // prev/next amounts
  // in the original it was 10 days by default 
  // a week feels better for the prev/next setup.
  daysToFetch: {
    default: 7,
    max: 10, 
  }, 
  // access to the backend.
  // in production it proxies through netlify.
  // using abspath makes it relative to localhost or to https://www.shift2bikes.org/
  // depending how the pages are hosted
  apiEndpoint: "/api/",
  // dayjs date
  getFestival(date) {
    const year = date.year().toString();
    return pedalp[year];
  },
};
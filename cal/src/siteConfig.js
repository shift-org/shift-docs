/**
 * global constants
 * ( we might want some of this customizable )
 */
import menu from 'extras/siteMenu.json'
import pedalp from 'extras/pedalDates.json'
//
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
dayjs.extend(customParseFormat);

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
  // for a ride when no image has been specified.
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
  // access to the backend.
  // in production it proxies through netlify.
  // using abspath makes it relative to localhost or to https://www.shift2bikes.org/
  // depending how the pages are hosted
  apiEndpoint: "/api/",
  title: "Shift",
  // dayjs date
  getFestival(date) {
    const year = date.year().toString();
    return pedalp[year];
  },
};
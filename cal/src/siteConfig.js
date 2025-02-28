/**
 * global constants
 * ( we might want some of this customizable )
 */
import menu from 'extras/siteMenu.json'
import pedalp from 'extras/pedalDates.json'
//
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import advancedFormat from 'dayjs/plugin/advancedFormat'
dayjs.extend(customParseFormat);
dayjs.extend(advancedFormat);  // for ordinal formatting ( 1st, 2nd )

// the calendar part of the menu has links to the pages we are already on
// so those are unneeded.
if (menu.calendar) {
  menu.about.kids["calendar-faq"] = menu.calendar.kids["calendar-faq"];
  delete menu.calendar;
}

export default {
  logo: "/img/cal/logos/shift-logo.svg#shift-logo",
  // for a ride when no image has been specified.
  defaultRideBanner: {
    alt: "Default image for a community organized ride.",
    image: "/img/banner_bikes_city.jpg",
    // TBD: target? or if some of them aren't clickable, maybe none should be.
  },
  // in a strange coincidence, banner matches the format of the pedalp.js data
  // ( see: generated site/buildPedalDates.html )   
  defaultListBanner: {
      alt: "The shift to bikes logo",
      image: "/images/shiftlogo.jpg",
      title: "Ride Calendar",
      // prevent it from being clickable fo now.
      // target: "/pages/mission_statement/",
  },
  // default page data when not provided by a particular view.
  defaultPageInfo: {
    title:  "Shift",
    desc: "Shift’s mission is to promote inclusive bike fun.",
    returnLink: false,
    // wait till the page loads to set a banner
    // that way we don't have to load some default image nobody ever sees.
    banner: null
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
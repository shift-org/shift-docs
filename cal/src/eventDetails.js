/**
 *  support functions for EventDetails.vue
 */
import dayjs from 'dayjs'
import dataPool from './dataPool.js'
import helpers from './calHelpers.js'
import siteConfig from './siteConfig.js'

export function buildPage(evt, calStart, fullPath) {
  const title = `${(evt.tinytitle || evt.title)} - Calendar - ${siteConfig.title}`;
  const desc = evt.printdescr || sliceWords(evt.details || evt.title || "");
  const banner = !evt.image ? siteConfig.defaultRideBanner : {
    image: evt.image,
    alt: `User-uploaded image for ${evt.title}`
  };
  return {
    page: {
      title,
      desc,
      banner,
      returnLink: {
        label: `<< All Events`,
        target: returnLink(calStart),
      }
    },
    evt,
    shortcuts: buildShortcuts(evt, fullPath),
  }; 
}

// -----------------------------------------------------------------------
// internal
// -----------------------------------------------------------------------
// shift today left (-1) or right (1) by a single day.
// currently, this queries a week of data to figure out what's before/after.
// TODO: make the server always return prev/next ids as part of pagination for a single event?
function shiftEvent(router, evt, dir) {
  if (!evt.date) {
    // to-do: disable buttons until the current event's data has loaded.
    console.log("can't browse dates until the date is valid");
  } else {
    // ask for a range of events before or after the current event.
    const range = makeRange(dayjs(evt.date), dir);
    // ( see also: shiftEvent )
    return dataPool.getRange(range.start, range.end).then((data) => {
      // find where our event is in the returned data.
      const thisIndex = data.events.findIndex(t => t.caldaily_id === evt.caldaily_id);
      // change our current view to the the next event.
      // ( the router won't reload the page b/c we're already here! )
      const next = data.events[thisIndex+dir];
      if (next) {
        router.push({params: { 
          caldaily_id: next.caldaily_id,
          slug: helpers.slugify(next),
        }}); 
      }
    });
  }
}

// -----------------------------------------------------------------------
// future improve by not chopping words?
function sliceWords(str, size = 250) {
  return str.length <= size ? str : str.substring(0, size) + "…";
}

// -----------------------------------------------------------------------
// given a date and a direction
// return a start and end pair
function makeRange(date, dir) {
  const daysToFetch = 7;
  if (dir < 0) {
    // start in the past, ending at date.
    const start = date.subtract(daysToFetch-1, 'day');
    return { start, end: date };
  } else if (dir > 0) {
    // start at date, end in the future.
    const end = date.add(daysToFetch, 'day');
    return { start: date, end };
  } else {
    throw new Error("expected valid direction for makeRange");
  }
}

// a link to return to the list of all events.
function returnLink(calStart) {
  const start = calStart || undefined;
  return {
    // the named route in calMain.js
    name: 'calendar', 
    // remove this page from history?
    replace: true,
    // the calendar doesn't have any params
    params: {},
    // query parameters after the path.
    query: {
      // to query the right stuff upon returning.
      start,
    }
  };
};

// -----------------------------------------------------------------------
// for the bottom nav panel:
function buildShortcuts(evt, fullPath) {
  return [{
    id: "prev",
    icon: "⇦",
    label: "Previous",
    nav(router) {
      shiftEvent(router, evt, -1);
    }
  },{
    id: "next",
    icon: "⇨",
    label: "Next",
    nav(router) {
      shiftEvent(router, evt, 1);
    }
  },{
    id: "add",
    icon: "+",
    label: "Add",
    url:"/addevent/"
  },{
    // https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share
    // activate the sharing api?
    // const shareData = {
    //   title: "MDN",
    //   text: "Learn web development on MDN!",
    //   url: "https://developer.mozilla.org",
    // };
    id: "share",
    icon: "⤴", 
    label: "Share",
    url: fullPath,
    attrs: {
      rel: "bookmark"
    }
  },{
    id: "export",
    icon: "⤵",
    label: "Export",
    // FIX: neither this nor the calendar version works
    // also... shouldn't this be a single day export not all of them?
    url: `/api/ics.php?id=${evt.id}`
  },{
    id: "favorites",
    icon: "☆",
    label: "Favorites"
  }];
}
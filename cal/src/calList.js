/**
 *  support functions for CalList.vue
 */
import dayjs from 'dayjs'
import dataPool from './support/dataPool.js'
import helpers from './calHelpers.js'
import siteConfig from './siteConfig.js'

export async function fetchRange(startDate) {
  const start = dayjs(startDate).startOf('day'); // if start is missing, dayjs returns now()
  if (!start.isValid()) {
    throw new Error(`Invalid start date: "${startDate}"`);
  }

  // fetch happens in background, over time.
  // it sets this.loading, which triggers an animation
  const end = start.add(6, 'day');
  const data = await dataPool.getRange(start, end);
  const days = groupByDay(start, end, data.events);
  return buildPage(start, end, days);
}

// ---------------------------------------------------------------------
// internal functions
// ---------------------------------------------------------------------

function buildPage(start, end, days) {
  return {
    page: {
      title: `${siteConfig.title} - Calendar - ${start.format("YYYY-MM-DD")}`,
      banner: pickBanner(start)
      // desc
    },
    range: {
      start, 
      end,
      days,
    },
    shortcuts: buildShortcuts(start),
  }; 
}

// ---------------------------------------------------------------------
// shift a week of events by adjusting the query and letting the view react.
// ( given calList.updateRange: if today is a monday
// we see monday-sunday; and then shift to the next/previous monday. )
function shiftRange(router, start, dir) {
  const q = { ...router.currentRoute.query }; // *copy* the query object.
  const next = start.add(dir, 'week');
  q.start = next.format("YYYY-MM-DD"); // add/replace the start.
  router.push({query: q});
}

// ---------------------------------------------------------------------
// for now, display the banner based on the requested start day
// ( could also show it if *any* date is in there.
function pickBanner(start) {
  let banner = siteConfig.defaultListBanner; 
  const fest = siteConfig.getFestival(start);
  if (fest) {
    const festStart = dayjs(fest.startdate);
    const festEnd = dayjs(fest.enddate);
    const startsWithin = helpers.within(start, festStart, festEnd);
    if (startsWithin) {
      banner = fest;
    }
  }
  return banner;
}

// ---------------------------------------------------------------------
function buildShortcuts(start) {
  return {
    prev(vm) {
      return {
        click() {
          // TBD: could maybe do a thing of evaluating the previous page
          // and unwinding rather than pushing the history in case they're
          // using navLeft as a back-button.
          shiftRange(vm.$router, start, -1);
        }
      };
    },
    next(vm) {
      return {
        click() {
          shiftRange(vm.$router, start, 1);
        }
      };
    },
    addevent:  "/addevent/",
    info: "/pages/mission_statement/",
    donate: "/pages/donate",
    favorites(vm) {
      return {
        click() {
          vm.$router.push({name: 'favorites'});  
        }
      };
    }
  };  
}

// ---------------------------------------------------------------------
// given api data returned by the server, generate a contiguous array of days.
// each day contains the dayjs date, and an array of events for that day.
// [ { date, events: [] }, ... ]
// this helps calList show every day of the week, including days with no events.
//
// NOTE: assumes that the incoming eventData is sorted.
//       assumes start, end are .startOf('day')
function groupByDay(start, end, eventData) {
  // create entries for every day between start and end ( inclusive )
  const length = end.diff(start, 'day') + 1;
  const allDays = Array.from({length}, (_, idx) => {
    return {
      date: start.add(idx,'day'),
      events: []
    };
  });
  eventData.forEach((evt,j) => {
    const date = dayjs(evt.date);
    const idx = date.diff(start, 'day');
    const currDay = allDays[idx]; // a reference to the entry; not a copy.
    currDay.events.push(evt);
  });
  // console.log(JSON.stringify(allDays));
  return allDays;
}
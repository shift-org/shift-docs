/**
 * support functions for CalList.vue
 */
import dayjs from 'dayjs'
import sources from './sources/sourcePool.js'
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
  const records = await sources.getRange(start, end, siteConfig.socialapi);
  return buildPage(start, end, records);
}

// ---------------------------------------------------------------------
// internal functions
// ---------------------------------------------------------------------

function buildPage(start, end, records) {
  const days = groupByDay(start, end, records);
  // search for the first item of type 'calfestival'
  // and use its value as the banner.
  // the format of it and the banner are (intentionally) the same.
  const banner = records.find(rec => rec.type === 'calfestival')
                  || siteConfig.defaultListBanner;
  return {
    page: {
      title: `${siteConfig.title} - Calendar - ${start.format("YYYY-MM-DD")}`,
      banner,
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
  const query = { ...router.currentRoute.query }; // *copy* the query object.
  const next = start.add(dir, 'week');
  query.start = next.format("YYYY-MM-DD"); // add/replace the start.
  router.push({query});
}

// ---------------------------------------------------------------------
function buildShortcuts(start) {
  return {
    prev(vm) {
      return {
        click() {
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
// generate a contiguous array of days.
// each day contains the 'moment', and an array of records for that day.
// [ { date, records: [] }, ... ]
// this helps calList show every day of the week, including days with no events.
//
// NOTE: assumes that the incoming records are sorted.
//       assumes start, end are .startOf('day')
function groupByDay(start, end, records) {
  // create entries for every day between start and end ( inclusive )
  const length = end.diff(start, 'day') + 1;
  const allDays = Array.from({length}, (_, idx) => {
    return {
      date: start.add(idx,'day'),
      records: []
    };
  });
  records.forEach((rec, j) => {
    const date = dayjs(rec.moment);
    const idx = date.diff(start, 'day');
    const currDay = allDays[idx]; // a reference to the entry; not a copy.
    currDay.records.push(rec);
  });
  // console.log(JSON.stringify(allDays));
  return allDays;
}
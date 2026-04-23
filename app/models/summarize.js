// -----------------------------------------------------------
// Generate json summaries of specific events on particular days.
// -----------------------------------------------------------
const db = require("../db");
const dt = require("../util/dateTime");
const { EventStatus } = require("./calConst");
const CalEvent = require("./calEvent");
const CalDaily = require("./calDaily");

// helper to generate a json summary of a caldaily, calevent joined pair.
function fullSummary(row, options, index) {
  const overview = CalEvent.getSummary(row, options);
  const summary = CalDaily.getSummary(row);
  const endtime = dt.to24HourString(CalEvent.getEndTime(row));
  // the php tacks the endtime to the ... end. so do we.
  const out = Object.assign(overview, summary, {endtime});
  // for search: Full count of results for pagination
  // tbd: maybe give it its own summary function
  // ( which calls fullSummary and then adds the fullcount )
  if (!index && row.fullcount !== undefined) {
    out.fullcount = row.fullcount;
  }
  return out;
}

function getDefaultOptions(overrideOptions) {
  const defaultOptions = {
    dayId: false,             // if specified, return a single instance of an event.
    seriesId: false,          // if specified, return all instances of an event.
    includePrivate: false,    // when true, requires the secret sent to the organizer in email
    onlyActive: false,        // when true, limits to active events; otherwise cancelled are included.
    summary: fullSummary,     // a "visitor" function called for each row returned by the query
    limit: false,             // integer to cap number of returned values ( for pagination )
    offset: false,            // integer to skip some number of returned values ( for pagination ) 
    newestFirst: false,       // unless true, older dates are shown before newer dates.
   };
   return Object.assign(defaultOptions, overrideOptions);
}

// promise rows of data pulled from the db.
function queryEvents(view, opt = {}) {
  const q = db.query(view)
  // filters:
  q.where(q => {
    if (opt.includePrivate) {
      q.where('password', opt.includePrivate);
    } else if (view === 'private_events') {
      throw new Error(`can't view private event data without specifying a secret`);
    }
    if (opt.firstDay) {
      q.where('eventdate', '>=', dt.toYMDString(opt.firstDay));
    }
    if (opt.lastDay) {
      q.where('eventdate', '<=', dt.toYMDString(opt.lastDay));
    }
    if (opt.seriesId) {
      q.where('id', opt.seriesId);
    }
    if (opt.dayId) {
      q.where('pkid', opt.dayId);
    }
    if (opt.onlyActive) {
      q.whereNot('eventstatus', EventStatus.Cancelled.key);
    }
  });
  // pagination:
  if (opt.limit) {
    q.limit(opt.limit)
  }
  if (opt.offset) {
    q.offset(opt.offset);
  }
  // sorting:
  if (opt.newestFirst !== 'unordered') {
    const sort = opt.newestFirst ? 'desc' : 'asc';
    q.orderBy('eventdate', sort);
    q.orderBy('eventtime', sort);
  }
  return q;
}

// visit every row, calling the summary function specified in options.
// returns an array of the data returned from that function.
function handleSummary(q, opt, log) {
  log && console.log(q.toSQL().toNative());
  return q.then(rows => rows.map((row, index) => {
    // for every returned row, call the summary function:
    // pass the options and the index of the data 
    return opt.summary(row, opt, index);
  }));
}

const summarize = {

  // Promises an array of published events
  // see getDefaultOptions for complete list of options
  events(options) {
    const defaults = getDefaultOptions();
    const combined = Object.assign(defaults, options);
    // if a view was specified use that,
    // otherwise use the default private or public view depending
    const view = combined.view || (combined.includePrivate ?
                                    'private_events' :
                                    'public_events');
    // query the db.
    const q = queryEvents(view, combined);
    // if desired, transform the returned data.
    return !combined.summary ? q : handleSummary(q, combined);
  },

  // Promises an object containing "total, past, upcoming" counts of uncancelled events.
  // any summary function is ignored.
  count(options) {
    const defaults = getDefaultOptions({onlyActive: true, newestFirst: 'unordered'});
    const combined = Object.assign(defaults, options);
    const currDate = db.currentDateString();
    // note: this uses the 'daily_events' view rather than raw 'status'
    // so that it can use the same summary options ( ex. eventdate, eventstatus )
    return queryEvents('daily_events', combined)
        .column(db.raw(`COUNT(*) as total`))
        .column(db.raw(`COUNT(CASE WHEN eventdate < ${currDate} THEN 1 END) AS past`))
        .column(db.raw(`COUNT(CASE WHEN eventdate >= ${currDate} THEN 1 END) AS upcoming`))
        .first();
  },

  // Promises an array of published events which match the search term.
  search(term, options) {
    const defaults = getDefaultOptions();
    const combined = Object.assign(defaults, options);
    const q = queryEvents('public_events', combined)
        .column(db.raw('*, COUNT(*) OVER() AS fullcount'))  // COUNT OVER is our pagination hack
        .where(q => {
          q.where('title', 'LIKE', `%${term}%`)
              .orWhere('descr', 'LIKE', `%${term}%`)
              .orWhere('name', 'LIKE', `%${term}%`);
        });
        // .whereRaw("title like '%??%'", [term])  // late binding experiment
    return handleSummary(q, combined);
  }
};

module.exports = { summarize };

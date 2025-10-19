// -----------------------------------------------------------
// Generate json summaries of specific events on particular days.
// -----------------------------------------------------------
const db = require("../knex");
const dt = require("../util/dateTime");
const { EventStatus, Review } = require("./calConst");
const CalEvent = require("./calEvent");
const CalDaily = require("./calDaily");

// helper to generate a json summary of a caldaily, calevent joined pair.
function fullSummary(row, options, index) {
  const overview = CalEvent.getOverview(row, options);
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
    dayId: false,             // ask for a specific instance of an event.
    seriesId: false,          // ask for all the instances of a specific event.
    includePrivate: false,    // requires the secret sent to the organizer
    includeDeleted: false,    // for testing, 
    excludeCancelled: false,  // by default, include cancelled rides.
    summary: fullSummary,
    limit: false,
    offset: false,
   };
   return Object.assign(defaultOptions, overrideOptions);
}

// promise an array of events and days joined together.
// WARNING: conflicting fields ( like modified ) may not be reliable.
function queryEvents(opt) {
  const q = db.query('calevent')
  // left join to account for a lack of days
  // both myaql and sqlite allow 'using' to collapse the shared id field.
  // ( which is needed to avoid null ids when there are no days )
  q.joinRaw('left join caldaily using(id)');
  q.where(q => {
    if (opt.includePrivate) {
      q.where('password', opt.includePrivate);
    } else {
      // when the secret is missing;
      // only show published rides.
      // zero and null are considered published.
      q.whereRaw('not coalesce(hidden, 0)')
    }
    if (opt.firstDay) {
      q.where('eventdate', '>=', db.toDate(opt.firstDay));
    }
    if (opt.lastDay) {
      q.where('eventdate', '<=', db.toDate(opt.lastDay));
    }
    if (opt.seriesId) {
      q.where('calevent.id', opt.seriesId);
    }
    if (opt.dayId) {
      q.where('pkid', opt.dayId);
    }
    // to handle left join, allow a null status to act as a blank
    const eventStatus = db.raw(`coalesce(eventstatus, '_')`);
    if (!opt.includeDeleted) {
      q.whereNot('review', Review.Excluded);
      // skipped is legacy, here for completeness and backwards compat.
      q.whereNotIn(eventStatus, [EventStatus.Delisted, EventStatus.Skipped]);
    }
    if (opt.excludeCancelled) {
      q.whereNot(eventStatus, EventStatus.Cancelled);
    }
  });
  // 
  if (opt.limit) {
    q.limit(opt.limit)
  }
  if (opt.offset) {
    q.offset(opt.offset);
  }
  return q.orderBy('eventdate');
}

// call the summary function specified in options on every returned row
function handleSummary(q, opt) {
  opt.log && console.log(q.toSQL().toNative());
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
    const combinedOptions = Object.assign(getDefaultOptions(), options);
    const q = queryEvents(combinedOptions);
    return !combinedOptions.summary ? q : handleSummary(q, combinedOptions);
  },

  // Promises an object containing "total, past, upcoming" counts of uncancelled events.
  // any summary function is ignored.
  count(options) {
    const combinedOptions = Object.assign(getDefaultOptions({excludeCancelled: true}), options);
    const currDate = db.currentDateString();
    return queryEvents(combinedOptions)
        .column(db.raw(`COUNT(*) as total`))
        .column(db.raw(`COUNT(CASE WHEN eventdate < ${currDate} THEN 1 END) AS past`))
        .column(db.raw(`COUNT(CASE WHEN eventdate >= ${currDate} THEN 1 END) AS upcoming`))
        .first();
  },

  // Promises an array of published events which match the search term.
  search(term, options) {
    const combinedOptions = Object.assign(getDefaultOptions(), options);
    const q = queryEvents(combinedOptions)
        .column(db.raw('*, COUNT(*) OVER() AS fullcount'))  // COUNT OVER is our pagination hack
        .where(function(q) {
          q.where('title', 'LIKE', `%${term}%`)
              .orWhere('descr', 'LIKE', `%${term}%`)
              .orWhere('name', 'LIKE', `%${term}%`);
        })
        // .whereRaw("title like '%??%'", [term])  // late binding experiment
    return handleSummary(q, combinedOptions);
  }
};

module.exports = { summarize };

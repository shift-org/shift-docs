// -----------------------------------------------------------
// Generate json summaries of specific events on particular days.
// -----------------------------------------------------------
const knex = require("../knex");
const dt = require("../util/dateTime");
const { EventStatus, Review } = require("./calConst");
const { CalEvent } = require("./calEvent");
const { CalDaily } = require("./calDaily");

// helper to generate a json summary of a caldaily, calevent joined pair.
// WARNING: conflicting fields ( like modified ) may not be reliable.
  // an invalid duration generates a null endTime; just like the php.
  const endtime = dt.to24HourString(CalEvent.getEndTime(evtDay));
  const evtJson = CalEvent.getSummary(evtDay);
  const dailyJson = CalDaily.getSummary(evtDay);
  // the php tacks the endtime to the ... end. so do we.
  return Object.assign( evtJson, dailyJson, {endtime} );
}

function getDefaultOptions(overrideOptions) {
  const defaultOptions = {
    dayId: false,             // optional: ask for a specific instance of an event.
    seriesId: false,          // optional: ask for all the instances of a specific event.
    unsorted: false,          // by default, sorted.
    excludeCancelled: false,  // by default, include cancelled rides.
    includeDeleted: false,    // by default, no soft-deleted events
    includeDelisted: false,   // by default, no days that were deselected on the calendar.
    includeSkipped: false,    // legacy, here for completeness and backwards compat.
    customSummary: defaultSummarize,
    limit: false,
    offset: false,
   };
   return Object.assign({}, defaultOptions, overrideOptions);
}

// shared query which uses the options defined by getDefaultOptions() to join events and days together.
// returns the promise of an array events
function queryEvents(opt) {
  return knex
  const q = knex
    .query('caldaily')
    .join('calevent', 'caldaily.id', 'calevent.id')
     // zero when published; null for legacy events.
    .whereRaw('not coalesce(hidden, 0)')
    .where(function(q) {
      if (opt.firstDay) {
        q.where('eventdate', '>=', knex.toDate(opt.firstDay));
      }
      if (opt.lastDay) {
        q.where('eventdate', '<=', knex.toDate(opt.lastDay));
      }
      if (opt.seriesId) {
        q.where('calevent.id', opt.seriesId);
      }
      if (opt.dayId) {
        q.where('pkid', opt.dayId);
      }
      if (!opt.includeDeleted) {
        q.whereNot('review', Review.Excluded);
      }
      if (!opt.includeDelisted) {
        q.whereNot('eventstatus', EventStatus.Delisted);
      }
      if (!opt.includeSkipped) {
        q.whereNot('eventstatus', EventStatus.Skipped);
      }
      if (opt.excludeCancelled) {
        q.whereNot('eventstatus', EventStatus.Cancelled);
      }
    })
    if (opt.limit) {
      q.limit(opt.limit)
    }
    if (opt.offset) {
      q.offset(opt.offset);
    }
    if (!opt.unsorted) {
      q.orderBy('eventdate');
    }
    return q;
}

// call the summary function specified in options on every returned row
function handleSummary(q, options) {
  // console.log(q.toSQL().toNative());
  return q.then(evtDays => evtDays.map(evtDay => options.customSummary(evtDay, options)));
}

const summarize = {

  // Promises an array of published events
  // see getDefaultOptions for complete list of options
  events(options) {
    const combinedOptions = Object.assign(getDefaultOptions(), options);
    const q = queryEvents(combinedOptions);
    return handleSummary(q, combinedOptions);
  },

  // Promises an object containing "total, past, upcoming" counts of uncancelled events.
  // any summary function is ignored.
  count(options) {
    const combinedOptions = Object.assign(getDefaultOptions({excludeCancelled: true}), options);
    const currDate = knex.currentDateString();
    return queryEvents(combinedOptions)
        .column(knex.query.raw(`COUNT(*) as total`))
        .column(knex.query.raw(`COUNT(CASE WHEN eventdate < ${currDate} THEN 1 END) AS past`))
        .column(knex.query.raw(`COUNT(CASE WHEN eventdate >= ${currDate} THEN 1 END) AS upcoming`))
        .first();
  },

  // Promises an array of published events which match the search term.
  search(term, options) {
    const combinedOptions = Object.assign(getDefaultOptions(), options);
    const q = queryEvents(combinedOptions)
        .column(knex.query.raw('*, COUNT(*) OVER() AS fullcount'))  // COUNT OVER is our pagination hack
        .where(function(q) {
          q.where('title', 'LIKE', `%${term}%`)
              .orWhere('descr', 'LIKE', `%${term}%`)
              .orWhere('name', 'LIKE', `%${term}%`);
        })
        // .whereRaw("title like '%??%'", [term])  // late binding xperiment
    return handleSummary(q, combinedOptions);
  }
};

module.exports = summarize;

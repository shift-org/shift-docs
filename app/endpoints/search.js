/**
 * Search: Finds one or more events based on search term (hopefully)
 * Used for Searching the calendar so people can find information about interesting rides.
 *
 * This endpoint supports two different queries:
 *   q=search_term (  )
 *   all=true ( search old events rather than only future events )
 *   l=number of events to return
 *   o=the index of the first result to return within all matching results
 *
 * For example:
 *   http://localhost:3080/api/search.php?q=prince
 *   https://localhost:4443/api/search.php?q=prince&qold=true
 *
 * In both cases it returns a list of events as a JSON object:
 *  {
 *    events: [ {...},  ... ]
 *    pagination: { offset, limit, fullcount }
 *  }
 *
 * If there is a problem the error code will be 400 ( perhaps 404? ) with a json response of the form:
 *  {
 *      "error": { "message": "Rides with 'term' not found." }
 *  }
 *
 *  # TODO add block for search
 */
const dayjs = require("dayjs");
const config = require("../config");
const { CalDaily } = require("../models/calDaily");
const { EventSearch } = require("../models/calConst");
const summarize = require("../models/summarize");
const validator = require('validator');

// the search endpoint:
exports.get = function(req, res, next) {
  const term = (req.query.q || "").trim();   // ?q=term   The search term
  const offset = readInt(req.query.o);  // &o=25
  const limit = readLimit(req.query.l);  // &l=50
  const searchOldEvents = (req.query.all === "true") || (req.query.all === "1");  // &all=1|true  Option to search historically (TBD)

  if (!term) {
    res.textError("missing search term");
  } else {
    // Search for the given search term, starting from today
    const startDate = dayjs().startOf('day');
    const options = {
      // when searching all events, don't specify a starting day
      firstDay: searchOldEvents && startDate,
      limit,
      offset, 
    };
    return summarize.search(term, options)
      .then(events => {
        // fullcount appears in every search result; its the same in every entry.
        const fullcount = events.length ? events[0].fullcount : 0;
        res.set(config.api.header, config.api.version);
        res.json({
          events,
          pagination: { 
              offset, limit, fullcount 
          }
        });
      }).catch(next);
  }
}

// treats non numbers as 0
// could use {gt: 1, lt: 4}  to ensure ranges
function readInt(i) {
  // validator uses strings. if 'i' is undefined, pass the validator a blank string.
  return !validator.isInt(i || "") ? 0 : validator.toInt(i);
}

// read the limit query parameter
function readLimit(i) {
  // try to read the int, and if its zero fallback to our default
  const want = readInt(i) || EventSearch.Limit;
  // don't allow more than our default
  return Math.min(want, EventSearch.Limit);
}

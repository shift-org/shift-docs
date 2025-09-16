/**
 * Search: Finds one or more events based on search term (hopefully)
 * Used for Searching the calendar so people can find information about interesting rides.
 *
 * This endpoint supports two different queries:
 *   q=search_term (  )
 *   &qold=true ( search old events rather than ones going forward )
 *
 * For example:
 *   http://localhost:3080/api/search.php?q=prince
 *   https://localhost:4443/api/search.php?q=prince&qold=true
 *
 * In both cases it returns a list of events as a JSON object:
 *  {
 *    events: [ {...},  ... ]
 *  }
 *
 * If there is a problem the error code will be 400 ( perhaps 404? ) with a json response of the form:
 *  {
 *      "error": { "message": "Rides with 'term' not found." }
 *  }
 *
 * See also:
 *  https://github.com/shift-org/shift-docs/blob/main/docs/CALENDAR_API.md#viewing-events
 *  # TODO add block for search
 */
const dayjs = require("dayjs");
const config = require("../config");
const { CalDaily } = require("../models/calDaily");
const { EventSearch } = require("../models/calConst");
const { getSummaries } = require("./events.js");

// the search endpoint:
exports.get = function(req, res, next) {
  const term = (req.query.q || "").trim();   // ?q=term   The search term
  const offset = parseInt(req.query.o, 10) || 0;  // &o=25
  const limit = parseInt(req.query.l, 10) || EventSearch.Limit; // &l=50
  const searchOldEvents = (req.query.all === "true") || (req.query.all === "1");  // &all=1|true  Option to search historically (TBD)

  if (term) {
    // Search for the given search term, starting from today
    const startDate = dayjs().startOf('day');
    return CalDaily.getEventsBySearch(startDate, term, limit, offset, searchOldEvents).then((dailies) => {
        return getSummaries(dailies).then((events) => {
          // fullcount appears in every
          const fullcount = events.length ? events[0].fullcount : 0;
          const pagination = getPaginationSearch(fullcount, limit, offset);
          res.json({
            events,
            pagination,
          });
        });
      }).catch(next);
  } else {
    res.textError("getEventsBySearch: no such time");
  }
}

function getPaginationSearch(count, limit, offset) {
  return {
    offset: offset,
    limit: limit,
    fullcount: count,
  };
}
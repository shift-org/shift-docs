/**
 * Search: Finds the current pedalpalooza ride count (hopefully)
 * Used for the footer to show the live number of rides and how many are upcoming.
 * It will return the total between the two dates, the number passed before today,
 * and the number of upcoming rides (might be zero)
 *
 * This endpoint supports two different query params:
 *   s= ( start date of rides desired )
 *   &e ( end date of rides desired )
 *
 * For example:
 *   http://localhost:3080/api/ridecount.php?s=2025-06-01&e=2025-08-31
 *   https://localhost:4443/api/ridecount.php?s=2025-06-01&e=2025-08-31
 *
 * In both cases it returns a list of events as a JSON object:
 *  {
 *    ride_count: {"total": 123, "past": 80, "upcoming": 42}
 *  }
 *
 * If there is a problem the error code will be 400 ( perhaps 404? ) with a json response of the form:
 *  {
 *      "error": { "message": "dating issues :D " }
 *  }
 *
 * See also:
 *  https://github.com/shift-org/shift-docs/blob/main/docs/CALENDAR_API.md#viewing-events
 */
const dayjs = require("dayjs");
const summarize = require("../models/summarize");

exports.get = function(req, res, next) {
  // todo: date format validation
  const start = req.query.s;
  const end = req.query.e;

  if (start && end) {
    // Search for the given search term, starting from today
    const firstDay = dayjs(start, "YYYY-MM-DD");
    const lastDay = dayjs(end, "YYYY-MM-DD");
    return summarize.count({
        firstDay, 
        lastDay
    }).then((ride_count) => {
      res.json({
        ride_count
      });
      res.set(config.api.header, config.api.version);
    }).catch(next);
  } else {
    res.textError("getRideCount: no such time");
  }
}

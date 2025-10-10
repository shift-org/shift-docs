/**
 * Ride Count: Finds the number of rides between two dates.
 * Used for the footer to show the live number of rides and how many are upcoming.
 * It will return the total between the two dates, the number passed before today,
 * and the number of upcoming rides (might be zero)
 *
 * This endpoint requires two query params:
 *   s= ( start date of rides desired )
 *   e= ( end date of rides desired )
 *
 * For example:
 *   http://localhost:3080/api/ride_count.php?s=2025-06-01&e=2025-08-31
 *   https://localhost:4443/api/ride_count.php?s=2025-06-01&e=2025-08-31
 *
 * In both cases it returns a list of events as a JSON object:
 *  {
 *    "total": 123, "past": 80, "upcoming": 42
 *  }
 *
 * If there is a problem the error code will be 400 ( perhaps 404? ) with a json response of the form:
 *  {
 *      "error": { "message": "dating issues :D " }
 *  }
 */
const dayjs = require("dayjs");
const summarize = require("../models/summarize");

// the endpoint:
exports.get = function(req, res, next) {
  const startDate = dayjs(req.query.s, "YYYY-MM-DD");
  const endDate = dayjs(req.query.e, "YYYY-MM-DD");

  if (!startDate.isValid() || !endDate.isValid()) {
    res.textError(`start date was ${startDate} and end date was ${endDate}.`);
  } else {
    return summarize.count({
        firstDay: startDate, 
        lastDay: endDate,
    }).then((ride_count) => {
      res.set(config.api.header, config.api.version);
      res.json(ride_count);
    }).catch(next);
  }
}

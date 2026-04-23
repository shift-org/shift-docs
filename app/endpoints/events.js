/**
 * Events: Displays one or more event times.
 * Used for browsing the calendar so people can find information about interesting rides.
 *
 * This endpoint supports two different queries:
 *   id=caldaily_id ( the time id )
 *   startdate=YYYY-MM-DD & enddate=YYYY-MM-DD
 *   &all=true ( to include soft deleted rides )
 *
 * For example:
 *   http://localhost:3080/api/events.php?id=1893
 *   https://localhost:4443/api/events.php?startdate=2023-03-19&enddate=2023-03-29
 *
 * In both cases it returns a list of events as a JSON object:
 *  {
 *    events: [ {...},  ... ]
 *  }
 *
 * If there is a problem the error code will be 400 with a json response of the form:
 *  {
 *      "error": { "message": "Error message" }
 *  }
 *
 * See also:
 *  https://github.com/shift-org/shift-docs/blob/main/docs/CALENDAR_API.md#viewing-events
 */
const config = require("../config");
const { fromYMDString, to24HourString, toYMDString } = require("../util/dateTime");
const { EventsRange } = require("../models/calConst");
const { summarize } = require("../models/summarize");
const validator = require('validator');

// the events endpoint:
exports.get = function(req, res, next) {
  const dayId = readInt(req.query.id);  // pkid
  let start = req.query.startdate;
  let end = req.query.enddate;
  if (dayId && start && end) {
    res.textError("expected only an id or date range"); // fix, i think its supposed be sending a json error.
  } else if (dayId) {
    // return the summary of a particular event on a particular day:
    return summarize.events({dayId}).then(events => {
      if (events.length == 0) {
        res.textError("no such day");
      } else  {
          // the caller wants an array; and we have an array containing a single element.
          res.set(config.api.header, config.api.version);
          res.json({events});
      }
    }).catch(next);
  } else {
    // return a range of dailies between two times:
    // strict is false to allow query parameters to be a bit loose in their specification.
    start = fromYMDString(start, {strict: false});
    end = fromYMDString(end, {strict: false});
    if (!start.isValid() || !end.isValid()) {
      res.textError("need valid start and end times");
    } else {
      // add 1 so days in range is inclusive
      // e.g. (2025-06-10 - 2025-06-01 = 9 days difference) + 1 day = 10 day range
      const range = end.diff(start, 'day') + 1;
      if (range < 1) {
        res.textError("end date cannot be before start date");
      } else if (range > EventsRange.MaxDays) {
        res.textError(`event range too large: ${range} days requested; max ${EventsRange.MaxDays} days`);
      } else {
        return summarize.events({
          firstDay: start,
          lastDay: end,
        }).then(events => {
            const pagination = getPagination(start, end, events.length);
            res.set(config.api.header, config.api.version);
            res.json({
              events,
              pagination,
          });
        }).catch(next);
      }
    }
  }
}

function readInt(i, opt) {
  return (i !== undefined) && validator.isInt(i, opt) && validator.toInt(i);
}

// expects days are dayjs objects
// and count is the number of events between the two
function getPagination(firstDay, lastDay, count) {
  // add 1 so days in range is inclusive
  const range = lastDay.diff(firstDay, 'day') + 1;

  const prevRangeStart = firstDay.subtract(range, 'day');
  const prevRangeEnd = lastDay.subtract(range, 'day');
  const prev = getEventRangeUrl(prevRangeStart, prevRangeEnd);

  const nextRangeStart = firstDay.add(range, 'day');
  const nextRangeEnd = lastDay.add(range, 'day');
  const next = getEventRangeUrl(nextRangeStart, nextRangeEnd);

  return {
    start: toYMDString(firstDay),
    end: toYMDString(lastDay),
    range, // tbd: do we need to send this? can client determine from start, end?
    events: count,
    prev,
    next,
  };
}

// return a url endpoint which requests the events
// between the passed start and end dayjs values
function getEventRangeUrl(start, end) {
  const startdate = toYMDString( start );
  const enddate = toYMDString( end );
  // the start and end, filtered through date formatting
  // should be safe to use as is, otherwise see: encodeURIComponent()
  return config.site.url("api",
    `events.php?startdate=${startdate}&enddate=${enddate}`);
}

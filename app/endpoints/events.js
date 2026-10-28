/**
 * Events: Displays one or more event times.
 * Used for browsing the calendar so people can find information about interesting rides.
 *
 * This endpoint supports two different queries:
 *   id=caldaily_id ( the time id )
 *   startdate=YYYY-MM-DD & enddate=YYYY-MM-DD
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
 * Errors are returned with a json response of the form:
 *  {
 *      "error": { "message": "Error message" }
 *  }
 *
 * See also:
 *  https://github.com/shift-org/shift-docs/blob/main/docs/CALENDAR_API.md#viewing-events
 */
const config = require("../config");
const { ErrBadRequest, ErrNotFound, StatusError } = require('shift-docs/util/errors');
const { toYMDString } = require("../util/dateTime");
const { CalEvent } = require("../models/calEvent");
const { CalDaily } = require("../models/calDaily");
const { EventsRange } = require("../models/newConst");
const handleCall = require('shift-docs/util/handleCall');
const { parseInt, parseYmd } = require('shift-docs/util/parse');

exports.get = handleCall(listEvents);

// the events endpoint:
function listEvents(req) {
  const pkid = parseInt(req.query.id);
  const start = parseYmd(req.query.startdate);
  const end = parseYmd(req.query.enddate);
  //
  if (pkid && (start || end)) {
    throw new ErrBadRequest("expected only an id or date range");
  }
  return pkid ? listDay(pkid) : listRange(start, end);
}

// promise the summary of a particular daily event
function listDay(pkid) {
  return CalDaily.getByDailyID(pkid).then((daily) => {
    if (!daily) {
      // the id didn't match a visible event: not found, rather than a bad request.
      // ( getByDailyID() also returns null for hidden events. )
      throw new ErrNotFound("no such time");
    }
    const events = getSummaries([daily]);
    return {
      events,
      // no paginiztion for single evnts.
    };
  });
}

  // promise a range of dailies between two times:
function listRange(start, end) {
  if (!start || !end || !start.isValid() || !end.isValid()) {
    throw new ErrBadRequest("need valid start and end times");
  }
  const range = end.diff(start, 'day') + 1; // add 1 to make test inclusive
  if (range < 1) {
    throw new StatusError(422, "end date cannot be before start date");
  }
  if (range > EventsRange.MaxDays) {
    throw new StatusError(413, `event range too large: ${range} days requested; max ${EventsRange.MaxDays} days`);
  }
  return CalDaily.getDateRange(start, end).then((dailies) => {
    const events = getSummaries(dailies);
    const pagination = getPagination(start, end, events.length);
    return {
      events,
      pagination,
    };
  });
}

// promise an array containing json-friendly summaries of all the passed CalDaily(s)
// see also: buildEntries()
function getSummaries(dailies) {
  // a cache because multiple dailies may have the same event.
  const events = new Map();
  return dailies.map((at) => {
    // summarize the event the first time we see it.
    if (!events.has(at.id)) {
      const evt = CalEvent.wrap(at);
      const evtJson = evt.getSummary();
      const endTime = evt.getEndTime(); // an invalid duration generates a null here.
      events.set(at.id, [evtJson, endTime]);
    }
    const [evtJson, endTime] = events.get(at.id);
    return Object.assign({}, evtJson, at.getSchedule(endTime));
  });
}
exports.getSummaries = getSummaries;

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

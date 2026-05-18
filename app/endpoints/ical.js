/**
 * ical: Return a ical file containing one or more rides.
 *
 * With no parameters, the file will contain a window of rides centered on the current day.
 * The parameter 'id' returns all of the days for that ride;
 * 'startdate' and 'enddate' (in YYYY-MM-DD format) returns a custom range of rides;
 * 'filename' customizes the name of the generated file ( the default name is in config.js. )
 * ( the special name of "none" will not generate an attachment )
 *
 *   https://localhost:4443/api/ical.php
 *   https://localhost:4443/api/ical.php?id=998
 *   https://localhost:4443/api/ical.php?startdate=2023-05-25&enddate=2023-06-25
 *   https://localhost:4443/api/ical.php?id=13&filename=triskaidekaphobia.ics
 *
 * See also:
 *   AllEvents.md
 */
const config = require("server/core/config");
const { buildCalEntry, buildClosingEvent } = require("server/model/ical");
const { sendCal } = require("server/support/calResponse");
const { parseBool, parseYmd, parseString } = require("server/util/parse");
const dt = require("server/util/dateTime");
//
const { CalEvent } = require("../models/calEvent");
const { CalDaily } = require("../models/calDaily");
const { EventsRange } = require("../models/calConst");

// the endpoint handler for all ical feeds.
exports.get = function(req, res, next) {
  // caldaily id for a single event
  const event_id = req.query.event_id;

  // calevent id for a series of events;
  // if series_id isn't provided, fallback to generic id
  const series_id = req.query.series_id || req.query.id;

  const start = parseYmd(req.query.startdate);
  const end = parseYmd(req.query.enddate);
  const includeDeleted = parseBool(req.query.all);
  const customName = parseString(req.query.filename) || "";
  const pedalp = customName.startsWith("pedalp");
  const cal = Object.assign({}, config.cal.shift, pedalp ? config.cal.pedalp : null);

  return getEventData(cal, event_id, series_id, start, end, includeDeleted).then(data => {
    const { filename, events } = data;
    if (pedalp) {
      events.push( buildClosingEvent(end) );
    }
    return respondWith(cal, res, customName || filename, events);
  }).catch(err => {
    // the code below uses strings for expected errors.
    // ex. a bad range; allow other things to be 500 server errors with stacks.
    if (typeof(err) !== 'string') {
      next(err);
    } else {
      res.status(400).send(err);
    }
  });
}

// promise a structure containing: filename and events.
// start and end are dayjs objects ( or false )
function getEventData(cal, event_id, series_id, start, end, includeDeleted) {
  let filename;
  let buildEvents;
  if (event_id) {
    // ex. shift-calendar-event-9300.ics
    filename = `${cal.filename}-event-${event_id}` + cal.ext;
    buildEvents = buildOne(event_id);
  } else if (series_id) {
    // ex. shift-calendar-series-6245.ics
    filename = `${cal.filename}-series-${series_id}` + cal.ext;
    buildEvents = buildSeries(series_id);
  } else if (start && end) {
    // ex. shift-calendar-2001-06-02-to-2022-01-01.ics
    filename = [cal.filename, 
                dt.toYMDString(start), "to", 
                dt.toYMDString(end)].join("-") + cal.ext;
    buildEvents = buildRange(start, end, includeDeleted);
  } else {
    // ex. shift-calendar.ics
    filename = cal.filename + cal.ext;
    buildEvents = buildCurrent();
  }
  return buildEvents.then(events => { return {filename, events} });
}

/**
 * Turn event entries into a http response.
 * @see https://datatracker.ietf.org/doc/html/rfc5545#section-3.6.1
 */
function respondWith(cal, res, filename, events) {
  // note: the php sets includes utf8 in the content type but...
  // according to  https://en.wikipedia.org/wiki/ICalendar
  // its default utf8, and mime type should be used for anything different.
  res.setHeader(config.api.header, config.api.version);
  sendCal(res, cal, events, filename);
}

// ---------------------------------
// these build "calendar entries":
// javascript objects that represent each v-event.
// ---------------------------------

// Promise a single occurrence of a single event in ical format as a string.
// id is a caldaily id.
function buildOne(id) {
  return CalDaily.getByDailyID(id).then((daily) => {
    if (!daily) {
      return Promise.reject("no such event");
    }
    return buildEntries([daily]);
  });
}

// Promise all of the occurrences of a single event in ical format as a string.
// id is a calevent id.
function buildSeries(id) {
  return CalDaily.getByEventID(id).then((dailies) => {
    if (!dailies.length) {
      return Promise.reject("no such events");
    }
    return buildEntries(dailies);
  });
}

// Promise some good range of past and future events in ical format as a string.
function buildCurrent() {
  const now = dt.getNow();
  const started = now.subtract(1, 'month');
  const ended = now.add(6, 'month');
  return CalDaily.getFullRange(started, ended).then((dailies) => {
    return buildEntries(dailies);
  });
}

// Promise a range of events in ical format as string,
// where start and end are dayjs objects.
function buildRange(start, end, includeDeleted) {
  if (!start.isValid() || !end.isValid()) {
    return Promise.reject("invalid dates");
  } else {
    const range = end.diff(start, 'day');
    if ((range < 0) || (range > EventsRange.MaxDays)) {
      return Promise.reject("bad date range");
    }
    const q = includeDeleted?
              CalDaily.getFullRange:
              CalDaily.getRangeVisible;
    return q(start,end).then((dailies)=>{
      return buildEntries(dailies);
    });
  }
}
// promise an array of cal entries, one per daily.
function buildEntries(dailies) {
  // a cache because multiple dailies may have the same event.
  const events = new Map();
  // generate the array of promises:
  return Promise.all( dailies.map((at) => {
    // make a promise for this event ( if we've never see the event before )
    if (!events.has(at.id)) {
      events.set(at.id, CalEvent.getByID(at.id));
    }
    // promise the entry after the event is available:
    return events.get(at.id).then(evt => buildCalEntry(evt, at));
  }));
}

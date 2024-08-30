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
const dayjs = require ('dayjs');
const wordwrap = require('wordwrapjs');
const nunjucks = require("../nunjucks");
const { CalEvent } = require("../models/calEvent");
const { CalDaily } = require("../models/calDaily");
const dt = require("../util/dateTime");
const config = require("../config");

module.exports = {
// endpoint export:
  get,
// export for testing:
  escapeBreak,
  replace,
};

// text|escapeBreak("HEADER") => HEADER:text
// text can be either a string or an array.
nunjucks.addFilter('escapeBreak', function(text, header) {
  header += ":";
  return !Array.isArray(text) ? 
          escapeBreak(header, text) : 
          escapeBreak(header, ...text);
});

// format a dayjs object in a ical friendly way.
nunjucks.addFilter('ical', function(d) {
  return dt.icalFormat(d);
});

function readBool(b) {
  return b === "true" || b === "1";
}

function readDate(d) {
  return d && dt.fromYMDString(d);
}

// the endpoint handler for all ical feeds.
function get(req, res, next) {
  const id = req.query.id; // a cal event id
  const start = readDate(req.query.startdate);
  const end = readDate(req.query.enddate);
  const includeDeleted = readBool(req.query.all);
  const customName = req.query.filename || "";
  const pedalp = customName.startsWith("pedalp");
  const cal = Object.assign({}, config.cal.base, pedalp? config.cal.pedalp: config.cal.shift);

  return getEventData(cal, id, start, end, includeDeleted).then(data => {
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
function getEventData(cal, id, start, end, includeDeleted) {
  let filename;
  let buildEvents;
  if (id && start && end) {
    // there's not a real need to validate the parameters like this
    // its probably over-zealous and could be removed.
    buildEvents = Promise.reject("expected either an id or date range");
  } else if (id) {
    // ex. shift-calendar-12414.ics
    filename = `${cal.filename}-${id}` + cal.ext;
    buildEvents = buildOne(id);
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
  if (!filename || filename === "none") {
    res.setHeader('content-type', `text/plain`);
  } else {
    res.setHeader('content-type', `text/calendar`);
    res.setHeader('content-disposition', `attachment; filename=\"${filename}\"`);
    res.setHeader('cache-control',`'public, max-age=${cal.maxage}`);
  }
  // tbd: maybe there's filter or something for nunjucks to add the carriage returns.
  const body = nunjucks.render('ical.njk', {cal, events});
  // replace the our "normalized" line break with what ical wants
  res.send(body.replaceAll("\n", "\r\n"));
}

// ---------------------------------
// these build "calendar entries":
// javascript objects that represent each v-event.
// ---------------------------------

// Promise all of the occurrences of a single event in ical format as a string.
// id is a calevent id.
function buildOne(id) {
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
  return CalDaily.getFullRange(started, ended).then((dailies)=>{
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
    if ((range < 0) || (range > 100)) {
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

// ---------------------------------
// ical formatting:
// ---------------------------------

// promise an array of cal entries, one per daily.
// see also: getSummaries()
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

/**
 * Turn an EventTime record into a single ical v-event.
 * @param  CalEvent  evt
 * @param  CalDaily  at
 * @return an object containing the elements needed for producing a v-event.
 * @see https://datatracker.ietf.org/doc/html/rfc5545#section-3.6.1
 */
function buildCalEntry(evt, at) {
  let startAt = evt.getStartTime(at.eventdate);
  if (!startAt.isValid()) {
    // provide a fallback if the start time was invalid
    // i dont know if this is a real issue, or just test data
    // php handles this just fine.
    startAt = dt.combineDateAndTime(at.eventdate, dt.from12HourString("12:00 PM"));
  }
  const endAt = evt.addDuration(startAt);
  const url = at.getShareable();
  let title = evt.title;
  // google calendar doesn't indicated canceled events well;
  // so force it to.
  if (at.isUnscheduled()) {
    title = "CANCELLED: " + title;
  }
  let news = at.getNewsFlash();
  if (!news) {
    news = "";  // no news is null news; we want an empty string.
  } else {
    news += "\n";
  }
  return {
    uid: "event-" + at.pkid + "@shift2bikes.org",
    url,
    summary: title,
    contact: evt.name,
    description: [
      news,
      evt.descr, evt.timedetails,
      evt.locend? "Ends at "+ evt.locend: null,
      url
    ],
    location: [
      evt.locname, evt.address, evt.locdetails
    ],
    status:  at.isUnscheduled() ? "CANCELLED": "CONFIRMED",
    start:    startAt,
    end:      endAt,
    created:  evt.created,
    modified: evt.modified,
    sequence: evt.changes + 1,
  };
}

/**
 * Create a fake closing event for pedalp.
 * @param  dayjs  lastDay of Pedalpalooza ( ex. the final day of the month )
 * @return an object containing the elements needed for producing a v-event.
 * @see buildCalEntry()
 */
function buildClosingEvent(lastDay) {
  const year = lastDay.year();
  const fakeModified = dayjs(`06-01-${year}`, "MM-DD-YYYY");
  const oneDayLater = lastDay.add(1, 'day');
  const url = "https://shift2bikes.org/calendar/";
  return {
    // usually: "event-123@shift2bikes.org"
    uid: `pedalpalooza-${year}-end@shift2bikes.org`,
    summary: `Pedalpalooza ${year} is over!`,
    contact: "bikecal@shift2bikes.org",
    description: 
    "We hope you've had a great bike summer and a great Pedalpalooza!!!\n"+
    "While Pedalpalooza is done, there is still plenty of bike fun to be found on the Shift2bikes website. "+
    "And you can also subscribe to the Shift community calendar to see those rides.\n"+ 
    `Visit ${url} for more details.`,
    location: "Portland, and beyond!",
    status:   "CONFIRMED",
    // create an all day event on the day after Pedalpalooza
    start:    oneDayLater.startOf('day'),
    end:      oneDayLater.endOf('day'),
    created:  fakeModified,
    modified: fakeModified,
    sequence: 1, 
    url,
  };
}


// ---------------------------------
// the internals:
// ---------------------------------

/**
 * Format a set of strings for ical, word-wrapping if necessary.
 * Note: the returned string uses bare newline, ical requires carriage returns,
 * the caller is responsible for adding those. ( ie. respondWith() )
 *
 * @param string        row     The lede text of the ical row, including a colon. ( ex. "SUMMARY:" )
 * @param array<string> strings One or more strings to join into newlines.
 *
 * https://datatracker.ietf.org/doc/html/rfc5545#section-3.3.11
 */
function escapeBreak(row, ...strings) {
  // join the passed strings, separating by semantic newlines
  let str = "";
  strings.forEach(el => {
    let s = el && el.trim();
    if (s) {
      s = replace(s);
      if (str.length) {
        str += "\\n"; // semantic newline.
      }
      str += s;
    }
  });

  // Lines of text SHOULD NOT be longer than 75 octets [bytes], excluding the line
  // break... a long line can be split between any two characters by inserting a CRLF
  // immediately followed by a single linear [space].
  // 74 is best to fit the required leading space of subsequent lines.
  //
  // note: only injecting "\n" here, respondWith() replaces those with "\r\n" later.
  const lines =  wordwrap.lines(row + str, { width: 74, break: true, noTrim: true });
  return lines.join("\n ");
}

function replace(str) {
  // An intentional formatted text line break MUST only be included
  // [as a] BACKSLASH, followed by a LATIN SMALL LETTER N...
  // A BACKSLASH ... MUST be escaped with another BACKSLASH character.
  // A COMMA ... MUST be escaped...
  // A SEMICOLON ... MUST be escaped...
  const replaceWhat = [ "\\", "\r\n", "\n", ',',  ';' ];
  const replaceWith = [ "\\\\", "\n", "\\n", "\\,", "\\;" ];
  return replaceWhat.reduce( (val, el, i) => val.replaceAll(el, replaceWith[i]), str );
}

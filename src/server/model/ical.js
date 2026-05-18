const wordwrap = require("wordwrapjs");
const nunjucks = require("server/support/nunjucks");
const dt = require("server/util/dateTime");
const EventData = require("server/model/eventData");
const DailyData = require("server/model/dailyData");

/**
 * Given info on a scheduled event ( an event from a particular series on a particular day )
 * return a ical v-event object.
 *
 * @param  CalEvent  evt
 * @param  CalDaily  optionalAt - if not specified, evt is expected to contain the scheduling info.
 *
 * @return an object containing the elements needed for producing a v-event.
 * @see https://datatracker.ietf.org/doc/html/rfc5545#section-3.6.1
 */
function buildCalEntry(evt, optionalAt) {
  const at = optionalAt || evt;
  let startAt = EventData.getStartTime(evt, at.eventdate);
  if (!startAt.isValid()) {
    // provide a fallback if the start time was invalid
    // i dont know if this is a real issue, or just test data
    // php handles this just fine.
    startAt = dt.combineDateAndTime(at.eventdate, dt.from12HourString("12:00 PM"));
  }
  const endAt = EventData.addDuration(evt, startAt);
  const url = DailyData.getShareable(at);
  let title = evt.title;
  // google calendar doesn't indicated canceled events well;
  // so force it to.
  if (DailyData.isCancelled(at)) {
    title = "CANCELLED: " + title;
  }
  let news = at.newsflash;
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
      evt.locend ? ("Ends at "+ evt.locend) : null,
      url
    ],
    location: [
      evt.locname, evt.address, evt.locdetails
    ],
    status:  DailyData.isCancelled(at) ? "CANCELLED" : "CONFIRMED",
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
  const fakeModified = dt.convert(`06-01-${year}`, "MM-DD-YYYY");
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

// ---------------------------------
// registration and exports
// ---------------------------------

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

module.exports = {
  // endpoint export:
  buildCalEntry,
  buildClosingEvent,
  Response,
  // export for testing:
  escapeBreak,
  replace,
};

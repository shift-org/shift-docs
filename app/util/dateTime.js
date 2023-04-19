// DateTime formatting helpers
//
// note: the mysql driver converts timestamp, date, and datetime values into javascript Date.
// https://github.com/mysqljs/mysql#type-casting

const dayjs = require("dayjs");
const customParseFormat = require("dayjs/plugin/customParseFormat");
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.tz.setDefault('America/Los_Angeles');

module.exports = {
  friendlyDate,     // out: "Mon, Aug 8th"
  icalFormat,       // out: "20230413T041000Z"

  toYMDString,      // out: "YYYY-MM-DD"
  to12HourString,   // out: "9:10 PM"
  to24HourString,   // out: "21:10:00"

  fromYMDString,    // in : "YYYY-MM-DD"
  from24HourString, // in : "9:10 PM"
  from12HourString,  // in : "21:10:00"

  combineDateAndTime,
  getNow,
};

// wraps "now" so it can be stubbed out by tests
function getNow() {
  return dayjs();
}

// format a Date or dayjs as a string "Mon, Aug 8th"
// returns "null" if the passed date is invalid.
function friendlyDate(d) {
  const out = dayjs(d); // convert or clone as dayjs
  return out.isValid() ? out.format('ddd, MMM D') + daySuffix(out.date()) : null;
}

// format a Date or dayjs in an ical utc friendly format.
// returns "null" if the passed date is invalid.
function icalFormat(d) {
  const out = dayjs(d); // convert or clone as dayjs
  // note: this takes into account daylight savings based on the day and month.
  return out.isValid() ? dayjs(out).utc().format('YYYYMMDD[T]HHmmss[Z]') : null;
}

// format a Date or dayjs in YYYY-MM-DD format ( ex. 2006-01-02 )
// returns "null" if the passed date is invalid.
function toYMDString(d) {
  const out = dayjs(d);
  return out.isValid() ? out.format('YYYY-MM-DD') : null;
}

// format a Date or dayjs as a string "1:31 PM".
// returns "null" if the passed date is invalid.
function to12HourString(d) {
  const out = dayjs(d);
  return out.isValid() ? dayjs(d).format('h:mm A') : null;
}

// format a Date or dayjs as a string "19:00:00".
// returns "null" if the passed date is invalid.
// tbd: do we really need to be handing seconds around?
function to24HourString(d) {
  const out = dayjs(d);
  return out.isValid() ? dayjs(out).format('HH:mm:ss') : null;
}

// turn a YYYY-MM-DD string ( ex. 2006-01-02 ) into a dayjs object.
// returns an "invalid" dayjs object if the string couldn't be parsed.
function fromYMDString(str) {
  // note: if str was undefined, dayjs would return "now()"
  // so pass null on any empty value to generate a '!.isValid()' dayjs object instead.
  return dayjs(str || null, 'YYYY-MM-DD', true); // strict parsing
}

// turn a string formatted as "19:00 PM" into a dayjs object.
// returns an "invalid" dayjs object if the string couldn't be parsed.
function from12HourString(str) {
  return dayjs(str || null, 'h:mm A', false);
}

// turn a string formatted as "19:00:00" into a dayjs object.
// returns an "invalid" dayjs object if the string couldn't be parsed.
function from24HourString(str) {
  return dayjs(str || null, 'HH:mm:ss', false); // not strict parsing, in case seconds are missing.
}

// expects two dayjs objects
// the second one is inspected for its time only and added to the first.
function combineDateAndTime(d, t) {
  const out = dayjs(d);
  return out.add(t.hour(), 'h').add(t.minute(), 'm');
}


// https://stackoverflow.com/questions/13627308/add-st-nd-rd-and-th-ordinal-suffix-to-a-number
function daySuffix(i) {
  let j = i % 10;
  let k = i % 100;
  if (j == 1 && k != 11) {
    return "st";
  } else if (j == 2 && k != 12) {
    return "nd";
  } else if (j == 3 && k != 13) {
    return "rd";
  } else {
    return "th";
  }
}

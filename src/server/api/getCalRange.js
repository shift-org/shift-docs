/**
 * ical: Return a CalResponse containing one or more rides.
 */
const config = require('server/core/config');
const summarize = require("server/core/summarize");
const { CalResponse } = require('server/support/calResponse');
const { buildCalEntry } = require('server/model/ical');
const dt = require('server/util/dateTime');
const { parseYmd, parseString } = require('server/util/parse');

module.exports = getCalRange;

// the exported request handler
function getCalRange(req) {
  const cal = config.cal.shift;
  const version = parseInt(req.params.version);
  const start = parseYmd(req.query.s) || getDefaultStart();
  const end = parseYmd(req.query.e) || getDefaultEnd(start);
  const customName = parseString(req.query.filename);
  const defaultName = `${cal.filename}${cal.ext}`;
  //
  if (!start.isValid() || !end.isValid()) {
    return Promise.reject(`Requested invalid event range: start date was ${start} and end date was ${end}.`);
  }
  const range = end.diff(start, 'month');
  if ((range < 0) || (range > 6)) {
    return Promise.reject(`Requested too large a range: start date was ${start} and end date was ${end}.`);
  }
  //
  return summarize.events({
    view: 'ical_feed',
    version: version,
    firstDay: start,
    lastDay: end,
    summary: buildCalEntry,
  }).then(events => {
    return new CalResponse(cal, events, customName || defaultName);
  });
}

function getDefaultStart() {
  const now = dt.getNow();
  return now.subtract(1, 'month');
}

function getDefaultEnd(start) {
  return start.add(6, 'month');
}
/**
 * Return a ical file containing one event on one day.
 */
const config = require("server/core/config");
const summarize = require("server/core/summarize");
const { buildCalEntry } = require("server/model/ical");
const { CalResponse } = require("server/support/calResponse");
const dt = require("server/util/dateTime");
const { parseYmd, parseString } = require("server/util/parse");

module.exports = getCalInstance;

// the exported request handler
function getCalInstance(req) {
  const cal = config.cal.shift;
  const version = parseInt(req.params.version);
  const seriesId = parseInt(req.params.seriesId);
  const exactDay = parseYmd(req.params.ymd);
  const customName = parseString(req.query.filename) || "";
  const defaultName = `${cal.filename}-series-${seriesId}-${dt.toYMDString(exactDay)}${cal.ext}`;

  return summarize.events({
      view: 'ical_feed',
      version: version,
      seriesId,
      exactDay,
      summary: buildCalEntry,
  }).then(events => {
    return new CalResponse(cal, events, customName || defaultName);
  });
}
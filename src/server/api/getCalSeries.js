/**
 * Return a ical file containing all the days of a given sseries.
 */
const config = require('server/core/config');
const summarize = require("server/core/summarize");
const { buildCalEntry } = require('server/model/ical');
const { parseString } = require('server/util/parse');
const { CalResponse } = require('server/support/calResponse');

module.exports = getCalSeries;

// the exported request handler
function getCalSeries(req) {
  const cal = config.cal.shift;
  const version = parseInt(req.params.version);
  const seriesId = parseInt(req.params.seriesId);
  const customName = parseString(req.query.filename);
  const defaultName = `${cal.filename}-series-${seriesId}${cal.ext}`;
  return summarize.events({
    view: 'ical_feed',
    version: version,
    seriesId,
    summary: buildCalEntry
  }).then(events => {
    if (!events.length) {
      return Promise.reject(`Requested unknown event series ${seriesId}`);
    }
    return new CalResponse(cal, events, customName || defaultName);
  });
}
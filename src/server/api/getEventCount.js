/**
 * return a count of the rides
 */
const { TextError } = require("server/support/errors");
const { parseYmd, parseInt } = require("server/util/parse");

function getEventCount(start, end, version) {
  const version = parseInt(req.params.version);
  const start = parseYmd(req.query.s);
  const end = parseYmd(req.query.e);
  // start and end are optional
  if ((start && !start.isValid()) || (end && !end.isValid())) {
    throw new TextError(`start date was ${start} and end date was ${end}.`);
  }
  // "total": 123, "past": 80, "upcoming": 42
  return summarize.count({
    firstDay: start,
    lastDay: end,
    onlyActive: true,
    version: version,
  });
}

module.exports = getEventCount;
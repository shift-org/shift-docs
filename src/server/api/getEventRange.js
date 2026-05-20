/**
 * return a range of events
 */
const config = require("server/core/config");
const summarize = require("server/core/summarize");
const { TextError } = require("server/support/errors");
const dt = require("server/util/dateTime");
const { getPaginatedRange } = require("server/util/misc");
const { parseYmd, parseInt } = require("server/util/parse");

module.exports = getEventRange;

// the exported request handler
// supports two query params: 's' & 'e' in YYYY-MM-DD format.
function getEventRange(req)  {
  const version = parseInt(req.params.version);
  const start = parseYmd(req.query.s) || getDefaultStart();
  const end = parseYmd(req.query.e) || getDefaultEnd(start);
  //
  if (!start.isValid() || !end.isValid()) {
    throw new TextError(`Requested invalid event range: start date was ${start} and end date was ${end}.`);
  }
  // FIX: for large ranges, pass as summarize.limit instead of erroring
  // search allows 'l' & 'o' parameters; so either do that
  // or support 'page=#' and multiply by max range.
  const range = end.diff(start, 'month');
  if ((range < 0) || (range > 6)) {
    throw new TextError(`Requested too large a range: start date was ${start} and end date was ${end}.`);
  }
  //
  const options = {
    firstDay: start,
    lastDay: end,
    version: version,
  };
  return summarize.events(options).then(events => {
    const pagination = getPagination(events, options);
    return {
      events,
      pagination,
    };
  });
}

function getDefaultStart() {
  const now = dt.getNow();
  return now.subtract(1, 'month');
}

function getDefaultEnd(start) {
  return start.add(6, 'month');
}

// expects days are dayjs objects
// and count is the number of events between the two
function getPagination(events, opt) {
  const { prev, next, range } = getPaginatedRange(opt.firstDay, opt.lastDay);
  return {
    start: dt.toYMDString(opt.firstDay),
    end: dt.toYMDString(opt.lastDay),
    range,
    events: events.length,
    prev: getEventRangeUrl(opt, ...prev),
    next: getEventRangeUrl(opt, ...next)
  };
}

// return a url endpoint which requests the events
// between the passed start and end dayjs values
function getEventRangeUrl(opt, start, end) {
  const s = dt.toYMDString(start);
  const e = dt.toYMDString(end);
  // the start and end, filtered through date formatting
  // should be safe to use as is, otherwise see: encodeURIComponent()
  return config.site.url(`api/v${opt.version}/events.json?s=${s}&e=${e}`);
}
/**
 * return a range of events
 */
const config = require("server/core/config");
const { EventsRange } = require("server/model/shorthands");
const { TextError } = require("server/support/errors");
const { getPaginatedRange } = require("server/util/misc");
const { parseYmd, parseInt } = require("server/util/parse");

module.exports = getEventRange;

// the exported request handler
// supports two query params: 's' & 'e' in YYYY-MM-DD format.
function getEventRange(req)  {
  const version = parseInt(req.params.version);
  const start = parseYmd(req.query.s);
  const end = parseYmd(req.query.e);
  if (!start.isValid() || !end.isValid()) {
    throw new TextError("need valid start and end dates");
  } else {
    const range = makeRange(start, end);
    if (range < 1) {
      throw new TextError("end date cannot be before start date");
    } else if (range > EventsRange.MaxDays) {
      // FIX: pass as summarize.limit instead of erroring
      // search allows 'l' & 'o' parameters; so either do that
      // or support 'page=#' and multiply by max range.
      throw new TextError(`event range too large: ${range} days requested; max ${EventsRange.MaxDays} days`);
    } else {
      return summarize.events({
        firstDay: start,
        lastDay: end,
        version: version,
      }).then(events => {
        const pagination = getPagination(start, end, events.length);
        return {
          events,
          pagination,
        };
      });
    }
  }
}

// return a day js range that includes the start and ending dates
function makeRange(start, end) {
  // (2025-06-10 - 2025-06-01 = 9 days) + 1 day = 10 day range
  return end.diff(start, 'day') + 1;
}

// expects days are dayjs objects
// and count is the number of events between the two
function getPagination(firstDay, lastDay, count) {
  const { prev, next, range } = getPaginatedRange(firstDay, lastDay);
  return {
    start: dt.toYMDString(firstDay),
    end: dt.toYMDString(lastDay),
    range,
    events: count,
    prev: getEventRangeUrl(...prev),
    next: getEventRangeUrl(...next)
  };
}

// return a url endpoint which requests the events
// between the passed start and end dayjs values
function getEventRangeUrl(start, end) {
  const startdate = dt.toYMDString(start);
  const enddate = dt.toYMDString(end);
  // the start and end, filtered through date formatting
  // should be safe to use as is, otherwise see: encodeURIComponent()
  // FIX FIX -- double check this url
  return config.site.url(`events?start=${startdate}&end=${enddate}`);
}
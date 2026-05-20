const summarize = require("server/core/summarize");
const { TextError } = require("server/support/errors");
const { parseInt, parseYmd } = require("server/util/parse");

module.exports = getEventInstance;

// the exported request handler
function getEventInstance(req)  {
  const version = parseInt(req.params.version);
  const seriesId = parseInt(req.params.seriesId);
  const exactDay = parseYmd(req.params.ymd);
  return summarize.events({
    seriesId,
    exactDay,
    version
  }).then(events => {
    if (!events.length) {
      throw new TextError(`Requested unknown event instance from series ${seriesId} on day ${exactDay}`);
    } else  {
      return {events};
    }
  });
}

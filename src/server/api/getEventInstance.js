const summarize = require("server/core/summarize");
const { TextError } = require("server/support/errors");
const { parseInt, parseYmd } = require("server/util/parse");

function getEventInstance(req)  {
  const version = parseInt(req.params.version);
  const seriesId = parseInt(req.params.seriesId);
  const exactDay = parseYmd(req.params.ymd);
  return summarize.events({
    seriesId,
    exactDay,
    version
  }).then(evt => {
    if (!evt) {
      throw new TextError("no such day");
    } else  {
      // caller expects an events array containing a single result.
      return {events: [evt]};
    }
  });
}

module.exports = getEventInstance;
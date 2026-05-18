const summarize = require("server/core/summarize");
const { TextError, RedirectError } = require("server/support/errors");
const { parseInt } = require("server/util/parse");

module.exports = handleLegacyRedirect;

/**
 * redirect from pkid to an event url
 * ( by throwing a RedirectError )
 */
function handleLegacyRedirect(req) {
  const version = parseInt(req.params.version);
  const pkid = parseInt(req.params.pkid);
  const ext = parseInt(req.params.ext); // doesn't include a dot
  if (!pkid) {
    throw new TextError("requires a day");
  } else {
    return summarize.reverseLookup(pkid, {version}).then(evt => {
      if (!evt) {
        throw new TextError(`unknown day ${pkid}`);
      } else {
        const seriesId = evt.id.toString();
        const ymd = dt.toYMDString(evt.eventdate);
        throw new RedirectError(`api/v${version}/events/${seriesId}/${ymd}.${ext}`);
      }
    });
  }
}

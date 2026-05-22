const validateEvent= require("server/api/validateEvent");
const { FieldError, TextError } = require("server/support/errors");
const { parseJson } = require("server/util/parse");

/**
 * shared code useful for creating and updating events.
 */
module.exports = { readEvent, handleEventError };

// parse data from the client into db ready values
// target contains id and secret
// values contains the db ready values
// throws on error.
function readEvent(req, options = {allowImages: false}) {
  // fix? the client uploads form data containing json
  // ( rather than raw json ) because multi-part forms require that.
  // a more rest-like api might use a separate put at some event/image url.
  const body = parseJson(req.body);
  if (!body) {
    throw new TextError("invalid request");
  }
  const { tgt, vals, err } = validateEvent(body);
  // organizers are not allowed to upload images for new events
  if (req.file && !options.allowsImage) {
    err.addError("image", "Images can only be added to existing events.");
  }
  if (err.count) {
    throw new FieldError(err.getErrors());
  }
  return { tgt, vals };
}

// catches thrown events to hide server details from the client.
function handleEventError(err) {
  // generate extra details for logging
  const json = JSON.stringify(tgt, null, " ");
  const logMessage = `createEvent error ${json} ${err.message}`;
  // but don't log during tests because some tests are expected to fail.
  if (!config.isTesting) {
    console.error(logMessage);
  }
  // respond with something generic.
  throw new TextError("Something went wrong creating the event");
}
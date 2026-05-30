/**
 * Removes an event from the calendar.
 * Expects a JSON post with a valid id and secret.
 * Throws on error.
 */
const db = require("server/core/db");
const { removeEntireSeries } = require("server/core/reconcile");
const { parseJson } = require("server/util/parse");
const { TextError } = require("server/support/errors");

module.exports = deleteEvent;

// the exported request handler
function deleteEvent(req) {
  const id = parseInt(req.params.seriesId);
  const data = parseJson(req.body);
  if (!data) {
    throw new TextError('Bad request');
  }
  if (!data.id) {
    throw new TextError('Missing id');
  }
  if (id !== data.id) {
    throw new TextError("Malformed request");
  }
  if (!data.secret) {
    throw new TextError('Missing secret');
  }
  return db.query.transaction(tx => {
    const seriesId = '' + data.id; // normalizes int to a string
    const secret = data.secret;
    return removeEntireSeries(tx, seriesId, secret);
  }).then(count => {
    // if no data existed to be removed
    // or the secret didn't match
    // return not found.
    if (!count) {
      throw new TextError('Event not found');
    }
    // all done.
    return {success: true};
  });
}
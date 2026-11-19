/**
 * Delete Event: Removes an event from the calendar.
 *
 * Expects a JSON post containing an `id` and its corresponding `secret`.
 * Responds with either HTTP success ( 200 ) or an HTTP error
 * and a json object containing a success or error message.
 *
 * See the CALENDAR_API.md for more details.
 */
const reconcile = require('shift-docs/support/reconcile');
const { uploader } = require('shift-docs/uploader');
const { parseJson } = require('shift-docs/util/parse');
const { ErrBadRequest, ErrForbidden } = require('shift-docs/util/errors');
const handleCall = require('shift-docs/util/handleCall');
const db = require('shift-docs/db');

// the front end sends a multi-part form post
// so... we need to handle that.
exports.post = [ uploader.makeHandler(), handleCall(postDelete) ];

function postDelete(req) {
  const { id, secret } = parseJson(req.body);
  if (!id) {
    throw new ErrBadRequest("Missing id");
  }
  if (!secret) {
    throw new ErrBadRequest("Missing secret");
  }
  return db.query.transaction((tx) => {
    return reconcile.revokeEntireSeries(tx, id, secret);
  })
  .then((count) => {
    // note: doesn't distinguish between invalid secret and unknown event.
    // think that's okay: we don't have to reveal more info about the event than needed.
    if (!count) {
      throw new ErrForbidden("Invalid secret, use link from email");
    }
    return { success: true };
  });
}
/**
 * Retrieve Event: Responds with a summary of an event and all of its scheduled days.
 *
 * Currently used only for displaying a ride to its organizer so they can edit the ride.
 * Expects an series id (and optionally, its matching secret) using url query parameters.
 *
 * For example:
 * https://localhost:3080/api/retrieve_event.php?id=595&secret=12e1c433836d6c92431ac71f1ff6dd97
 *
 * On success, responds with HTTP 200, and a json summary of the event.
 * On failure, responds with an HTTP error, abd a json error message.
 *
 * See the CALENDAR_API.md for more details.
 */
const { CalEvent } = require("../models/calEvent");
const { CalDaily } = require("../models/calDaily");
const { ErrBadRequest, ErrNotFound } = require('shift-docs/util/errors');
const { parseInt, parseString } = require('shift-docs/util/parse');
const handleCall = require('shift-docs/util/handleCall');

exports.get = handleCall(retrieveEvent);

function retrieveEvent(req) {
  const id = parseInt(req.query.id);
  const secret = parseString(req.query.secret);
  if (!id) {
    throw new ErrBadRequest("Missing id");
  }
  return CalEvent.getByID(id).then((evt) => {
    if (!evt) {
      throw new ErrNotFound("Event not found");
    }
    // the php version didnt error on invalid secret;
    // so this doesnt either ( private data is only returned with a valid secret )
    const includePrivate = evt.isSecretValid(secret);
    if (!evt.isPublished() && !includePrivate) {
      // act exactly as if unpublished events don't exist
      // ( unless you know the secret )
      throw new ErrNotFound("Event not found");
    }
    const statuses = CalDaily.getStatusesByEventId(id);
    return evt.getDetails(statuses, {includePrivate});
  });
}

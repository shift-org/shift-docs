/**
 * Retrieve Event: returns the summary of an event and all of its event times.
 * Currently used only for displaying a ride to its organizer so they can edit the ride.
 * Could also be used for requesting all days a particular event takes place.
 * Expects an calevent id (and optionally, its matching secret) using url query parameters.
 *
 * For example:
 * https://localhost:3080/api/retrieve_event.php?id=595&secret=12e1c433836d6c92431ac71f1ff6dd97
 *
 * On success, returns a json summary of event.
 * If there was an error ( for example, if the id was missing or the event wasn't found )
 * returns http 400 "Bad Request" with a json error response ( see errors.php )
 *
 *  See also:
 *  https://github.com/shift-org/shift-docs/blob/main/docs/CALENDAR_API.md#retrieving-public-event-data
 */
const config = require("../config");
const { CalEvent } = require("../models/calEvent");
const { CalDaily } = require("../models/calDaily");

exports.get = function get(req, res, next) {
  let id = req.query.id;
  let secret = req.query.secret;

  if (!id) {
    res.textError("Request incomplete, please pass an id in the url");
  } else {
    return CalEvent.getByID(id).then((evt) => {
      if (!evt) {
        res.textError("Event not found");
      } else if (evt.isDeleted()) {
        res.textError("Event was deleted");
      } else {
        // the php version didnt error on invalid secret;
        // so this doesnt either ( private data is only returned with a valid secret )
        const includePrivate = evt.isSecretValid(secret);
        const statuses = CalDaily.getStatusesByEventId(evt.id);
        evt.getDetails(statuses, {includePrivate}).then(details => {
          details.version = config.apiVersion;
          res.json(details);
        });
      }
    }).catch(next);
  }
}

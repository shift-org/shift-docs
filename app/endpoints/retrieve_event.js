/**
 * Retrieve Event: returns the summary of an event and all of its event times.
 * Used for displaying a ride to its organizer so they can edit the ride.
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
const { CalEvent } = require("../models/calEvent");

exports.get = function get(req, res, next) {
  let id = req.query.id;
  let secret = req.query.secret

  if (!id || !secret) {
    res.textError("Request unknown, please use the link from your event email.");
  } else {
    return CalEvent.getByID(id).then((evt) => {
      if (!evt || !evt.isSecretValid(secret)) {
        res.textError("Event not found, please use the link from your event email.");
      } else {
        evt.getDetails({includePrivate:true}).then((data)=> {
          res.json(data);
        });
      }
    }).catch(next);
  }
}

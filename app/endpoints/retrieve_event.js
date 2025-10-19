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
const dt = require("../util/dateTime");
const CalEvent = require("../models/calEvent");
const CalDaily = require("../models/calDaily");
const { summarize } = require("../models/summarize");

exports.get = function get(req, res, next) {
  const { id, secret } = req.query;
  if (!id) {
    res.textError("Request incomplete, please pass an id in the url");
  } else {
    return summarize.events({
      seriesId: id,
      // pass the secret if given:
      includePrivate: secret,
      // request the raw row data:
      summary: false,
    }).then(rows => {
      if (!rows.length) {
        res.textError("Event not found");
      } else {
        const out = CalEvent.getSummary(rows[0], {
          includePrivate: !!secret
        });
        // when left-joining; the status info can be missing
        // if there were no days added.
        if (rows[0].pkid !== null) { 
          out.datestatuses = rows.map(row => ({
            id: row.pkid.toString(),
            date: dt.toYMDString(row.eventdate),
            status: row.eventstatus,
            newsflash: CalDaily.getSafeNews(row),
          }));
        }
        res.set(config.api.header, config.api.version);
        res.json(out);
      }
    }).catch(next);
  }
}
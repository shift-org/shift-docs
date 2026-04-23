/**
 * Retrieve Event: returns the summary of an event and all of its event times.
 * Currently used only for displaying a ride to its organizer so they can edit the ride.
 * Could also be used for requesting all days a particular event takes place.
 * Expects an series id (and optionally, its matching secret) using url query parameters.
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
      includePrivate: secret, // the secret if given
      summary: false,         // the event view, without additional javascript transformation.
    }).then(rows => {
      if (!rows.length) {
        res.textError("Event not found");
      } else {
        const sum = CalEvent.getSummary(rows[0]);
        const print = getPrivateFields(rows[0]);
        const out = Object.assign(sum, print);

        // when left-joining; the status info can be missing
        // if there were no days added.
        if (rows[0].eventdate !== null) {
          out.datestatuses = rows.map(row => ({
            id: row.pkid.toString(),
            date: dt.toYMDString(row.eventdate),
            status: row.eventstatus,
            newsflash: row.newsflash,
          }));
        }
        res.set(config.api.header, config.api.version);
        res.json(out);
      }
    }).catch(next);
  }
}

// these fields are only in the data if the secret was valid.
function getPrivateFields(evt) {
  return {
    printdescr  : evt.printdescr,
    // turn 0/1 values into booleans
    hideemail   : !!evt.hideemail,
    hidephone   : !!evt.hidephone,
    hidecontact : !!evt.hidecontact,
    printemail  : !!evt.printemail,
    printphone  : !!evt.printphone,
    printweburl : !!evt.printweburl,
    printcontact: !!evt.printcontact,
  }
}
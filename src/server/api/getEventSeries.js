/**
 * retrieve the summary of an event and all of its event times.
 * used for displaying a ride to its organizer for editing.
 * can contain private data ( email, contact info ) if a valid secret is provided.
 */
const summarize = require("server/core/summarize");
const EventData = require("server/model/eventData");
const { TextError } = require("server/support/errors");
const { parseInt, parseString, parseYmd } = require("server/util/parse");
const dt = require("server/util/dateTime");

module.exports = getEventSeries;

// the exported request handler
function getEventSeries(req)  {
  const version = parseInt(req.params.version);
  const seriesId = parseInt(req.params.seriesId);
  const includePrivate = parseString(req.query.secret);
  return summarize.events({
      seriesId,
      includePrivate,  // optional secret
      summary: false,  // ask for the raw event data.
    }).then(rows => {
      // returns empty when a secret exists and it was incorrect.
      // fix: maybe it should return the data without private fields?
      if (!rows.length) {
        throw new TextError(`Requested unknown event ${seriesId}`);
      } else {
        const evt = rows[0]; // the event data exists in every row, so the first is as good as any.
        const sum = EventData.getSummary(evt);
        const private = includePrivate && getPrivateFields(evt);
        const out = Object.assign(sum, private);

        // note: when there are no scheduled days
        // the eventstatus will be null: otherwise its 'A' or 'C'.
        // ( and there will only be one row. )
        if (evt.eventstatus !== null) {
          out.datestatuses = rows.map(row => ({
            id: row.pkid.toString(),
            date: dt.toYMDString(row.eventdate),
            status: row.eventstatus,
            newsflash: row.newsflash,
          }));
        }
        return out;
      }
    });
}

// these fields are only in the data if the secret existed and matched.
function getPrivateFields(evt) {
  return {
    // 'published' is used by the client while editing.
    // ( the series table calls it "published"; 
    //   but it gets reported as "changes" for the ical feed;
    //   we name it back here, and turn it into a bool. 
    //   it also exists as !evt.hidden. )
    published   : evt.changes > 0,
    // include the email when editing the data.
    email       : evt.email,
    phone       : evt.phone,
    contact     : evt.contact,
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
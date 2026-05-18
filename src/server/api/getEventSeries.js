/**
 * retrieve the summary of an event and all of its event times.
 * used for displaying a ride to its organizer for editing.
 * can contain private data ( email, contact info ) if a valid secret is provided.
 */
const summarize = require("server/core/summarize");
const { TextError } = require("server/support/errors");
const { parseInt, parseString, parseYmd } = require("server/util/parse");

function getEventSeries(req)  {
  const version = parseInt(req.params.version);
  const seriesId = parseInt(req.params.seriesId);
  const includePrivate = parseString(req.query.secret); // optional
  if (!id) {
    throw new TextError("Request incomplete, please pass an id in the url");
  }
  // note: summarize returns empty when a secret was provided and it doesn't match.
  // fix: maybe it should return the data without private fields?
  return summarize.events({
      seriesId,
      includePrivate,  //
      summary: false,  // ask for the raw event data.
    }).then(rows => {
      if (!rows.length) {
        throw new TextError(`Event ${seriesId} not found`);
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

module.exports = getEventSeries;

// these fields are only in the data if the secret existed and matched.
function getPrivateFields(evt) {
  return {
    // published isn't included by the summary
    // but it's used by the manage endpoint.
    published   : evt.published,
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
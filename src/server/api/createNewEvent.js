const { newEventData } = require("server/core/reconcile");
const { TextError, FieldError } = require("server/support/errors");
const { readEvent, handleEventError } = require("./readEvents");

module.exports = createNewEvent;

// the exported request handler
function createNewEvent(req) {
  const { tgt, vals } = readEvent(req);
  if (tgt.id || tgt.seriesId) {
    throw new TextError("Malformed request");
  }
  return handleCreate(vals).catch(handleEventError);
}

// promises an object with { id: seriesId }
// after creating a new event in the db,
// storing the (validated) event values and days,
// and sending an email to the organizer with a secret edit link.
async function handleCreate(vals) {
  // the returned tgt will always have a valid id
  const tgt = await db.query.transaction(tx => {
    const { event, days } = vals;
    return newEventData(tx, event, days);
  });
  await sendConfirmationEmail(tgt.seriesId, tgt.password, vals.event);
  return {
    id: tgt.seriesId.toString(),
    // return the change counter, increments each time the data changes.
    changes: tgt.published,
    // doesn't return secret; that should only go through the email.
  };
}

// promise to email the organizer about a new event.
// caller should wait on the result in order to catch any errors.
// evt is the validated data stored to the db.
function sendConfirmationEmail(id, password, evt) {
  const url = config.site.url('addevent', `edit-${id}-${password}`);
  const subject = `Shift2Bikes Secret URL for ${evt.series.title}`;
  const logMessage = `Sending confirmation for ${url}...`
  if (!config.isTesting) {
    console.debug(logMessage);
  }
  //
  // FIX: have to get andrew's changes here
  //
  const support= config.email.support;
  const body = nunjucks.render('email.njk', {
    organizer: evt.series.organizer,
    title: evt.series.title,
    url,
    help: config.site.helpPage(),
    support: support.address || support, // a string or object
  });
  if (!config.isTesting) {
    console.debug("confirmation email body:\n", body);
  }
  return emailer.sendMail({
    subject,
    text: body,
    to: {
      name: evt.series.organizer,
      address: evt.private.private_email,
    },
    from: config.email.sender,
    replyTo: config.email.support,
    bcc: config.email.moderator, // backup copy for debugging and/or moderating
    // html
    // attachments
  });
}

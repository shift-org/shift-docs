const readEvent = require("server/api/readEvent");
const config = require('server/core/config');
const db = require("server/core/db");
const { newEventData } = require("server/core/reconcile");
const emailer = require("server/support/emailer");
const { TextError } = require("server/support/errors");
const nunjucks = require("server/support/nunjucks");
const dt = require("server/util/dateTime");

module.exports = createNewEvent;

// the exported request handler:
// promises an object with { id: seriesId }
// after creating a new event in the db,
// storing the (validated) event values and days,
// and sending an email to the organizer with a secret edit link.
async function createNewEvent(req) {
  const input = readEvent(req);
  // we don't expect the client to send a secret or id
  // and we don't want to use that data if it gave it to us.
  if (input.id || input.secret) {
    throw new TextError("Malformed request");
  }
  const { event, schedule } = input;
  const next = await db.query.transaction(tx => {
    return newEventData(tx, event, schedule);
  });
  await sendConfirmationEmail(next.id, next.secret, event, schedule);
  return {
    id: next.id.toString(),
    image: null,
    published: false,
    // doesn't return secret; that should only go through the email.
  };
}

// promise to email the organizer about a new event.
// caller should wait on the result in order to catch any errors.
// evt is the validated data stored to the db.
function sendConfirmationEmail(id, secret, evt, schedule) {
  const url = config.site.url('addevent', `edit-${id}-${secret}`);
  const subject = `Shift2Bikes Secret URL for ${evt.series.title}`;
  const logMessage = `Sending confirmation for ${url}...`
  if (!config.isTesting) {
    console.info(logMessage);
  }
  const dates = schedule
    .filter(d => d.is_scheduled)
    .map(d => dt.friendlyDate(d.ymd))
    .join('; ');
  const time = dt.to12HourString(dt.from24HourString(evt.series.start_time));
  const start = evt.location[0];
  const location = [start.place_name, start.address].filter(Boolean).join(', ');
  const support = config.email.support;
  const body = nunjucks.render('email.njk', {
    organizer: evt.series.organizer,
    title: evt.series.title,
    date: dates,
    time,
    location,
    url,
    help: config.site.helpPage(),
    support: support.address || support, // a string or object
  });
  if (!config.isTesting) {
    console.info("confirmation email body:\n", body);
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

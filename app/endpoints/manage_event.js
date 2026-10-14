/**
 *  Manage Event: Updates a new or existing event and its associated times.
 *  Used by the organizer when they save or edit a ride.
 *  Expects a form/multipart upload with two parts: json and file[].
 *
 *  You can use curl to post some json for testing. For example:
 *    curl -k -H 'Content-Type: application/json' -X POST --data-binary \
 *    "@manageEvent.json" https://localhost:4443/api/manage_event.php
 *
 *  On success, it will return a summary of the events and its times.
 *  If there is a problem, it returns a set of 'fieldErrors' ( see errors.js )
 *
 *  See also:
 *    https://github.com/shift-org/shift-docs/blob/main/docs/CALENDAR_API.md#managing-events
 *    https://localhost:4443/addevent/edit-$event_id-$secret
 *    /site/themes/s2b_hugo_theme/static/js/cal/addevent.js
 */
const { parseJson } = require('shift-docs/util/parse');
const newValidator = require('shift-docs/support/eventValidator');
const { checkEvent, writeEvent, writeImage } = require('shift-docs/support/requestedEvent');
const { ErrorCollector, FormError, ErrNotFound } = require('shift-docs/util/errors');
const { uploader } = require('shift-docs/uploader');
const handleCall = require('shift-docs/util/handleCall');
const { Area, Audience } = require('shift-docs/models/calConst');
const db = require('shift-docs/db');
const reconcile = require('shift-docs/support/reconcile');
const config = require('shift-docs/config');
// for sendConfirmationEmail
const dt = require('shift-docs/util/dateTime');
const emailer = require('shift-docs/emailer');
const nunjucks = require('shift-docs/nunjucks');

// read multipart (and curl) posts.
exports.post = [ uploader.makeHandler(), handleCall(handleRequest) ];

/**
 * read the data posted to this endpoint.
 * - req.body contains parsed json.
 * - req.file might exist if an image was uploaded.
 * throws on error.
 */
async function handleRequest(req) {
  const input = parseJson(req.body);
  const errors = new ErrorCollector();
  const v = newValidator(input, errors);
  const values = v.validateInput({
    defaultArea: Area.Portland,
    defaultAudience: Audience.General,
    defaultDistance: null,
    defaultLoop: false,
    defaultSaftey: false
  });
  if (!input.id) {
    v.validateTerms();
    if (req.file) {
      errors.addError("image", "Images can only be added to existing events.");
    }
  }
  if (errors.hasErrors()) {
    throw new FormError(errors.getErrors());
  }
  return !input.id ?
    createEvent(values) :
    updateEvent(input, values, req.file);
}

function createEvent(values) {
  const { event, schedule } = values;
  return db.query.transaction((tx) => {
    return reconcile.newEventData(tx, event, schedule);
  }).then((next) => {
    const { id, secret } = next;
    return sendConfirmationEmail(id, secret, event, schedule).then((_) => {
      return {
        id: id.toString(),
        // image: none
        published: false,
        // secret: only sent in the email
      };
    });
  });
}

// update all the data, or throws if it can't.
// promises an object containing { id, published, image(url) }
async function updateEvent(input, values, fileData) {
  const { id, secret } = input;
  // validate id and secret while determining publication count
  const prevPublished = await checkEvent(id, secret);
  if (prevPublished === null) {
    throw new ErrNotFound("unknown event");
  }
  // write the (validated) event data, updating the publication count
  const { event, schedule } = values;
  await writeEvent(id, event, schedule, 1 + prevPublished);
  // then write the image data
  const image = await (fileData && writeImage(id, fileData));
  // return the smallest bit of data the client needs in response.
  return {
      id: id.toString(),
      image: image,
      published: true,
  };
}

// promises a sent email
// evt is the prepared table data
function sendConfirmationEmail(id, secret, evt, schedule) {
  // direct access to the server form:
  // const url = config.site.url(`api/v2/events/${id}.html?secret=${secret}`);
  // backcompat access: requires a redirect somewhere
  const url = config.site.url('addevent', `edit-${id}-${secret}`);
  const subject = `Shift2Bikes Secret URL for ${evt.series.title}`;
  const logMessage = `Sending confirmation for ${url}...`;
  if (!config.isTesting) {
    console.info(logMessage);
  }
  const dates = schedule
    .filter((d) => d.is_scheduled)
    .map((d) => dt.friendlyDate(d.ymd))
    .join("; ");
  const time = dt.to12HourString(dt.from24HourString(evt.series.start_time));
  const start = evt.location[0];
  const location = [start.place_name, start.address].filter(Boolean).join(", ");

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

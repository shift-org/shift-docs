/**
 *  Manage Event: Updates a new or existing event and its associated times.
 *  Used by the organizer when they save or edit a ride.
 *  Expects a form/multipart upload with two parts: json and file[].
 *
 *  You can use curl to post some json for testing. For example:
 *    curl -k -H 'Content-Type: application/json' -X POST --data-binary \
 *    "@manageEvent.json" https://localhost:4443/api/manage_event.php
 *
 *  On failure, it returns a set of 'fieldErrors' ( see errors.js )
 *  On success, it returns: {
 *     id: seriesId ( as a string! )
 *     published: if the event is visible this is true, otherwise omitted.
 *     image: if the image changed this is the full url, otherwise omitted.
 *  }
 *
 *  When a new event is created it sends an email with an edit link
 *  containing the new id and the event's secret password.
 *
 *  See also:
 *    https://github.com/shift-org/shift-docs/blob/main/docs/CALENDAR_API.md#managing-events
 *    https://localhost:4443/addevent/edit-$event_id-$secret
 *    /site/themes/s2b_hugo_theme/static/js/cal/addevent.js
 */
const { uploader } = require("../uploader");
const validator = require('validator');
const config = require("../config");
const db = require("../db");
const dt = require("../util/dateTime");
const emailer = require("../emailer");
const nunjucks = require("../nunjucks");
const Reconcile = require("../models/reconcile")
const { safeParse, validateEvent } = require("../models/calEventValidator");

// read multipart (and curl) posts.
exports.post = [ uploader.makeHandler(), handleRequest ];

/**
 * read data the posted to this endpoint.
 * req.body contains parsed json.
 * req.file might exist if an image was uploaded.
 *
 * for things like validation errors, handleRequest() "successfully" generates a 400 status.
 * it should only reject due to things like database or programmer errors.
 */
function handleRequest(req, res, next) {
  // fix? the client uploads form data containing json
  // ( rather than raw json ) because multi-part forms require that.
  // a more rest-like api might use a separate put at some event/image url.
  const body = safeParse(req.body);
  if (!body) {
    return res.textError("invalid request");
  }
  // parse for errors *and* transform body into db ready values
  // target contains id and secret
  // values contains the db ready values
  // errors has any validation issues
  const { tgt, vals, err } = validateEvent(body);
  // the client code doesnt allow organizers to upload the image for new events
  // ensuring that's the case here, simplifies the file handling (below)
  if (req.file && !tgt.seriesId) {
    err.addError("image", "Images can only be added to existing events.");
  }
  if (err.count) {
    return res.fieldError(err.getErrors());
  } else if (tgt.seriesId && !tgt.password) {
    res.textError("Missing secret, use the link sent to you in email");
  } else if (tgt.password && !tgt.seriesId) {
    res.textError("Malformed request, use the link sent to you in email");
  } else {
    const promise = !tgt.seriesId ?
      handleCreate(vals) :
      handleUpdate(tgt, req.file, vals);
    return promise.then(out => {
      res.set(config.api.header, config.api.version);
      res.json(out);
    }).catch(err => {
      const logMessage = `manage_event error ${tgt} ${err.message}`;
      //if (!config.isTesting) {
        console.error(logMessage);
      // }
      res.textError("Something went wrong, use the link sent to you in email or contact support");
    });
  }
}

// promises an object with { id: seriesId }
// after creating a new event in the db,
// storing the (validated) event values and days,
// and sending an email to the organizer with a secret edit link.
async function handleCreate(vals) {
  // the returned tgt will always have a valid id
  const tgt = await db.query.transaction(tx => {
    const { event, days } = vals;
    return Reconcile.newEvent(tx, event, days);
  });
  await sendConfirmationEmail(tgt.seriesId, tgt.password, vals.event);
  // doesn't return secret; that should only go through the email.
  return {
    id: tgt.seriesId.toString()
  };
}

// promises an object with { id, image, published: true }
async function handleUpdate(src, fileData, vals) {
  // update all the data; throws if it can't.
  // ( in which case nothing gets saved. )
  const tgt = await db.query.transaction(tx => {
    const { seriesId, password } = src;
    const { event, days } = vals;
    return Reconcile.updateEvent(tx, seriesId, password, event, days);
  });
  // doing this outside of the transaction
  // TBD: might consider catching problems and notifying the user
  // without a full error. ex. their data is saved; just not the image.
  const newImage = await saveImageToDisk(tgt.seriesId, fileData);
  if (newImage) {
    // todo: a way of clearing the image?
    await Reconcile.updateImage(db.query, tgt.seriesId, newImage);
  }
  // if we got here... all must be well.
  return {
    id: tgt.seriesId.toString(),
    image: newImage && config.image.url(newImage.filename),
    published: true, // saving implicitly publishes; returns true for backcompat.
  };
}

// save the uploaded file (if any)
// promise the name, extension, and unique filename
// ex. { name: "123", ext: ".png", filename: "123-5.png" }
// ( errors are handled inside uploader.js )
async function saveImageToDisk(seriesId, fileData) {
  if (!fileData) {
    return false;
  }
  // the image gets written to disk as "id.ext"
  const f = await uploader.write(fileData, seriesId.toString());
  // extract just the name and .ext data.
  const { name, ext } = f;
  // we use the image sequence number to disrupt the browser's cache
  // but here, the client just needs to know something changed.
  // we stamp the image with the time b/c its guaranteed to be unique.
  // when the user next asks for the event, it'll return real, the updated sequence id.
  // [ doing this saves us from having to query the results of the update here ]
  const unique = dt.icalFormat(dt.getNow());
  const filename = `${name}-${unique}${ext}`;
  return {
    name,
    ext,
    filename,
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
  const support= config.email.support;
  const body = nunjucks.render('email.njk', {
    organizer: evt.series.organizer,
    title: evt.series.title,
    url,
    help: config.site.helpPage(),
    support: support.address || support, // a string or object
  });
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
  }).then(res => {
    const logMessage = `Sent email: ` + JSON.stringify({
      date: dt.getNow().toString(),
      organizer: evt.series.organizer,
      email: evt.private.private_email,
      title: evt.series.title,
      url: url,
    }, null, " ");
    if (!config.isTesting) {
      console.log(logMessage);
    }
    return res;
  });
}

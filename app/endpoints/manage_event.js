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
 *     id: seriesId 
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
const db = require("../knex");
const emailer = require("../emailer");
const nunjucks = require("../nunjucks");
const Reconcile = require("../models/reconcile")
const { validateEvent } = require("../models/calEventValidator");

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
  let body = req.body;
  // fix? the client uploads form data containing json
  // ( rather than raw json ) because multi-part forms require that.
  // a more rest-like api might use a separate put at some event/image url.
  if (body && body.json) {
    body = safeParse(body.json);
  }
  if (!body) {
    return res.textError("invalid request");
  }
  // parse for errors *and* transform body 
  // into db friendly field names.
  const { target, values, errors } = validateEvent(body);
  // the client code doesnt allow organizers to upload the image for new events
  // ensuring that's the case here, simplifies the file handling (below)
  if (req.file && !target.seriesId) {
    errors.addError("image", "Images can only be added to existing events.");
  }
  if (errors.count) {
    return res.fieldError(errors.getErrors());
  } else if (target.seriesId && !target.password) {
    res.textError("Missing secret, use link from email");  
  } else if (target.password && !target.seriesId) {
    res.textError("Malformed request, use link from email");  
  } else {
    const promise = !target.seriesId ? 
      handleCreate(values) : 
      handleUpdate(target, req, values);
    return promise.then(out => {
      if (!out) {
        res.textError("Invalid event, use link from email");
      } else {
        res.set(config.api.header, config.api.version);
        res.json(out);
      }
    }).catch(next);
  }
}

// promises an object with { id: seriesId }
// after creating a new event in the db,
// storing the (validated) event values and days,
// and sending an email to the organizer with a secret edit link.
async function handleCreate(vals) {
  const tgt = await db.query.transaction(async (tx) => { 
    const tgt = await Reconcile.newEvent(tx, vals.event);
    await Reconcile.updateDays(tx, tgt.seriesId, vals.status);
    return tgt;
  });
  await sendConfirmationEmail(tgt.id, tgt.password, vals.event);
  // don't return secret; that should only go through the email.
  return { id: tgt.seriesId };
}

// promises an object with { id, published: true, image }
async function handleUpdate(tgt, req, vals) {
  const exists = await Reconcile.selectEvent(db.query, tgt.seriesId, tgt.password);
  if (!exists) {
    return false; // ex. invalid secret or no such id
  }
  const { published, nextChange } = exists;
  const newImage = await saveImage(tgt, nextChange, req);
  if (newImage) {
    vals.event.image = newImage;
  }
  return db.query.transaction(async (tx) => { 
    // store the organizer specified data, plus our next change counter.
    const removeDays = published ? Reconcile.delistDays : Reconcile.eraseDays;
    await Reconcile.updateOverview(tx, tgt.seriesId, nextChange, vals.event);
    await Reconcile.updateDays(tx, tgt.seriesId, vals.status, removeDays);
    //
    const out = {
      id: tgt.seriesId,
      published: true,
    };
    if (newImage) {
      out.image = config.image.url(newImage);
    }
    return out;
  });
}

// save the uploaded file (if any)
// if the save succeeded, update the event.
// ( errors are handled inside uploader.js )
async function saveImage(tgt, sequence, req) { 
  if (!req.file) {
    return false;
  }
  // the image gets written to disk as "id.ext"
  const f = await uploader.write( req.file, tgt.seriesId );
  // the image name gets stored in the db as "id-sequence.ext"
  // the sequence number needs to be different for each new image.
  // ( shift.conf strips off the sequence when the file is requested; see cache_busting.md )
  return `${f.name}-${sequence}${f.ext}`;
}

// promise to email the organizer about a new event.
// although callers dont need to wait on the result, 
// doing so catches any internal exceptions.
function sendConfirmationEmail(id, password, evt) {
  const url = config.site.url('addevent', `edit-${id}-${password}`);
  const subject = `Shift2Bikes Secret URL for ${evt.title}`;
  console.debug("sending confirmation for", url);

  const support= config.email.support;
  const body = nunjucks.render('email.njk', {
    organizer: evt.name,
    title: evt.title,
    url,
    help: config.site.helpPage(),
    support: support.address || support, // a string or object
  });
  return emailer.sendMail({
    subject,
    text: body,
    to: {
      name: evt.name,
      address: evt.email,
    },
    from: config.email.sender,
    replyTo: config.email.support,
    bcc: config.email.moderator, // backup copy for debugging and/or moderating
    // html
    // attachments
  }, evt.name, evt.email, evt.title, url);
}

// read json into a javascript object.
// returns undefined for any error.
function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch (err) {
    console.error(err);
  }
}

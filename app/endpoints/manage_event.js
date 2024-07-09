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
const { CalEvent } = require("../models/calEvent");
const { CalDaily } = require("../models/calDaily");
const { uploader } = require("../uploader");
const validator = require('validator');
const dt = require("../util/dateTime");
const config = require("../config");
const emailer = require("../emailer");
const nunjucks = require("../nunjucks");
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
  let input = req.body;
  // fix? the client uploads form data containing json
  // ( rather than raw json ) because multi-part forms require that.
  // a more rest-like api might use a separate put at some event/image url.
  if (input && input.json) {
    input = safeParse(input.json);
  }
  if (!input) {
    return res.textError("invalid request");
  }
  // parse for errors
  const data = validateEvent(input);
  // the client code doesnt allow organizers to upload the image for new events
  // ensuring that's the case here, simplifies the file handling (below)
  if (req.file && !data.id) {
    data.errors.addError("image", "Images can only be added to existing events.");
  }
  if (data.errors.count) {
    return res.fieldError(data.errors.getErrors());
  }
  // find or make the event, then update it with the sent data.
  // ( depending on whether an id was submitted )
  return getOrCreateEvent(data.id, data.secret).then((evt)=> {
    if (!evt) {
      res.textError("Invalid secret, use link from email");
    } else {
      // save the uploaded file (if any)
      const saveImage = !req.file ? Promise.resolve() :
        // the image gets written to disk as "id.ext"
        uploader.write( req.file, evt.id ).then(f => {
          // the image name gets stored in the db as "id-sequence.ext"
          // the sequence number needs to be different for each new image.
          // ( shift.conf strips off the sequence when the file is requested; see cache_busting.md )
          const sequence = evt.nextChange();
          evt.image = `${f.name}-${sequence}${f.ext}`;
        });
      // if the save succeeded, update the event.
      // ( errors are handled inside uploader.js )
      return saveImage.then(_ => {
        return updateEvent(evt, data.values, data.statusList)
        .then(details => {
          res.set(config.api.header, config.api.version);
          res.json(details);
        });
      });
    }
  }).catch(next);
}

// if no id was specified, create a new event.
// otherwise, the id and secret are required or this returns null.
function getOrCreateEvent(id, secret) {
  if (!id) {
    return Promise.resolve(CalEvent.newEvent());
  } else {
    return CalEvent.getByID(id).then(evt => {
      return (evt && evt.isSecretValid(secret)) ? evt : null;
    });
  }
}

// promises the summary of the event after doing a successful update.
function updateEvent(evt, values, statusList) {
  // if the user is saving an existing event,
  // we assume they are publishing it.
  // ( the secret has been validated in handleRequest. )
  const existed = evt.exists();
  const previouslyPublished = evt.isPublished();

  // NOTE: overwrites (most) fields in the event with the user's input.
  evt.updateFromJSON(values);
  if (existed) {
    evt.setPublished();
  }
  // we dont know whether something significant changed or not:
  // so we always have to store.
  // ( this creates the event if it didnt exist. )
  return evt.storeChange().then(() =>{
    // now that the event has been stored, and it has an id: add/remove times.
    const statusMap = new Map(statusList.map(status => [status.date, status]));
    return CalDaily.reconcile(evt, statusMap, previouslyPublished).then((dailies) => {
      // email the organizer about new events.
      // ( although we dont need to wait on the email transport, doing so catches any internal exceptions )
      let q = !existed ? sendConfirmationEmail(evt) : Promise.resolve();
      const statuses = dailies.map(at => at.getStatus());
      return q.then(_ => {
        // finally, return a summary of the CalEvent and its CalDaily(s).
        // includes private contact info ( like email, etc. )
        // ( because this is the organizer saving their event )
        return evt.getDetails(statuses, {includePrivate:true});
      });
    });
  });
}

// promises a sent email
// evt is a CalEvent.
function sendConfirmationEmail(evt) {
  const url = config.site.url('addevent', `edit-${evt.id}-${evt.password}`);
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

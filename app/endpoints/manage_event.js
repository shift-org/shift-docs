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


// read multipart (and curl) posts.
exports.post = [ uploader.handle.single('file'), handleRequest ];

/**
 * read data the posted to this endpoint.
 * req.body contains parsed json.
 * req.file might exist if an image was uploaded.
 *
 * for things like validation errors, handleRequest() "successfully" generates a 400 status.
 * it should only reject due to things like database or programmer errors.
 */
function handleRequest(req, res, next) {
  let data = req.body;
  // fix? the client uploads form data containing json
  // ( rather than raw json ) because multi-part forms require that.
  // a more rest-like api might use a separate put at some event/image url.
  if (data && data.json) {
    data = safeParse(data.json);
  }
  // check for errors
  let errors = validateRequest(data, {});
  errors = validateStatus(data.datestatuses, errors);
  // the client code doesnt allow organizers to upload the image for new events
  // ensuring that's the case here, simplifies the file handling (below)
  if (req.file && !data.id) {
    addError(errors, "image", "Images can only be added to existing events.");
  }
  if (Object.keys(errors).length) {
    return res.fieldError(errors);
  }
  // find or make the event, then update it with the sent data.
  // ( depending on whether an id was submitted )
  return getOrCreateEvent(data).then((evt)=> {
    if (!evt) {
      res.textError("Invalid secret, use link from email");
    } else {
      // save the uploaded file (if any)
      let q = !req.file ? Promise.resolve() :
        uploader.write( req.file, evt.id, config.image.dir ).then(name => {
          evt.image = name;
        });
      return q.then(_ => {
        return updateEvent(evt, data)
        .then(details => res.json(details));
      });
    }
  }).catch(next);
}

// if no id was specified, create a new event.
// otherwise, the id and secret are required or this returns null.
function getOrCreateEvent(data) {
  if (!data.id) {
    return Promise.resolve(CalEvent.newEvent());
  } else {
    return CalEvent.getByID(data.id).then(evt => {
      return (evt && evt.isSecretValid(data.secret)) ? evt : null;
    });
  }
}

// promises the summary of the event after doing a successful update.
function updateEvent(evt, data) {
  // if the user is saving an existing event,
  // we assume they are publishing it.
  // ( the secret has been validated in handleRequest. )
  const existed = evt.exists();
  const previouslyPublished = evt.isPublished();

  // NOTE: overwrites (most) fields in the event with the user's input.
  evt.updateFromJSON(data);
  if (existed) {
    evt.setPublished();
  }
  // we dont know whether something significant changed or not:
  // so we always have to store.
  // ( this creates the event if it didnt exist. )
  return evt.storeChange().then(() =>{
    // now that the event has been stored, and it has an id: add/remove times.
    const stauses = data.datestatuses || [];
    const statusMap = new Map(stauses.map(status => [status.date, status]));
    return CalDaily.reconcile(evt, statusMap, previouslyPublished).then((dailies) => {
      // email the organizer about new events.
      // ( although we dont need to wait on the email transport, doing so catches any internal exceptions )
      let q = !existed ? emailSecret(evt) : Promise.resolve();
      const statuses = dailies.map(at => at.getStatus());
      return q.then(_ => {
        // finally, return a summary of the CalEvent and its CalDaily(s).
        // passes "true" to include private contact info ( like email, etc. )
        // ( because this is the organizer saving their event )
        return evt.getDetails({statuses, includePrivate:true});
      });
    });
  });
}

// promises a sent email
// evt is a CalEvent.
function emailSecret(evt) {
  const url = config.site.url('addevent', `edit-${evt.id}-${evt.password}`);
  const subject = `Shift2Bikes Secret URL for ${evt.title}`;
  const body = nunjucks.render('email.njk', {
    organizer: evt.name,
    title: evt.title,
    url,
  });
  return emailer.sendMail({
    subject,
    text: body,
    // html
    // attachments
    to: {
      name: evt.name,
      address: evt.email,
    },
    from: {
      name: 'SHIFT to Bikes',
      address: 'bikefun@shift2bikes.org'
    },
    // send backup copy for debugging and/or moderating
    bcc: "shift-event-email-archives@googlegroups.com",
  });
}

/**
 * Ensures that the 'datestatuses' in 'data' (if any) are valid.
 * Allows an empty list ( which cancels all existing occurrences. )
 *
 * @param statusList:A list of data status objects sent by the organizer.
 *        [{ id, date, status, newsflash }, ...]
 *
 * @param errors: an object containing arbitrary {name: string} pairs.
 *
 * @see fieldError()
 * @see DateStatus.js
 */
function validateStatus(statusList, errors) {
  const invalidDateStrings = [];
  if (statusList) {
    if (!Array.isArray(statusList)) {
      invalidDateStrings.push("expected an array");
    } else {
      statusList.forEach(status => {
        const validDate = status.date && dt.fromYMDString(status.date).isValid();
        if (!validDate) {
          invalidDateStrings.push(status.date);
        }
      });
    }
  }
  if (invalidDateStrings.length) {
    const msg = "Invalid dates: " + invalidDateStrings.join(', ');
    addError(errors, 'dates', msg);
  }
  return errors;
}

/**
 * ensure the email, title, etc. submitted by the organizer seem valid.
 * this can alter the passed data. ( ex. trimming string values )
 * note: unlike the php version, the secret gets determined separately.
 *
 * @param errors: an object containing arbitrary {name: string} pairs.
 * @see fieldError()
 */
function validateRequest(data, errors) {
  const hasValue = [
    'title', 'details', 'venue', 'address', 'organizer',
    // required only from March to June, during Pedalpalooza
    // tinytitle', 'printdescr'
  ];
  const isTrue = {
   'code_of_conduct': "You must have read the Ride Leading Comic",
   'read_comic': "You must agree to the Code of Conduct"
  };

  // check the existence of required fields.
  hasValue.forEach((field) => {
    const val = (data[field] || '').trim();
    if (validator.isEmpty(val)) {
      addError(errors, field);
    } else {
      data[field] = val; // rewrite the trimmed value.
    }
  });

  // check that boolean things exist and are true.
  for (const field in isTrue) {
    const val = data[field] || '';
    // is the boolean value missing?
    if (!validator.isBoolean(val)) {
      addError(errors, field);
    } else {
      // is the boolean value false?
      if (!validator.toBoolean(val)) {
        const msg = isTrue[field];
        addError(errors, field, msg);
      } else {
        // the boolean was true;
        // rewrite the value.
        data[field] = true;
      }
    }
  }

  // validate the email
  {
    const val = (data.email || '').trim();
    if (!validator.isEmail(val)) {
      addError(errors, 'email');
    } else {
      data.email = val; // rewrite the trimmed value.
    }
  }

  // validate the event time
  // the php doesnt do this, but it feels like a good idea.
  // ( and CalEvent.updateFromJSON() relies on it. )
  //
  // interestingly: the upload is in AM/PM style
  // but the server stores and reports in 24 hour style.
  // and flourish stores communicates 'time' fields as an fTime
  // while mysql stores as a 'hh:mm:ss' with no meridian
  // so flourish must automatically transform to 24 time.
  // https://dev.mysql.com/doc/refman/8.0/en/time.html
  // https://flourishlib.com/docs/fTime.html
  {
    let val = (data.time || '').trim();
    if (validator.isEmpty(val)) {
      addError(errors, 'time');
    } else {
      let t = dt.from12HourString(val);
      if (!t.isValid()) {
        t = dt.from24HourString(val);
      }
      if (t.isValid()) {
        data.time = dt.to24HourString(t);
      } else {
        addError(errors, 'time');
      }
    }
  }

  // munge print title:
  // if print title (aka tinytitle) isn't set,
  // use the first 24 chars of the regular title
  {
    let val = (data.tinytitle || '').trim();
    if (validator.isEmpty(val)) {
      // fix? cut at words? ( could use the wordwrapjs
      val = validator.trim(data.title || '').substring(0,24);
    }
    data.tinytitle = val; // write back trimmed or substr'd title.
  }

  return errors;
}

function addError(errors, field, msg) {
  errors[field] = msg ?? `Please enter a value for <span class=\"field-name\">${field}</span>`;
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

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

// read multipart (and curl) posts.
exports.post = [ uploader.single('file'), handleRequest ];

/**
 * read data the posted to this endpoint.
 * req.body contains parsed json.
 * req.file might exist if an image was uploaded.
 *
 * for things like validation errors, handleRequest() "successfully" generates a 400 status.
 * it should only reject due to things like database or programmer errors.
 */
function handleRequest(req, res, next) {
  let errors = [];
  let data = req.body;
  // fix? client uploads form data containing json
  // ( rather than posting application/json data )
  if (data && data.json) {
    data = safeParse(data.json);
  }
  errors = validateRequest(data, errors);
  errors = validateStatus(data.datestatuses, errors);
  if (errors.length) {
    return res.fieldError(errors);
  }

  return getOrCreateEvent(data).then((evt)=> {
    if (!evt) {
      res.textError("Invalid secret, use link from email");
    } else {
      return updateEvent(evt, data)
        .then(details => res.json(details));
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
  // save the uploaded file (if any)
  // if (req.file) {
  // global $IMAGEDIR;
  //   $file = $uploader->move($IMAGEDIR, 'file');
  //   $event->setImage($file->getName());
  // }

  // NOTE: overwrites (most) fields in the event with the user's input.
  evt.updateFromJSON(data);

  // if the user is saving an existing event,
  // we assume they are publishing it.
  // ( the secret has been validated above. )
  const existed = evt.exists();
  const previouslyPublished = evt.isPublished();
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
      // after we've updated all the dailies...
      // email the organizer about new events.
      if (!existed) {
        emailSecret(evt);
      }
      const statuses = dailies.map(at => at.getStatus());
      // finally, return a summary of the CalEvent and its CalDaily(s).
      // passes "true" to include private contact info ( like email, etc. )
      // ( because this is the organizer saving their event )
      return evt.getDetails({statuses, includePrivate:true});
    });
  });
}

function emailSecret(evt) {

  const id = evt.id;
  const secret = evt.password;
  const url = config.site.url('addevent', `edit-${id}-${secret}`);
  console.log( "email!", id, secret, url);

  // headers = 'From: bikefun@shift2bikes.org' .
  // "\r\n" .  'Reply-To: bikefun@shift2bikes.org' .
}

/**
 * Ensures that the 'datestatuses' in 'data' (if any) are valid.
 * Allows an empty list ( which cancels all existing occurrences. )
 *
 * @param statusList:A list of data status objects sent by the organizer.
 *        [{ id, date, status, newsflash }, ...]
 *
 * @param errors: an array used for error messages.
 *        containing arbitrary {name: string} pairs.
 *
 * @see DateStatus.php
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
    errors.dates = "Invalid dates: " + invalidDateStrings.join(', ');
  }
  return errors;
}

/**
 * ensure the email, title, etc. submitted by the organizer seem valid.
 * this can alter the passed data. ( ex. trimming string values )
 * note: unlike the php version, doesnt validate secret ( that's done later. )
 *
 * @param errors: an array used for error messages.
 *        containing arbitrary {name: string} pairs.
 *
 * ex. {
 *    "email": "Please enter a value for <span class=\"field-name\">Email</span>"
 * }
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

  hasValue.forEach((field) => {
    const val = (data[field] || '').trim();
    if (validator.isEmpty(val)) {
      errors.push( missingField(field) );
    } else {
      data[field] = val; // rewrite the trimmed value.
    }
  });

  // check that boolean things exist and are true.
  for (const field in isTrue) {
    const val = data[field] || '';
    if (!validator.isBoolean(val)) {
      errors.push( missingField(field) );
    } else if (!validator.toBoolean(val)) {
      const msg = isTrue[field];
      errors.push( {[field]: msg} );
    } else {
      data[field] = true; // rewrite the value.
    }
  };

  // validate the email
  {
    const val = (data.email || '').trim();
    if (!validator.isEmail(val)) {
      errors.push( missingField("email") );
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
      errors.push( missingField('time') );
    } else {
      let t = dt.from12HourString(val);
      if (!t.isValid()) {
        t = dt.from24HourString(val);
      }
      if (t.isValid()) {
        data.time = dt.to24HourString(t);
      } else {
        errors.push( missingField('time') );
      }
    }
  }

  // handle print title:
  // if print title (aka tinytitle) isn't set,
  // use the first 24 chars of the regular title
  {
    let val = (data.tinytitle || '').trim();
    if (validator.isEmpty(val)) {
      // fix? cut at words?
      val = validator.trim(data.title || '').substring(0,24);
    }
    data.tinytitle = val; // write back trimmed or substr'd title.
  }

  return errors;
}

function missingField(field) {
  return { [field]: `Please enter a value for <span class=\"field-name\">${field}</span>` };
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

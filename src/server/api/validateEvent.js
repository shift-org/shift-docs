const dt = require('server/util/dateTime');
const { Area, Audience, Distance, EventStatus, LocType, Showable, TagName, WebType } = require("server/model/shorthands");
const { ErrorCollector } = require('server/support/errors');
const makeValidator = require('server/support/formValidator');

module.exports = validateEvent;

// validate the input, transforming from client field names into db column names.
function validateEvent(input) {
  const errors = new ErrorCollector();
  const v = makeValidator(input, errors);
  // these don't get stored; but are still required on initial submission for a new event
  if (!input.id) {
    v.requireTrue('code_of_conduct', "You must agree to the Code of Conduct");
    v.requireTrue('read_comic', "You must have read the Ride Leading Comic");
  }
  const timeNow = dt.toTimestamp();
  const event = {
    // image: ... image data is handled separately (via multi-part form data)
    series: {
      title: v.requireString('title', 'Title missing', 256),
      organizer: v.requireString('organizer', 'Organizer missing'),
      start_time: v.requiredTime('time'), // can return something falsy on error.
      ride_duration: v.zeroInt('eventduration') || null,  // client defaults this to "" if not specified.
      tiny_title: v.nullString('tinytitle', 48), // client caps to 24, but some are longer already
      summary: v.nullString('printdescr', 1024),
      details: v.requireString('details', 'Details missing', 16*1024),
      // for the sake of sqlite, set this manually.
      modified: timeNow,
    },
    location: [{
      loc_type: LocType.Start,
      place_name: v.requireString('venue', 'Venue missing'),
      address: v.requireString('address', 'Address missing'),
      place_info: v.nullString('locdetails'),
      time_info: v.nullString('timedetails'),
    }, {
      loc_type: LocType.Finish,
      place_name: v.nullString('locend'),
    }],
    private: {
      // fix: should only allow to set on create; never update.
      private_email: v.requireEmail('email'),
      private_phone: v.nullString('phone'),
      private_contact: v.nullString('contact'),
      show_email: hidePrintField(v, 'email'),
      show_phone: hidePrintField(v, 'phone'),
      show_contact: hidePrintField(v, 'contact'),
    },
    tag: [
      tag(TagName.Area, parseConst(v, Area, 'area', true)),
      tag(TagName.Audience, parseConst(v, Audience, 'audience', true)),
      tag(TagName.Distance, parseConst(v, Distance, 'ridelength', false)),
      tag(TagName.LoopRide, v.optionalFlag('loopride') && "true"),
      tag(TagName.SafetyPlan, v.optionalFlag('safetyplan') && "true"),
    ],
    web: [{
      web_type: WebType.Url,
      web_link: v.nullString('weburl', 512),
      web_text: v.nullString('webname'),
      printable: v.optionalFlag('printweburl'),
    }],
  };
  const seriesId = v.zeroInt('id');
  const password = v.nullString('secret');
  const days = validateStatus(timeNow, input.datestatuses);
  return {
    tgt: {
      seriesId,
      password
    },
    vals: {
      event,
      days
    },
    err: errors,
  };
}


/**
 * Ensures that the 'datestatuses' in 'data' (if any) are valid.
 * Allows an empty list ( which cancels all existing occurrences. )
 *
 * @param statusList:A list of data status objects sent by the organizer.
 *        [{ id, date, status, newsflash }, ...]
 */
function validateStatus(timeNow, statusList) {
  const invalidDateStrings = [];
  const validStatus = [];
  if (statusList) {
    if (!Array.isArray(statusList)) {
      invalidDateStrings.push("expected an array");
    } else {
      statusList.forEach(status => {
        const validDate = status.date && dt.fromYMDString(status.date).isValid();
        if (!validDate) {
          invalidDateStrings.push(status.date);
        } else {
          validStatus.push(status);
        }
      });
    }
  }
  if (invalidDateStrings.length) {
    const msg = "Invalid dates: " + invalidDateStrings.join(', ');
    errors.addError('dates', msg);
  }
  return validStatus;
}


// for validating from an object containing shorthand constants
// ex. shorthands.Area
function parseConst(v, cls, field, required) {
  const value = cls.keyToValue(getString(field));
  if (value !== undefined) {
    return value;
  } else if (required) {
    errors.addError(field);
  }
}

/**
 * combines a hide* and print* field into a "showable" enum
 * returns a shorthands.Showable
 */
function hidePrintField(v, field) {
  const visible = v.optionalFlag(`hide${field}`, false); // validate and reverse the flag
  const printable = v.optionalFlag(`print${field}`, true);
  const show = Showable.combine(visible, printable);
  return show.value;
}

function tag(a, b) {
  return {
    tag_type: a,
    tag_value: b,
  }
}

const dt = require("../util/dateTime");
const validator = require('validator');
const { Area, Audience, Distance, EventStatus, LocType, TagName, WebType } = require("./calConst");

class ErrorCollector {
  constructor() {
    this.errors = {};
    this.count = 0;
  }
  addError(field, msg) {
    this.errors[field] = msg ?? `Please enter a value for <span class=\"field-name\">${field}</span>`;
    this.count++;
  }
  getErrors() {
    return this.errors;
  }
}

// the validator package *requires* strings
// but not all data sent by the client are strings.
// example usage: validator.isBoolean(asString(userData)).
function asString(value) {
  // coalecese nulls and undefined into a blank string
  // ensure all numbers and booleans are strings
  // trim all strings
  return ((value ?? '') + '').trim();
}

// ensure the email, title, etc. submitted by the organizer seem valid.
// input is json, errors is of type ErrorCollector
function makeValidator(input, errors) {
  function getString(field) {
    return asString(input[field]);
  }
  function smallerThan(str, field, maxLen) {
    const okay = validator.isByteLength(str, { min: 0, max: maxLen });
    if (!okay) {
      errors.addError(field, "Field is too long");
    }
    return okay;
  }
  function flag(field, trueValue) {
    const str = getString(field);
    if (validator.isEmpty(str)) {
      return 0;
    } else if (!validator.isBoolean(str)) {
      errors.addError(field);
    } else {
      return validator.toBoolean(str) === trueValue ? 1 : 0;
    }
  }
  return {
    requireString(field, msg, maxLen = 255) {
      const str = getString(field);
      if (validator.isEmpty(str)) {
        errors.addError(field, msg);
      } else if (smallerThan(str, field, maxLen)) {
        return str;
      }
    },
    // the real valid email spec is 320; 
    // our db only supports 255
    requireEmail(field, maxLen = 255) {
      const str = getString(field);
      if (validator.isEmpty(str)) {
        errors.addError('email', "Email missing");
      } else if (!smallerThan(str, field, maxLen)) {
        // already set errors 
      } else if (!validator.isEmail(str)) {
        errors.addError('email', "Email is invalid");
      } else {
       return str; // write the trimmed value.
      }
    },
    // only checks the value; doesnt return anything
    requireTrue(field, msg) {
      const str = getString(field);
      // is the boolean value missing?
      if (!validator.isBoolean(str)) {
        errors.addError(field, msg);
      } else {
        // is the boolean value false?
        if (!validator.toBoolean(str)) {
          errors.addError(field, msg);
        }
      }
    },
    // validate and transform the event time
    // the client sends AM/PM style
    // the database stores 24 times 'hh:mm:ss'
    // https://dev.mysql.com/doc/refman/8.0/en/time.html
    requiredTime(field) {
      const str = getString(field);
      if (validator.isEmpty(str)) {
        errors.addError('time');
      } else {
        // input is AM/PM style
        let t = dt.from12HourString(str);
        if (!t.isValid()) {
          t = dt.from24HourString(str);
        }
        if (!t.isValid()) {
          errors.addError('time');
        } else {
          return dt.to24HourString(t);
        }
      }
    },
    // to mimic php/flourish empty strings are converted to null.
    // https://flourishlib.com/docs/fActiveRecord.html#ColumnOperations
    nullString(field, maxLen = 255) {
      const str = getString(field);
      if (validator.isEmpty(str)) {
        return null; 
      } else if (smallerThan(str, field, maxLen)) {
        return str; 
      }
    },
    // returns 1 for a field containing 1 or true;
    // otherwise returns 0 for 0, false, or an unspecified value;
    // for all other values generates an error.
    optionalFlag(field) {
      return flag(field, true);
    },
    reverseFlag(field, opt) {
      return flag(field, false);
    },
    // if not specified, returns 0
    // otherwise expects an int-like value
    // greater than or equal to 0
    zeroInt(field) {
      const str = getString(field);
      if (validator.isEmpty(str)) {
        return 0;
      } else if (!validator.isInt(str)) {
        errors.addError(field);
      } else {
        // validator returns NaN if it cant convert
        const val = validator.toInt(str);
        if (isNaN(val) || val < 0) {
          errors.addError(field);
        } else {
          return val;
        }
      }
    },
    // for validating from an object containing shorthand constants
    // ex. calConst.Area
    parseConst(cls, field, required) {
      const value = cls.keyToValue(getString(field));
      if (value !== undefined) {
        return value;
      } else if (required) {
        errors.addError(field);
      }
    },
    /**
     * Ensures that the 'datestatuses' in 'data' (if any) are valid.
     * Allows an empty list ( which cancels all existing occurrences. )
     *
     * @param statusList: A list of data status objects sent by the organizer.
     *        [{ id, date, status, newsflash }, ...]
     * @out an array of validated [{ date, state, news }]
     *
     * dates in and out are : YYYY-MM-DD format
     */
    validateStatus(statusList) {
      const invalidDateStrings = [];
      const validStatus = [];
      if (statusList) {
        if (!Array.isArray(statusList)) {
          invalidDateStrings.push("expected an array");
        } else {
          statusList.forEach(status => {
            const validDate = dt.fromYMDString(status.date);
            if (!validDate.isValid()) {
              invalidDateStrings.push(status.date);
            } else {
              const news = asString(status.newsflash);
              // transform 'A' (active) into 1, and 'C' (cancelled) into 0
              const scheduled = EventStatus.keyToValue(asString(status.status));
              if (scheduled === undefined) {
                invalidDateStrings.push(status.date);
              } else {
                validStatus.push({
                  ymd: dt.toYMDString(validDate),
                  is_scheduled: scheduled,
                  // the original code stored null for empty news
                  news: news || null,
                });
              }
            }
          });
        }
      }
      if (invalidDateStrings.length) {
        const msg = "Invalid dates: " + invalidDateStrings.join(', ');
        errors.addError('dates', msg);
      }
      return validStatus;
    },
  };
}

// validate the input, transforming from client field names into db column names.
function validateEvent(input) {
  const errors = new ErrorCollector();
  const v = makeValidator(input, errors);
  // these don't get stored; but are still required on initial submission for a new event
  if (!input.id) {
    v.requireTrue('code_of_conduct', "You must agree to the Code of Conduct");
    v.requireTrue('read_comic', "You must have read the Ride Leading Comic");
  }
  const event = {
    // image: ... image data is handled separately (via multi-part form data)
    series: {
      title: v.requireString('title', 'Title missing', 256),
      tiny: v.nullString('tinytitle', 48), // client caps to 24, but some are longer already
      organizer: v.requireString('organizer', 'Organizer missing'),
      details: v.requireString('details', 'Details missing', 16*1024),
      start_time: v.requiredTime('time'), // can return something falsy on error.
      ride_duration: v.zeroInt('eventduration') || null,  // client defaults this to "" if not specified.
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
      show_email: v.reverseFlag('hideemail'),
      show_phone: v.reverseFlag('hidephone'),
      show_contact: v.reverseFlag('hidecontact'),
    },
    print: {
      add_email: v.optionalFlag('printemail'),
      add_phone: v.optionalFlag('printphone'),
      add_link: v.optionalFlag('printweburl'),
      add_contact: v.optionalFlag('printcontact'),
      printed_summary: v.nullString('printdescr', 1024),
    },
    tag: [
      tag(TagName.Area, v.parseConst(Area, 'area', true)),
      tag(TagName.Audience, v.parseConst(Audience, 'audience', true)),
      tag(TagName.Distance, v.parseConst(Distance, 'ridelength', false)),
      tag(TagName.LoopRide, v.optionalFlag('loopride') && "true"),
      tag(TagName.SafetyPlan, v.optionalFlag('safetyplan') && "true"),
    ],
    web: [{
      web_type: WebType.Url,
      web_link: v.nullString('weburl', 512),
      web_text: v.nullString('webname'),
    }],
  };
  const seriesId = v.zeroInt('id');
  const password = v.nullString('secret');
  const days = v.validateStatus(input.datestatuses);
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

function tag(a, b) {
  return {
    tag_type: a,
    tag_value: b,
  }
}

// read a possible json request into a javascript object.
// returns undefined for any error.
function safeParse(data) {
  if (data && data.json) {
    try {
      data = JSON.parse(data.json);
    } catch (err) {
      console.error(err);
    }
  }
  return data;
}

module.exports = {
  validateEvent,
  safeParse,
  // exported for testing:
  makeValidator,
  ErrorCollector
}

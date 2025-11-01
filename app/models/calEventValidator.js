const dt = require("../util/dateTime");
const validator = require('validator');
const { Area, Audience, DatesType, RideLength } = require("./calConst");

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

// a single valid character.
const validChar = /^[A-Z]$/;

// the validator package requires strings and only strings
// the various functions below convert strings to the desired output types.  
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
    // input is in AM/PM style
    // mysql wants a 'hh:mm:ss' with no meridian
    // https://dev.mysql.com/doc/refman/8.0/en/time.html
    requiredTime(field) {
      const str = getString(field);
      if (validator.isEmpty(str)) {
        errors.addError('time');
      } else {
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
    // if not specified, returns 0
    // otherwise expects 0, 1, true, or false
    // then returns a 0 or 1 value
    optionalFlag(field) {
      const str = getString(field);
      if (validator.isEmpty(str)) {
        return 0;
      } else if (!validator.isBoolean(str)) {
        errors.addError(field);
      } else {
        return validator.toBoolean(str) ? 1 : 0;
      }
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
    // if not specified, returns the defaultVal
    // otherwise must be a single letter
    optionalChar(field, defaultVal) {
      const str = getString(field);
      if (validator.isEmpty(str)) {
        return defaultVal;
      } else if (!validator.matches(str, validChar)) {
        errors.addError(field);
      } else {
        return str;
      }
    },
    // munge print title:
    // if print title (aka tinytitle) isn't set,
    // use the first 24 chars of the regular title
    mungeTinyTitle(title) {
      const str = getString('tinytitle');
      // fix? cut at words? ( could use the wordwrapjs )
      return (validator.isEmpty(str) && title) ? title.substring(0, 24) : str;
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
     * 
     * WARNING: 'news' isn't safe from sql injection!
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
              const state = asString(status.status);
              const news = asString(status.newsflash);
              if (!validator.matches(state, validChar)) {
                invalidDateStrings.push(status.date);
              } else {
                validStatus.push({
                  date: dt.toYMDString(validDate),
                  state,
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

    validateRideLength(rideLength) {
      value = getString(rideLength);
      return (value in RideLength) ? value : null;
    },
  };
}

// validate the input, transforming from client field names into db column names.
// fix? tinytitle', 'printdescr' are required only during Pedalpalooza.
function validateEvent(input) {
  const errors = new ErrorCollector();
  const v = makeValidator(input, errors);
  // these don't get stored; but are still required on initial submission for a new event
  if (!input.id) {
    v.requireTrue('code_of_conduct', "You must agree to the Code of Conduct");
    v.requireTrue('read_comic', "You must have read the Ride Leading Comic");
  }
  const title = v.requireString('title', 'Title missing');
  const event = {
    title: title,
    locname: v.requireString('venue', 'Venue missing'),
    address: v.requireString('address', 'Address missing'),
    name: v.requireString('organizer', 'Organizer missing'),
    email: v.requireEmail('email'),
    hideemail: v.optionalFlag('hideemail'),
    phone: v.nullString('phone'),
    hidephone: v.optionalFlag('hidephone'),
    contact: v.nullString('contact'),
    hidecontact: v.optionalFlag('hidecontact'),
    descr: v.requireString('details', 'Details missing', 16*1024),
    eventtime: v.requiredTime('time'),
    timedetails: v.nullString('timedetails'),
    locdetails: v.nullString('locdetails'),
    loopride: v.optionalFlag('loopride'),
    locend: v.nullString('locend'),
    ridelength: v.validateRideLength('ridelength'),
    eventduration: v.zeroInt('eventduration'),
    weburl: v.nullString('weburl', 512), // fix? validate this is url-like?
    webname: v.nullString('webname'),
    audience: v.optionalChar('audience', Audience.General),
    tinytitle: v.mungeTinyTitle(title),
    printdescr: v.nullString('printdescr', 1024),
    dates: v.nullString('datestring'), // string field 'dates' needed for legacy admin calendar
    datestype: v.optionalChar('datestype', DatesType.OneDay),
    area: v.optionalChar('area', Area.Portland),
    printemail: v.optionalFlag('printemail'),
    printphone: v.optionalFlag('printphone'),
    printweburl: v.optionalFlag('printweburl'),
    printcontact: v.optionalFlag('printcontact'),
    safetyplan: v.optionalFlag('safetyplan'),
  };
  const seriesId = v.zeroInt('id');
  const password = v.nullString('secret');
  const status = v.validateStatus(input.datestatuses);
  return {
    target: {
      seriesId,
      password
    },
    values: {
      event,
      status
    },
    errors,
  };
}

module.exports = {
  validateEvent,
  // exported for testing:
  makeValidator,
  ErrorCollector
}

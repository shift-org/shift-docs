const dt = require("../util/dateTime");
const validator = require('validator');
const { Area, DatesType } = require("./calConst");

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

// ensure the email, title, etc. submitted by the organizer seem valid.
// input is json, errors is of type ErrorCollector
function makeValidator(input, errors) {
  // the validator package requires strings and only strings
  // the various functions below convert strings to the desired output types.
  function getString(field) {
    // coalecese nulls and undefined into a blank string
    // ensure all numbers and booleans are strings
    // trim all strings
    return ((input[field] ?? '') + '').trim();
  }
  return {
    requireString(field, msg) {
      const str = getString(field);
      if (validator.isEmpty(str)) {
        errors.addError(field, msg);
      } else {
        return str;
      }
    },
    requireEmail(field, msg) {
      const str = getString(field);
      if (!validator.isEmail(str)) {
        errors.addError('email', msg);
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
    // validate the event time
    // the php doesnt do this, but it feels like a good idea.
    // ( and CalEvent.updateFromJSON() relies on it. )
    requiredTime(field) {
      // interestingly: the upload is in AM/PM style
      // but the server stores and reports in 24 hour style.
      // and flourish stores communicates 'time' fields as an fTime
      // while mysql stores as a 'hh:mm:ss' with no meridian
      // so flourish must automatically transform to 24 time.
      // https://dev.mysql.com/doc/refman/8.0/en/time.html
      // https://flourishlib.com/docs/fTime.html
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
    nullString(field) {
      const str = getString(field);
      return validator.isEmpty(str) ? null : str;
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
      } else if (!validator.matches(str, /^[A-Z]$/)) {
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
     * @param statusList:A list of data status objects sent by the organizer.
     *        [{ id, date, status, newsflash }, ...]
     */
    validateStatus(statusList) {
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
    },
  };
}


// fix? required only from March to June, during Pedalpalooza
// tinytitle', 'printdescr'
function validateEvent(input) {
  const errors = new ErrorCollector();
  const v = makeValidator(input, errors);
  // these don't get stored; but are still required on initial submission for a new event
  if (!input.id) {
    v.requireTrue('code_of_conduct', "You must agree to the Code of Conduct");
    v.requireTrue('read_comic', "You must have read the Ride Leading Comic");
  }
  const title = v.requireString('title', 'Title missing');
  let values = {
    title: title,
    locname: v.requireString('venue', 'Venue missing'),
    address: v.requireString('address', 'Address missing'),
    name: v.requireString('organizer', 'Organizer missing'),
    email: v.requireEmail('email', 'Email missing'),
    hideemail: v.optionalFlag('hideemail'),
    phone: v.nullString('phone'),
    hidephone: v.optionalFlag('hidephone'),
    contact: v.nullString('contact'),
    hidecontact: v.optionalFlag('hidecontact'),
    descr: v.requireString('details', 'Details missing'),
    eventtime: v.requiredTime('time'),
    timedetails: v.nullString('timedetails'),
    locdetails: v.nullString('locdetails'),
    loopride: v.optionalFlag('loopride'),
    locend: v.nullString('locend'),
    ridelength: v.nullString('ridelength'),
    eventduration: v.zeroInt('eventduration'),
    weburl: v.nullString('weburl'), // fix? validate this is a url>
    webname: v.nullString('webname'),
    audience: v.nullString('audience'),
    tinytitle: v.mungeTinyTitle(title),
    printdescr: v.nullString('printdescr'),
    dates: v.nullString('datestring'), // string field 'dates' needed for legacy admin calendar
    datestype: v.optionalChar('datestype', DatesType.OneDay),
    area: v.optionalChar('area', Area.Portland),
    printemail: v.optionalFlag('printemail'),
    printphone: v.optionalFlag('printphone'),
    printweburl: v.optionalFlag('printweburl'),
    printcontact: v.optionalFlag('printcontact'),
    safetyplan: v.optionalFlag('safetyplan'),
  };
  const statusList = v.validateStatus(input.datestatuses);
  return {
    id: input.id,
    secret: input.secret,
    values,
    statusList,
    errors,
  };
}

module.exports = {
  validateEvent,
  // exported for testing:
  makeValidator,
  ErrorCollector
}

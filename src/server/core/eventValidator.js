/**
 * User input validator helper specific to events.
 */
const dt = require("server/util/dateTime");
const validator = require('validator');

module.exports = makeValidator;

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
  return {
    asString,
    getString,
    addError(field, msg) {
      errors.addError(field, msg);
    },
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
    optionalFlag(field, trueValue = true) {
      const str = getString(field);
      if (validator.isEmpty(str)) {
        return 0;
      } else if (!validator.isBoolean(str)) {
        errors.addError(field);
      } else {
        return validator.toBoolean(str) === trueValue ? 1 : 0;
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
  };
}


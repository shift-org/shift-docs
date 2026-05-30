/**
 * User input validator helper specific to events.
 * ensure the email, title, etc. submitted by the organizer seem valid.
 */
const dt = require("server/util/dateTime");
const validator = require('validator');


class FormValidator {
  // the validator package *requires* strings
  // but not all data sent by the client are strings.
  // example usage: validator.isBoolean(asString(userData)).
  static asString(value) {
    // coalesce nulls and undefined into a blank string
    // ensure all numbers and booleans are strings
    // trim all strings
    return ((value ?? '') + '').trim();
  }
  static smallerThan(str, maxLen) {
    return validator.isByteLength(str, { min: 0, max: maxLen });
  }
  // input is json, errors is of type ErrorCollector
  constructor(input, errors) {
    this.input = input;
    this.errors = errors;
    this.currentField = null;
    this.currentValue = null;
  }
  // set the current value to the named field
  // from the input data given to the constructor.
  select(name, raw = false) {
    const value = this.input[name];
    this.currentField = name;
    this.currentValue = FormValidator.asString(value);
    return this;
  }
  // set the current value to the named field
  // from the input data given to the constructor.
  raw(name) {
    const value = this.input[name];
    this.currentField = name;
    this.currentValue = value;
    return this;
  }
  // record an error for the current field with optional custom message.
  // if msg is null or undefined, it records a default error message.
  addError(msg) {
    const { currentField: field } = this;
    this.errors.addError(field, msg);
    return this;
  }
  // ensure the selected value is string-ish and smaller than maxLen.
  // returns the value if so, adds an error if not.
  requireString(msg, maxLen = 255) {
    const { currentField: field, currentValue: str } = this;
    if (validator.isEmpty(str)) {
      this.addError(msg || "Field is empty");
    } else if (!FormValidator.smallerThan(str, maxLen)) {
      this.addError("Field is too long");
    } else {
      return str;
    }
  }
  // ensure the selected value looks like an email, smaller than maxLen.
  // returns the value if so, adds an error if not.
  requireEmail(maxLen = 256) {
    const { currentField: field, currentValue: str } = this;
    if (validator.isEmpty(str)) {
      this.addError("Email missing");
    } else if (!FormValidator.smallerThan(str, maxLen)) {
      this.addError("Field is too long");
    } else if (!validator.isEmail(str)) {
      this.addError("Email is invalid");
    } else {
     return str;
    }
  }
  // ensure the selected value exists.
  // returns true if so, adds an error if not.
  requireTrue(msg) {
    const { currentField: field, currentValue: str } = this;
    // is the boolean value missing?
    if (!validator.isBoolean(str)) {
      this.addError(msg || "expected a boolean value");
    } else {
      // is the boolean value false?
      if (!validator.toBoolean(str)) {
        this.addError(msg || "expected a true value");
      } else {
        return true;
      }
    }
  }
  // validate and transform the event time
  // the client sends AM/PM style
  // the database stores 24 times 'hh:mm:ss'
  // https://dev.mysql.com/doc/refman/8.0/en/time.html
  requiredTime() {
    const { currentField: field, currentValue: str } = this;
    if (validator.isEmpty(str)) {
      this.addError("can't be empty");
    } else {
      // input is AM/PM style
      let t = dt.from12HourString(str);
      if (!t.isValid()) {
        t = dt.from24HourString(str);
      }
      if (!t.isValid()) {
        this.addError("invalid format");
      } else {
        return dt.to24HourString(t);
      }
    }
  }
  // to mimic php/flourish empty strings are converted to null.
  // https://flourishlib.com/docs/fActiveRecord.html#ColumnOperations
  nullString(maxLen = 255) {
    const { currentField: field, currentValue: str } = this;
    if (validator.isEmpty(str)) {
      return null;
    } else if (!FormValidator.smallerThan(str, maxLen)) {
      this.addError("Field is too long");
    } else {
      return str;
    }
  }
  // returns 1 for a field containing 1 or true;
  // otherwise returns 0 for 0, false, or an unspecified value;
  // for all other values generates an error.
  optionalFlag(trueValue = true) {
    const { currentField: field, currentValue: str } = this;
    if (validator.isEmpty(str)) {
      return 0;
    } else if (!validator.isBoolean(str)) {
      this.addError("expected boolean value");
    } else {
      return validator.toBoolean(str) === trueValue ? 1 : 0;
    }
  }
  // if not specified, returns 0
  // otherwise expects an int-like value
  // greater than or equal to 0
  zeroInt(msg) {
    const { currentField: field, currentValue: str } = this;
    if (validator.isEmpty(str)) {
      return 0;
    } else if (!validator.isInt(str)) {
      this.addError(msg);
    } else {
      // validator returns NaN if it cant convert
      const val = validator.toInt(str);
      if (isNaN(val) || val < 0) {
        this.addError("not a number");
      } else {
        return val;
      }
    }
  }
  // if not specified, returns the defaultVal
  // otherwise must be a single letter
  optionalChar(defaultVal) {
    const { currentField: field, currentValue: str } = this;
    if (validator.isEmpty(str)) {
      return defaultVal;
    } else if (!validator.matches(str, /^[A-Z]$/)) {
      this.addError("unexpected string");
    } else {
      return str;
    }
  }
}

module.exports = FormValidator;


/**
 * User input validator helper specific to events.
 * ensure the email, title, etc. submitted by the organizer seem valid.
 */
const dt = require('shift-docs/util/dateTime');
const validator = require('validator');
const { ErrorStrings } = require('shift-docs/util/errors');

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
  // input is json, assumes errors is of type ErrorCollector
  constructor(input, errors) {
    this.input = input;
    this.errors = errors;
    this.currentField = null;
    this.currentValue = null;
  }
  // set the current value to the named field
  // from the input data given to the constructor.
  select(field) {
    this.setFieldValue(field, this.input[field]);
    return this;
  }

  setFieldValue(field, value) {
    this.currentField = field;
    this.currentValue = FormValidator.asString(value);
    return this;
  }
  // record an error for the current field with optional custom message.
  // if msg is null or undefined, it records a default error message.
  addError(msg) {
    const field = this.currentField;
    this.errors.addError(field, msg);
    return this;
  }
  // ensure the selected value is string-ish and smaller than maxLen.
  // returns the value if so, adds an error if not.
  requireString(maxLen = 255) {
    const str = this.currentValue;
    if (validator.isEmpty(str)) {
      this.addError(ErrorStrings.Missing);
    } else if (!FormValidator.smallerThan(str, maxLen)) {
      this.addError(ErrorStrings.Overflow);
    } else {
      return str;
    }
  }
  // ensure the selected value looks like an email, smaller than maxLen.
  // returns the value if so, adds an error if not.
  requireEmail(maxLen = 256) {
    const str = this.currentValue;
    if (validator.isEmpty(str)) {
      this.addError(ErrorStrings.Missing);
    } else if (!FormValidator.smallerThan(str, maxLen)) {
      this.addError(ErrorStrings.Overflow);
    } else if (!validator.isEmail(str)) {
      this.addError(ErrorStrings.Invalid);
    } else {
     return str;
    }
  }
  // ensure the selected value exists.
  // returns true if so, adds an error if not.
  requireTrue(msg) {
    const str = this.currentValue;
    if (validator.isEmpty(str)) {
      this.addError(msg || ErrorStrings.Missing);
    } else if (!validator.isBoolean(str)) {
      this.addError(msg || ErrorStrings.Invalid);
    } else if (!validator.toBoolean(str)) {
      this.addError(msg || ErrorStrings.Unknown);
    } else {
      return true;
    }
  }
  // validate and transform the event time
  // the client mostly sends AM/PM style
  // the database stores 24 times 'hh:mm:ss'
  // https://dev.mysql.com/doc/refman/8.0/en/time.html
  requiredTime() {
    const str = this.currentValue;
    if (validator.isEmpty(str)) {
      this.addError("A time must be specified");
    } else {
      // input prefers 12 hour time; fallsback to 24 when needed.
      const t = dt.fromTimeString(str);
      if (!t.isValid()) {
        this.addError(ErrorStrings.Invalid);
      } else {
        return dt.to24HourString(t);
      }
    }
  }
  // to mimic php/flourish empty strings are converted to null.
  // https://flourishlib.com/docs/fActiveRecord.html#ColumnOperations
  nullString(maxLen = 255) {
    const str = this.currentValue;
    if (validator.isEmpty(str)) {
      return null;
    } else if (!FormValidator.smallerThan(str, maxLen)) {
      this.addError(ErrorStrings.Overflow);
    } else {
      return str;
    }
  }
  // if fallback is 'undefined', 
  // the value is required.
  simpleBool(fallback = undefined) {
    const str = this.currentValue;
    if (validator.isBoolean(str)) { 
      return validator.toBoolean(str);
    } else if (!validator.isEmpty(str)) {
      this.addError(ErrorStrings.Unknown);
    } else if (fallback === undefined) {
      this.addError(ErrorStrings.Missing);
    } else {
      return fallback;
    }
  }
  // same as simpleBool but returns a 0/1 value instead of true/false
  simpleFlag(fallback = undefined) {
    const v = this.simpleBool(fallback);
    if (v === true) {
      return 1; 
    } else if (v === false) {
      return 0;
    } else if (v !== undefined) {
      return fallback;
    }
  }
  // if not specified, returns 0
  // otherwise expects an int-like value
  // greater than or equal to 0
  zeroInt(msg) {
    const str = this.currentValue;
    if (validator.isEmpty(str)) {
      return 0;
    } else if (!validator.isInt(str)) {
      this.addError(msg);
    } else {
      // validator returns NaN if it cant convert
      const val = validator.toInt(str);
      if (isNaN(val) || val < 0) {
        this.addError(ErrorStrings.Invalid);
      } else {
        return val;
      }
    }
  }
  // if not specified, returns the defaultVal
  // otherwise must be a single letter
  optionalChar(defaultVal) {
    const str = this.currentValue;
    if (validator.isEmpty(str)) {
      return defaultVal;
    } else if (!validator.matches(str, /^[A-Z]$/)) {
      this.addError(ErrorStrings.Unknown);
    } else {
      return str;
    }
  }
}

module.exports = FormValidator;


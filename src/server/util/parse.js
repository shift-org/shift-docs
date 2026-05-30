/**
 * reads query parameters and url parts
 */
const validator = require('validator');
const dt = require('server/util/dateTime');

module.exports = {
  parseBool,
  parseInt,
  parseJson,
  parseOptions,
  parseString,
  parseYmd,
};

function parseBool(str) {
  return (str === undefined) ? undefined :
        !validator.isBoolean(str) ? null :
        validator.toBoolean(str);
}

// options are optional see https://www.npmjs.com/package/validator
function parseInt(str, options) {
  return (str !== undefined) && validator.isInt(str, options) && validator.toInt(str);
}

// returns the str if its in the passed array of values, otherwise false.
function parseOptions(str, values) {
  return (str !== undefined) && validator.isIn(str, values) && str;
}

// does nothing; here for completeness
function parseString(str) {
  return str && str.trim();
}

// returns a dayjs date, or false if nothing specified.
function parseYmd(str) {
  return (str !== undefined) && dt.fromYMDString(str, {strict: false});
}

// read a possible json request into a javascript object.
// returns undefined for any error, logging to the console for debugging.
function parseJson(data) {
  // sometimes the client sends the data as a json like object;
  // sometimes it sends it as a string in an object with a member called json.
  return (data && data.json) ? JSON.parse(data.json) : data;
}
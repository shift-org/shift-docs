/**
 * reads query parameters and url parts
 */
const validator = require('validator');
const dt = require('shift-docs/util/dateTime')
const { ErrBadRequest } = require('shift-docs/util/errors');

module.exports = {
  parseBool,
  parseInt,
  parseJson,
  parseRange,
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
  return (str === undefined) ? undefined :
    !validator.isInt(str, options) ? null :
    validator.toInt(str);
}

// trim the string if it exists
function parseString(str) {
  return (str === undefined) ? undefined :
    str.trim();
}

// returns a dayjs date, or false if nothing specified.
function parseYmd(str) {
  return (str === undefined) ? undefined :
    dt.fromYMDString(str, {strict: false});
}

// read a possible json request into a javascript object.
// throws a ErrBadRequest if missing data or on any parsing error.
function parseJson(data) {
  // sometimes the client sends the data as a json like object;
  // sometimes it sends it as a string in an object with a member called json.
  let json;
  try {
    json = (data && data.json) ? JSON.parse(data.json) : data;
  } catch (e) {
    console.error("error parsing json data", e);
  }
  if (!json) {
    throw new ErrBadRequest("Invalid request");
  }
  return json;
}

// supports two query params: 's' & 'e' in YYYY-MM-DD format.
// throws a ErrBadRequest if the range was too large
function parseRange(req, maxRange = 6) {
  const start = parseYmd(req.query.s) || getDefaultStart();
  const end = parseYmd(req.query.e) || getDefaultEnd(start);
  //
  if (!start.isValid() || !end.isValid()) {
    throw new ErrBadRequest(`Requested invalid event range: start date was ${start} and end date was ${end}.`);
  }
  // FIX: for large ranges, pass as summarize.limit instead of erroring
  // search allows 'l' & 'o' parameters; so either do that
  // or support 'page=#' and multiply by max range.
  const range = end.diff(start, 'month');
  if ((range < 0) || (range > maxRange)) {
    throw new ErrBadRequest(`Requested too large a range: start date was ${start} and end date was ${end}.`);
  }
  return {
    start,
    end
  };
}

function getDefaultStart() {
  const now = dt.getNow();
  return now.subtract(1, 'month');
}

function getDefaultEnd(start) {
  return start.add(6, 'month');
}


/**
 * Biiikes Match: says whether an email is the organizer email of a ride.
 * Expects a JSON post with a series id and an email,
 * and a bearer token from BIIIKES_MATCH_TOKENS.
 *
 *    curl -k -X POST https://localhost:4443/api/biiikes_match.php \
 *      -H 'Authorization: Bearer example-token' \
 *      -H 'Content-Type: application/json' \
 *      --data '{"series_id": "6245", "email": "organizer@example.com"}'
 *
 * Returns http 200 and:
 *    { "leads": true }
 * only when the event exists, is published, isn't deleted, and has an email
 * that matches the one sent ( ignoring case and surrounding spaces. )
 * Every other well-formed request gets the same 200 { "leads": false },
 * so the answer doesn't say *why* an email didn't match.
 *
 * Errors:
 *  - 404 while BIIIKES_MATCH_TOKENS is unset ( the same as an unknown url )
 *  - 401 for a missing or unknown token
 *  - 429 once a token has made BIIIKES_MATCH_PER_HOUR requests this hour
 *  - 400 for a body that isn't json, or that's missing the series_id or email
 *
 * The email is never logged, and is never sent back.
 * See also: docs/CALENDAR_API.md
 */
const crypto = require("crypto");
const config = require("../config");
const { CalEvent } = require("../models/calEvent");

const hourMs = 60 * 60 * 1000;

// compared against when there's no stored email,
// so every well-formed request does the same work.
const dummyDigest = crypto.randomBytes(32);

// requests per token in the current hour: token digest (hex) -> { hour, count }
// in-process only; restarting the server resets the counts.
const usage = new Map();

exports.post = handleRequest;

// a json body that fails to parse would otherwise reach the app's
// generic error handler, which logs the stack -- and node's json errors
// quote part of the text that failed, which here can be the email.
exports.error = function(err, req, res, next) {
  if (!config.biiikesMatch.tokens.length) {
    return next(); // still hidden: let express answer 404.
  }
  // body-parser marks its errors with a type ( ex. 'entity.parse.failed' )
  if (err.type) {
    if (admit(req, res)) {
      res.textError('Request body must be JSON', 400);
    }
    return;
  }
  next(err);
};

function handleRequest(req, res, next) {
  // without tokens, act as if this endpoint doesn't exist.
  if (!config.biiikesMatch.tokens.length) {
    return next();
  }
  if (!admit(req, res)) {
    return;
  }
  const data = req.body;
  if (!req.is('application/json') || !data || typeof data !== 'object' || Array.isArray(data)) {
    return res.textError('Request body must be a JSON object', 400);
  }
  const seriesId = parseSeriesId(data.series_id);
  if (!seriesId) {
    return res.textError('Missing or invalid series_id', 400);
  }
  if (typeof data.email !== 'string') {
    return res.textError('Missing or invalid email', 400);
  }

  const given = normalize(data.email);
  return CalEvent.getByID(seriesId).then((evt) => {
    const stored = (evt && evt.isPublished() && !evt.isDeleted()) ? normalize(evt.email) : "";
    // always compare, even when there's nothing to compare against;
    // the dummy digest can't match anything.
    const same = crypto.timingSafeEqual(
      digest(given),
      stored ? digest(stored) : dummyDigest);
    const leads = same && !!given && !!stored;
    res.json({ leads });
  }).catch(next);
}

// checks the token and counts the request against its hourly limit.
// returns true if the request can go ahead;
// otherwise, it has already sent a 401 or 429.
function admit(req, res) {
  const { tokens, perHour } = config.biiikesMatch;
  prepare(res);
  const token = matchToken(req.get('Authorization'), tokens);
  if (!token) {
    res.set('WWW-Authenticate', 'Bearer');
    res.textError('Missing or unknown token', 401);
    return false;
  }
  const retryAfter = countRequest(token, perHour);
  if (retryAfter) {
    res.set('Retry-After', String(retryAfter));
    res.textError('Too many requests', 429);
    return false;
  }
  return true;
}

// headers for every response this endpoint makes.
function prepare(res) {
  // this is for a server, not for browsers:
  // remove the cross-origin header the app sets on every request.
  res.removeHeader('Access-Control-Allow-Origin');
  res.set('Cache-Control', 'no-store');
  res.set(config.api.header, config.api.version);
}

// returns the configured token that matches the authorization header, or null.
// checks every token so the time taken doesn't depend on which one matched.
function matchToken(header, tokens) {
  const m = /^Bearer\s+(\S+)\s*$/i.exec(header || "");
  const given = digest(m ? m[1] : "");
  let found = null;
  for (const token of tokens) {
    const same = crypto.timingSafeEqual(given, digest(token));
    if (same && m) {
      found = token;
    }
  }
  return found;
}

// counts a request against a token's hourly limit.
// returns 0 if the request is allowed,
// otherwise the number of seconds until the next hour starts.
function countRequest(token, perHour, now = Date.now()) {
  const key = digest(token).toString('hex');
  const hour = Math.floor(now / hourMs);
  let entry = usage.get(key);
  if (!entry || entry.hour !== hour) {
    entry = { hour, count: 0 };
    usage.set(key, entry);
  }
  if (entry.count >= perHour) {
    return Math.ceil(((hour + 1) * hourMs - now) / 1000);
  }
  entry.count++;
  return 0;
}

// calevent ids are positive whole numbers.
// accepts a string of digits ( the documented form ) or a number.
function parseSeriesId(id) {
  const str = (typeof id === 'number') ? String(id) : id;
  return (typeof str === 'string' && /^[1-9][0-9]{0,9}$/.test(str)) ? str : null;
}

function normalize(email) {
  return (typeof email === 'string') ? email.trim().toLowerCase() : "";
}

function digest(str) {
  return crypto.createHash('sha256').update(str, 'utf8').digest();
}

// for testing: forget all request counts.
exports.resetLimits = function() {
  usage.clear();
};

/**
 * exports a single function: useApi() which defines REST-like endpoints.
 * these endpoints all use new server code.
 * they require a version number to indicate which set of db tables to use.
 * - all of them allow the version 2 tables.
 * - some of them allow the version 1 tables.
 * in theory, these endpoints perform faster than their php counterparts.
 */
const config = require("server/core/config");
const { StatusError } = require("server/support/errors");
const { uploader } = require("server/support/uploader");
//
const deleteEvent = require("./deleteEvent");
const getEventInstance = require("./getEventInstance");
const getEventCount = require("./getEventCount");
const getEventRange = require("./getEventRange");
const getSearch = require("./getSearch");
const handleLegacyRedirect = require("./handleLegacyRedirect");

// where app is an express object
// https://expressjs.com/en/guide/routing.html
function useApi(app) {
  // base of every url
  const versioned = "/api/v:version:";
  const versionv2 = "/api/v2";

  // GET /count.json
  app.get(versioned + "/count.json", renderJson(getEventCount));
  // GET /search.json?q=breakfast
  app.get(versioned + "/search.json", renderJson(getSearch));

  // GET /events(.json|.ical)?s=2020-05-12&e=2026-05-12
  app.get(versioned + "/events.json", renderJson(getEventRange));
  app.get(versionv2 + "/events.ical", renderCal(getCalRange));

  // GET /events/1234(.json|.ical)
  app.get(versioned + "/events/:seriesId:.json", renderJson(getEventSeries));
  app.get(versionv2 + "/events/:seriesId:.ical", renderCal(getCalSeries));

  // GET /events/1234/2026-05-12(.json|.ical)
  app.get(versioned + "/events/:seriesId:/:ymd:.json", renderJson(getEventInstance));
  app.get(versionv2 + "/events/:seriesId:/:ymd:.ical", renderCal(getCalInstance));

  // POST /events/1234?_method=DELETE
  app.post(versionv2 + "/events/:seriesId:", postJson(deleteEvent, {_method: "DELETE"}));
  app.post(versionv2 + "/events/:seriesId:", postJson(createNewEvent));
  app.post(versionv2 + "/events/:seriesId:", postJson(updateExistingEvent));

  // GET /legacy/32(.json|.ical)
  // the instance of a particular event on a particular day identified by id
  // redirects to an event-day style url.
  app.get(versioned + "/legacy/:pkid:.:ext:", renderJson(handleLegacyRedirect));
}

module.exports = { useApi };

function postJson(cb, queryMatch) {
  // the client sends multi-part form posts
  // so parse that first using the uploader util.
  const handleForm = uploader.makeHandler();
  return [handleForm, renderJson(cb, queryMatch)];
}

function renderJson(cb, queryMatch) {
  return function(req, res, next) {
    // our endpoints generate "plain old data"
    getResponse(cb, queryMatch).then(pod => {
      // that data gets turned into a json response by express.
      if (pod !== undefined) {
        res.json(pod);
      } else {
        // or, we send a generic okay in the body.
        res.sendStatus(200);
      }
    });
  }
}

function renderCal(cb, queryMatch) {
  return function(req, res, next) {
    // the ical callbacks generate a CalendarFeed object.
    getResponse(cb, queryMatch).then(ical => ical.send(res));
  }
}

// wrapper for shift endpoints.
function getResponse(cb, queryMatch) {
  return function(req, res, next) {
    // only handle this endpoint if the query expectations matched
    if (queryMatch && !checkQuery(queryMatch)) {
      next('route'); // tells express to move to the next router statement
    } else {
      // add the shift version info
      res.set(config.api.header, config.api.version);
      // express 4 doesn't seem to support promises
      // so create our own promise chain
      // and then call the appropriate express functions.
      // express is asynchronous: it waits until a result is generated, or until next() is called.
      return Promise.resolve().then(cb => {
        return cb(req); // if the callback throws an error, that's handled by catch
      }).catch((err) => {
        // some code uses promise.reject for expected errors.
        if (typeof(err) === 'string') {
          res.status(400).send(err);
        } else if (err instanceof StatusError) {
          // other code throws specific error types.
          err.sendError(res);
        } else {
          // otherwise, hand the error to express.
          next(err);
        }
      });
    }
  }
}

// does every value in match appear in the request query parameters?
// returns true if there's nothing to match
function checkQuery(req, match) {
  const keys = Object.keys(match);
  return keys.every(key => req.query[key] === match[key]);
}
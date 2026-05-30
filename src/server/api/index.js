/**
 * exports a single function: useApi() which defines REST-like endpoints.
 * these endpoints all use new server code.
 * they require a version number to indicate which set of db tables to use.
 * - all of them allow the version 2 tables.
 * - some of them allow the version 1 tables.
 * in theory, these endpoints perform faster than their php counterparts.
 */
const config = require("server/core/config");
const { StatusError, sendFieldError } = require("server/support/errors");
const { FileFormatError, uploader } = require("server/support/uploader");
const { MulterError } = require('multer');
//
const createNewEvent = require("./createNewEvent");
const deleteEvent = require("./deleteEvent");
const getCalInstance = require("./getCalInstance");
const getCalRange = require("./getCalRange");
const getCalSeries = require("./getCalSeries");
const getEventCount = require("./getEventCount");
const getEventInstance = require("./getEventInstance");
const getEventRange = require("./getEventRange");
const getEventSeries =  require("./getEventSeries");
const getSearch = require("./getSearch");
const handleLegacyRedirect = require("./handleLegacyRedirect");
const updateExistingEvent = require("./updateExistingEvent");

module.exports = useApi;

// where app is an express object
// https://expressjs.com/en/guide/routing.html
// https://bjohansebas.github.io/playground-router/
function useApi(app) {
  // base of every url
  const versioned = "/api/v:version";
  const v2only = "/api/v2";

  // POST /events
  // exceptions in post can raise "Unexpected end of form error"
  // when there are other handlers present; listing them first seems to help.
  app.post(v2only + "/events", postJson(createNewEvent));

  // POST /events/1234
  app.post(v2only + "/events/:seriesId", postJson(updateExistingEvent,
    q => q._method === undefined )); // match only if a method isn't passed

  // POST /events/1234?_method=DELETE
  app.post(v2only + "/events/:seriesId", postJson(deleteEvent,
    q => q._method === "DELETE"));// match only if method is delete

  // GET /count.json -- /api/v2/count.json
  app.get(versioned + "/count.json", renderJson(getEventCount));

  // GET /search.json?q=breakfast
  app.get(versioned + "/search.json", renderJson(getSearch));

  // GET /events(.json|.ical)?s=2020-05-12&e=2026-05-12
  app.get(versioned + "/events.json", renderJson(getEventRange));
  app.get(versioned + "/events.ical", renderCal(getCalRange));

  // GET /events/1234(.json|.ical)
  app.get(versioned + "/events/:seriesId.json", renderJson(getEventSeries));
  app.get(versioned + "/events/:seriesId.ical", renderCal(getCalSeries));

  // GET /events/1234/2026-05-12(.json|.ical)
  app.get(versioned + "/events/:seriesId/:ymd.json", renderJson(getEventInstance));
  app.get(versioned + "/events/:seriesId/:ymd.ical", renderCal(getCalInstance));

  // GET /legacy/32(.json|.ical)
  // the instance of a particular event on a particular day identified by id
  // redirects to an event-day style url.
  app.get(versioned + "/legacy/:pkid.:ext", renderJson(handleLegacyRedirect));

  app.use(handleError);
}

const upload = uploader.makeUploader();

function postJson(cb, queryFilter) {
  // the client sends multi-part form posts
  // so parse that first using the uploader util.
  return [upload, renderJson(cb, queryFilter)];
}

function renderJson(cb, queryFilter) {
  // our endpoints generate "plain old data"
  return handleCall(cb, queryFilter, (res, pod) => {
    // send that data as json in response.
    if (pod !== undefined) {
      res.json(pod);
    } else {
      // or, send a generic okay.
      res.sendStatus(200);
    }
  });
}

function renderCal(cb, queryFilter) {
  // our endpoints generate cal responses
  return handleCall(cb, queryFilter, (res, cal) => {
    cal.sendCal(res);
  });
}

// wrapper for shift endpoints.
// assumes 'cb' either generates a promise or throws an error,
// and that 'send' can handle the result of that promise.
function handleCall(cb, queryFilter, send) {
  // express request, response, and chain handler
  return function(req, res, next) {
    // only handle this endpoint if the query expectations matched
    if (queryFilter && !queryFilter(req.query)) {
      next('route'); // tells express to move to the next router statement
    } else {
      // add the shift version info
      res.set(config.api.header, config.api.version);
      // express 4 doesn't directly support promises; so create our own promise chain.
      // ( express is asynchronous: waiting until a result is generated, or until next() is called; ex. on error. )
      return Promise.resolve(cb(req)).then(ret => {
        send(res, ret);
      }).catch(next);
    }
  }
}
// any errors thrown the request handlers wind up here.
// https://expressjs.com/en/guide/error-handling/
function handleError(err, req, res, next) {
  // let express handle the php endpoints in the old way.
  if (!req.path.startsWith("/api/v")) {
    next(err);
  } else {
    // skips logging common errors during testing
    if (!config.isTesting) {
      console.debug("Client error detected:", err.stack);
    }
    // some code uses promise.reject for expected errors.
    // those don't send the json field errors
    if (typeof(err) === 'string') {
      res.status(400).send(err);
    } else if (err instanceof StatusError) {
      // other code throws specific error types.
      err.sendError(res);
    } else if ((err instanceof MulterError) || (err instanceof FileFormatError)) {
      // cheating: knows that the form uses 'image' as its field for these errors.
      sendFieldError(res, {image: err.message || "Unknown error" });
    } else {
      // okay, for unknown errors, log those while testing.
      if (config.isTesting) {
        console.error("Unknown error detected:", err.stack);
      }
      // otherwise, hand a generic error to express.
      // ( to avoid leaking any internal info to the client )
      const errors = [
        "Something unexpected went wrong.",
        "The server developed a flat.",
        "The chain fell off."
      ];
      const str = errors[Math.random() * (errors.length - 1)]
      next(`Eek! ${str} Please try again.`);
    }
  }
}
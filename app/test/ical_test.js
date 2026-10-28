const assert = require('node:assert/strict');
const { describe, it, beforeEach, afterEach } = require('node:test');
const request = require('supertest');
const sandbox = require('sinon').createSandbox();
//
const app = require('shift-docs/appEndpoints');
const testing = require('shift-docs/testing');
const db = require('shift-docs/db');

describe("ical feed", () => {
  beforeEach(() => {
    testing.fakeNow(sandbox);
    testing.fakeSiteUrl(sandbox, "https://shift2bikes.org");
    testing.configure("ical");
    return testing.setupTestData("ical");
  });
  afterEach(() => {
    sandbox.restore();
    return testing.reset();
  });
  it("reports 404 for a series id that matches no events", () => {
    // 'id' aliases to series_id. an id that matches nothing is
    // "not found", not a bad request.
    // re: #566
    return request(app)
      .get('/api/ical.php')
      .query({
        id: 999
      })
      .expect(404);
  });
  it("reports 404 for an event id that matches no event", () => {
    return request(app)
      .get('/api/ical.php')
      .query({
        event_id: 999
      })
      .expect(404);
  });
  it("errors on an invalid date",  () => {
    return request(app)
      .get('/api/ical.php')
      .query({
        // date time formats have been loosened ( #ff5ae63 )
        // clearly invalid dates are still rejected.
        startdate: "apple",
        enddate  : "sauce",
        // startdate: "2002/05/06",
        // enddate  : "2002/05/06",
      })
      .expect(400);
  });
  it("reports 413 on too large a range",  () => {
    return request(app)
      .get('/api/ical.php')
      .query({
        startdate: "2002-01-01",
        enddate  : "2003-01-01",
      })
      .expect(413);
  });
  it("reports 422 on a negative range",  () => {
    return request(app)
      .get('/api/ical.php')
      .query({
        startdate: "2003-01-01",
        enddate  : "2002-01-01",
      })
      .expect(422);
  });
  it("supports an 'all events' feed", () => {
    return request(app)
      .get('/api/ical.php')
      .then(testing.expectOkay);
  });
  it("provides the days of a single event", () => {
    return request(app)
      .get('/api/ical.php')
      .query({
         id: 2, // an event id
       })
      .then(testing.expectOkay)
      .then(res => assert.equal(res.text, testing.expectedResults.allEvents));
  });
  it("provides a range of days", () => {
    return request(app)
      .get('/api/ical.php')
      .query({
         startdate: "2002-08-01",
         enddate  : "2002-08-02",
       })
      .then(testing.expectOkay);
  });
  it("can return an empty range", () => {
    return request(app)
      .get('/api/ical.php')
      .query({
         startdate: "2002-01-01",
         enddate  : "2002-01-02",
       })
      .then(testing.expectOkay)
      .then(res => assert.equal(res.text, testing.expectedResults.emptyRange));
  });
  it("has a special pedalpalooza feed", () => {
     return request(app)
      .get('/api/ical.php')
      .query({
         startdate: "2002-08-01",
         enddate  : "2002-08-02",
         filename : "pedalpalooza-2024.ics",
       })
      .then(testing.expectOkay)
      .then(res => assert.equal(res.text, testing.expectedResults.pedalpaloozaFeed));
  });
  it("can handle a canceled event", () => {
    return Promise.resolve()
      // cancel all events on the indicated day.
      .then(_ => {
        return db.query.table('cal_schedule')
          .update({is_scheduled: 0})
          .where('ymd', '2002-08-01')
      })
      // query an event that contains that day.
      .then(_ => {
        return request(app)
          .get('/api/ical.php')
          .query({id: 2})
      })
      .then(testing.expectOkay)
      .then(res => assert.equal(res.text, testing.expectedResults.cancelledDay));
  });
});

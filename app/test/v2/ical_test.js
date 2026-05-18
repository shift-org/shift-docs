const app = require("shift-docs/appEndpoints");
const db = require("server/core/db");
const testData = require("../testData");
const testdb = require("./testdb");

const { EventStatus } = require("server/model/shorthands");
//
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const request = require('supertest');
const sandbox = require('sinon').createSandbox();

const CalendarType = /^text\/calendar/;

describe.skip("ical feed", () => {
  // runs before the evt test in this block.
  before(() => {
    testData.fakeNow(sandbox);
    testData.fakeSiteUrl(sandbox, "https://shift2bikes.org");
    return testdb.setupTestData("ical");
  });
  // runs once after the last test in this block
  after(() => {
    sandbox.restore();
    return testdb.destroy();
  });
  it("errors on an invalid id", () => {
    return request(app)
      .get('/api/ical.php')
      .query({
        id: 999
      })
      .expect(400);
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
  it("errors on too large a range",  () => {
    return request(app)
      .get('/api/ical.php')
      .query({
        startdate: "2002-01-01",
        enddate  : "2003-01-01",
      })
      .expect(400);
  });
  it("errors on a negative range",  () => {
    return request(app)
      .get('/api/ical.php')
      .query({
        startdate: "2003-01-01",
        enddate  : "2002-01-01",
      })
      .expect(400);
  });
  it("supports an 'all events' feed", () => {
    return request(app)
      .get('/api/ical.php')
      // test that it also has an api version
      // that exists everywhere, but only tested here.
      .expect('Api-Version', /^3\./)
      .expect(200)
      .expect('content-type', testData.CalendarType)
      .then(res => {
        // now() is set by testData to 2002-08-05
        assert.equal(res.text, testData.allEvents);
      });
  });
  it("provides the days of a single event", () => {
    return request(app)
      .get('/api/ical.php')
      .query({
         id: 2, // an event id
       })
      .expect(200)
      .expect('content-type', testData.CalendarType)
      .then(res => {
        assert.equal(res.text, testData.allEvents);
      });
  });
  it("provides a range of days", () => {
    return request(app)
      .get('/api/ical.php')
      .query({
         startdate: "2002-08-01",
         enddate  : "2002-08-02",
       })
      .expect(200)
      .expect('content-type', testData.CalendarType);
  });
  it("can return an empty range", () => {
    return request(app)
      .get('/api/ical.php')
      .query({
         startdate: "2002-01-01",
         enddate  : "2002-01-02",
       })
      .expect(200)
      .expect('content-type', testData.CalendarType)
      .then(res => {
        assert.equal(res.text, testData.emptyRange);
      });
  });
  it("has a special pedalpalooza feed", () => {
     return request(app)
      .get('/api/ical.php')
      .query({
         startdate: "2002-08-01",
         enddate  : "2002-08-02",
         filename : "pedalpalooza-2024.ics",
       })
      .expect(200)
      .expect('content-type', testData.CalendarType)
      .then(res => {
        assert.equal(res.text, testData.pedalpaloozaFeed);
      });
  });
  it("can handle a canceled event", async () => {
    const seriesId = 2;
    const dayToCancel = '2002-08-01';
    // write the canceled status to the db.
    await db.query.table('schedule')
      .update({is_scheduled: 0})
      .where('ymd', dayToCancel);
    // todo: create a separate test where these values are nil and zero.
    // that had caused a bad feed at one point; it's fixed but still good to test.
    // evt.eventtime = null;
    // evt.eventduration = 0;
    return request(app)
      .get('/api/ical.php')
      .query({
         id: seriesId,
       })
      .expect(200)
      .expect('content-type', testData.CalendarType)
      .then(res => {
        assert.equal(res.text, testData.cancelledDay);
      });
  });
});

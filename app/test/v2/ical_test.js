const assert = require("node:assert/strict");
const { describe, it, before, after } = require("node:test");
const sandbox = require('sinon').createSandbox();

const db = require("server/core/db");
const test = require("../testData");
const testdb = require("./testdb");

const { EventStatus } = require("server/model/shorthands");

describe("v2 ical feed", () => {
  // runs before the evt test in this block.
  before(() => {
    test.fakeNow(sandbox);
    test.fakeSiteUrl(sandbox, "https://shift2bikes.org");
    test.configure("v2", "ical");
    return testdb.setupTestData("ical");
  });
  // runs once after the last test in this block
  after(() => {
    test.configure();
    sandbox.restore();
    return testdb.destroy();
  });
  it("errors on an invalid id", () => {
    return test.GET(test.api.eventSeries(999))
      .expect(400);
  });
  it("errors on an invalid date",  () => {
     return test.GET(test.api.eventRange("apple", "sauce"))
      .expect(400);
  });
  it("errors on too large a range",  () => {
     return test.GET(test.api.eventRange("2002-01-01","2003-01-01"))
      .expect(400);
  });
  it("errors on a negative range",  () => {
    return test.GET(test.api.eventRange("2003-03-01","2003-02-01"))
      .expect(400);
  });
  it("supports an 'all events' feed", () => {
    return test.GET(test.api.eventList())
      // test that it also has an api version
      // that exists everywhere, but only tested here.
      .then(test.expectOkay)
      .then(res => {
        // now() is set by test to 2002-08-05
        assert.equal(res.text, test.allEvents);
      });
  });
  it("provides the days of a single event", () => {
    return test.GET(test.api.eventSeries(2))
      .then(test.expectOkay)
      .then(res => {
        assert.equal(res.text, test.allEvents);
      });
  });
  it("provides a range of days", () => {
    return test.GET(test.api.eventRange("2002-08-01", "2002-08-02"))
      .then(test.expectOkay)
      .then(res => {
        assert.equal(res.text, test.allEvents);
      });
  });
  it("can return an empty range", () => {
    return test.GET(test.api.eventRange("2002-01-01","2002-01-02"))
      .then(test.expectOkay)
      .then(res => {
        assert.equal(res.text, test.emptyRange);
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
    return test.GET(test.api.eventSeries(2))
      .then(test.expectOkay)
      .then(res => {
        assert.equal(res.text, test.cancelledDay);
      });
  });
});

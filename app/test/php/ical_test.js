const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const sandbox = require('sinon').createSandbox();
//
const db = require("server/core/db");
//
const { CalEvent } = require("shift-docs/models/calEvent");
const { CalDaily } = require("shift-docs/models/calDaily");
const { EventStatus } = require("shift-docs/models/calConst");
const test = require("../testData");
const testdb = require("../v1data");
const { allEvents, cancelledDay, emptyRange, pedalpaloozaFeed } = test;

describe("getting v1 ical feed", () => {
  // runs before the evt test in this block.
  before(() => {
    test.fakeNow(sandbox);
    test.fakeSiteUrl(sandbox, "https://shift2bikes.org");
    test.configure("v1", "ical");
    return testdb.setupTestData("ical");
  });
  // runs once after the last test in this block
  after(() => {
    test.configure();
    sandbox.restore();
    return testdb.destroy();
  });
  it("errors on an invalid id", () => {
    return test.GET(test.api.calSeries(999))
      .expect(400);
  });
  it("errors on an invalid date",  () => {
    return test.GET(test.api.calRange("apple", "sauce"))
      .expect(400);
  });
  it("errors on too large a range",  () => {
    return test.GET(test.api.calRange("2002-01-01","2003-01-01"))
      .expect(400);
  });
  it("errors on a negative range",  () => {
    return test.GET(test.api.calRange("2003-03-01","2003-02-01"))
      .expect(400);
  });
  it("supports an 'all events' feed", () => {
    return test.GET(test.api.calList())
      .then(test.expectOkay)
  });
  it("provides the days of a single event", () => {
    return test.GET(test.api.calSeries(2))
      .then(test.expectOkay)
      .then(res => {
        assert.equal(res.text, allEvents);
      });
  });
  it("provides a range of days", () => {
    return test.GET(test.api.calRange("2002-08-01","2002-08-02"))
      .then(test.expectOkay)
      .then(res => {
        assert.ok(true);
      });
  });
  it("can return an empty range", () => {
    return test.GET(test.api.calRange("2002-01-01","2002-01-02"))
      .then(test.expectOkay)
      .then(res => {
        assert.equal(res.text, emptyRange);
      });
  });
  // no longer:
  // it("has a special pedalpalooza feed", () => {
  //    return test.GET(test.api.calRange("2002-08-01","2002-08-02", "pedalpalooza-2024.ics"))
  //     .then(test.expectOkay)
  //     .then(res => {
  //       assert.equal(res.text, pedalpaloozaFeed);
  //     });
  // });
  it("can handle a canceled event", () => {
    return CalEvent.getByID(2).then(evt => {
      // todo: create a separate test where these values are nil and zero.
      // that had caused a bad feed at one point; its fixed but still good to test.
      // evt.eventtime = null;
      // evt.eventduration = 0;
      return evt._store().then(() => {
        return CalDaily.getForTesting(201).then(d => {
          d.eventstatus = EventStatus.Cancelled;
          return d._store().then(_ => {
            return test.GET(test.api.calSeries(2))
              .then(test.expectOkay)
              .then(res => {
                assert.equal(res.text, cancelledDay);
              });
          });
        });
      });
    });
  });
});
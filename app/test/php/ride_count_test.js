const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const testdb = require("./testdb");
const test = require("../testData");

describe("v1 ride count testing", () => {
  // runs before the first test in this block.
  before(() => {
    test.configure("v1", "json");
    return testdb.setupFakeData("count");
  });
  // runs once after the last test in this block
  after(() => {
    test.configure();
    return testdb.destroy();
  });
  it("handles an all encompassing range", () => {
    return test.GET(test.api.count("1900-01-01", "2012-12-21"))
      .then(test.expectOkay)
      .then(res => {
        // past and upcoming are based on today's date
        // all the test dates are earlier
        // TODO? set a global fake date, or fake some events in the future?
        assert.equal(res.body?.total, 75);
        assert.equal(res.body?.past, 75);
        assert.equal(res.body?.upcoming, 0);
      });
  });
  it("handles a slice of time", () => {
    return test.GET(test.api.count("2002-08-10", "2002-08-11"))
      .then(test.expectOkay)
      .then(res => {
        assert.equal(res.body?.total, 4);
      });
  });
  it("errors on a missing time", () => {
    return test.GET(test.api.count())
      .then(test.expectError);
  });
  it("errors on an invalid time", () => {
    return test.GET(test.api.count("yesterday", "tomorrow"))
      .then(test.expectError);
  });
});

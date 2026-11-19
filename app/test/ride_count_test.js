const assert = require('node:assert/strict');
const { describe, it, beforeEach, afterEach } = require('node:test');
const request = require('supertest');
//
const app = require('shift-docs/appEndpoints');
const testing = require('shift-docs/testing');

describe("ride count testing", () => {
  beforeEach(() => {
    testing.configure("json");
    return testing.setupFakeData("count");
  });
  afterEach(() => {
    return testing.reset();
  });
  it("handles an all encompassing range", () => {
    return request(app)
      .get('/api/ride_count.php')
      .query({s: "1900-01-01", e: "2012-12-21"})
      .then(testing.expectOkay)
      .then(res => {
        // past and upcoming are based on today's date
        // all the test dates are earlier
        // TODO? set a global fake date,
        // testing.fakeNow(sandbox);
        assert.equal(res.body?.total, 75);
        assert.equal(res.body?.past, 75);
        assert.equal(res.body?.upcoming, 0);
      });
  });
  it("handles a slice of time", () => {
    return request(app)
      .get('/api/ride_count.php')
      .query({s: "2002-08-10", e: "2002-08-11"})
      .then(testing.expectOkay)
      .then(res => {
        assert.equal(res.body?.total, 4);
      });
  });
  it("reports error 400 on a missing time", () => {
    return request(app)
      .get('/api/ride_count.php')
      .then(testing.expectError);
  });
  it("reports error 400 on an invalid time", () => {
    return request(app)
      .get('/api/ride_count.php')
      .query({s: "yesterday", e: "tomorrow"})
      .then(testing.expectError);
  });
});

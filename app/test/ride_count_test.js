const app = require("../appEndpoints");
const testdb = require("./testdb");
//
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const request = require('supertest');

describe("ride count testing", () => {
  // runs before the first test in this block.
  before(() => {
    return testdb.setupFakeData("count");
  });
  // runs once after the last test in this block
  after(() => {
    return testdb.destroy();
  });
  it("handles an all encompassing range", () => {
    return request(app)
      .get('/api/ride_count.php')
      .query({s: "1900-01-01", e: "2012-12-21"})
      .expect(200)
      .expect('Content-Type', /json/)
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
    return request(app)
      .get('/api/ride_count.php')
      .query({s: "2002-08-10", e: "2002-08-11"})
      .expect(200)
      .expect('Content-Type', /json/)
      .then(res => {
        assert.equal(res.body?.total, 4);
      });
  });
  it("errors on a missing time", () => {
    return request(app)
      .get('/api/ride_count.php')
      .expect(400)
      .expect('Content-Type', /json/);
  });
  it("errors on an invalid time", () => {
    return request(app)
      .get('/api/ride_count.php')
      .query({s: "yesterday", e: "tomorrow"})
      .expect(400)
      .expect('Content-Type', /json/);
  });
});

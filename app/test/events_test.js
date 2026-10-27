const assert = require('node:assert/strict');
const { describe, it, beforeEach, afterEach } = require('node:test');
const request = require('supertest');
//
const app = require('shift-docs/appEndpoints');
const testing = require('shift-docs/testing');

describe("getting events", () => {
  beforeEach(() => {
    testing.configure("json");
    return testing.setupTestData("deleting with forms");
  });
  afterEach(() => {
    return testing.reset();
  });
  it("reports error 400 with no parameters", () => {
    return request(app)
      .get('/api/events.php')
      .then(testing.expectError);
  });
  it("reports 404 for an id that doesn't match a visible event", () => {
    return request(app)
      .get('/api/events.php')
      .query({ id: 999 })
      // an id that matches nothing is "not found", not a bad request.
      // re: #566
      .then(res => testing.expectError(res, null, 404));
  });
  it("reports error 400 on an invalid date", () => {
    return request(app)
      .get('/api/events.php')
      .query({
        // date time formats have been loosened ( #ff5ae63 )
        // clearly invalid dates are still rejected.
        startdate: "apple",
        enddate  : "sauce",
        // startdate: "2002/05/06",
        // enddate  : "2002/05/06",
      })
      .then(testing.expectError);
  });
  it("reports 413 on too large a range", () => {
    return request(app)
      .get('/api/events.php')
      .query({
        startdate: "2002-01-01",
        enddate  : "2003-01-01",
      })
      .then(res => testing.expectError(res, null, 413));
  });
  it("reports 422 on a negative range", () => {
    return request(app)
      .get('/api/events.php')
      .query({
        startdate: "2003-01-01",
        enddate  : "2002-01-01",
       })
      // parseable, but not a range we can answer. re: #559
      .then(res => testing.expectError(res, null, 422));
  });
  it("succeeds with a valid pkid", () => {
    return request(app)
      .get('/api/events.php')
      .query({ id: 201 })
      .then(testing.expectOkay)
      .then(res => {
        assert.equal(res.body?.events?.length, 1);
        const evt = res.body.events[0];
        assert.equal(evt.id, '2');
        assert.equal(evt.caldaily_id, '201');
        assert.equal(evt.hideemail, true, "the test data has the email hidden");
        assert.equal(evt.email, null, "with no secret the email should be nil");
        assert.equal(evt.endtime, '20:00:00');
        assert.equal(res.body.pagination, undefined, "only ranges should have pagination");
      });
  });
  it("succeeds with an empty array for a range with no events", () => {
    // unlike a missing id, an empty range is a meaningful answer: nothing is
    // scheduled then. it must stay a 200, not become a 404.
    return request(app)
      .get('/api/events.php')
      .query({
         startdate: "2002-09-01",
         enddate  : "2002-09-02",
       })
      .then(testing.expectOkay)
      .then(res => {
        assert.deepEqual(res.body.events, []);
        assert.equal(res.body.pagination.events, 0);
      });
  });
  it("succeeds with a valid range", () => {
    return request(app)
      .get('/api/events.php')
      .query({
         startdate: "2002-08-01",
         enddate  : "2002-08-02",
       })
      .then(testing.expectOkay)
      .then(res => {
        // console.log(res.body);
        assert.equal(res.body?.events?.length, 2);
        const evt = res.body.events[0];
        assert.equal(evt.id, '2');
        assert.equal(evt.caldaily_id, '201');
        assert.equal(evt.hideemail, true, "the test data has the email hidden");
        assert.equal(evt.email, null, "with no secret the email should be nil");
        assert.ok(res.body.pagination, "range should have pagination");
        const page = res.body.pagination;
        assert.equal(page.events, 2);
        assert.equal(page.start, '2002-08-01');
        assert.equal(page.end, '2002-08-02');
        assert.match(page.next, /\?startdate=2002-08-03&enddate=2002-08-04$/);
      });
  });
});

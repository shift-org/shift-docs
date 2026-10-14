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
  it("errors with no parameters", () => {
    return request(app)
      .get('/api/events.php')
      .then(testing.expectError);
  });
  it("errors on an invalid id", () => {
    return request(app)
      .get('/api/events.php')
      .query({
          id: 999
        })
      .then(testing.expectError);
  });
  it("errors on an invalid date", () => {
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
  it("errors on too large a range", () => {
    return request(app)
      .get('/api/events.php')
      .query({
        startdate: "2002-01-01",
        enddate  : "2003-01-01",
      })
      .then(testing.expectError);
  });
  it("errors on a negative range", () => {
    return request(app)
      .get('/api/events.php')
      .query({
        startdate: "2003-01-01",
        enddate  : "2002-01-01",
       })
      .then(testing.expectError);
  });
  it("succeeds with a valid id", () => {
    return request(app)
      .get('/api/events.php')
      .query({
         id: 201, // a daily id
       })
      .then(testing.expectOkay)
      .then(res => {
        assert.equal(res.body?.events?.length, 1);
        const evt = res.body.events[0];
        assert.equal(evt.id, '2');
        assert.equal(evt.caldaily_id, '201');
        assert.equal(evt.hideemail, true, "the test data has the email hidden");
        assert.equal(evt.email, null, "with no secret the email should be nil");
        assert.equal(res.body.pagination, undefined, "only ranges should have pagination");
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

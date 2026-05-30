const testdb = require("../v1data");
const test = require("../testData");
//
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");

// point to the events php endpoint
describe("v1 getting events", () => {
  // runs before the evt test in this block.
  before(() => {
    test.configure("v1", "json");
    return testdb.setupTestData("events");
  });
  // runs once after the last test in this block
  after(() => {
    return testdb.destroy();
  });
  it("errors with no parameters", () => {
    return test.GET(test.api.eventList())
      .then(test.expectError);
  });
  it("errors on an invalid id", () => {
      return test.GET(test.api.eventInstance(999))
      .then(test.expectError);
  });
  it("errors on an invalid date", () => {
    return test.GET(test.api.eventRange("apple", "sauce"))
      .then(test.expectError);
  });
  it("errors on too large a range", () => {
    return test.GET(test.api.eventRange("2002-01-01", "2003-01-01"))
      .then(test.expectError);
  });
  it("errors on a negative range", () => {
     return test.GET(test.api.eventRange("2003-01-01", "2002-01-01"))
      .then(test.expectError);
  });
  it("succeeds with a valid id", () => {
    return test.GET(test.api.eventInstance(201))
      .then(test.expectOkay)
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
    return test.GET(test.api.eventRange("2002-08-01", "2002-08-02"))
      .then(test.expectOkay)
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

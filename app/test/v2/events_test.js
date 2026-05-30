const testdb = require("./testdb");
const test = require("../testData");
const sandbox = require('sinon').createSandbox();
//
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const config = require("server/core/config");

// todo: add a test for eventSeries

describe("v2 getting events", () => {
  // runs before the evt test in this block.
  before(() => {
    test.configure("v2", "json");
    test.fakeSiteUrl(sandbox);
    return testdb.setupTestData("events");
  });
  // runs once after the last test in this block
  after(() => {
    test.configure();
    sandbox.restore();
    return testdb.destroy();
  });
  // NOTE: new api allows this
  it("errors with no parameters", () => {
    return test.GET(test.api.eventList())
      .then(test.expectOkay)
      .then(res => {
        // TODO: add some validation here.
        console.log(JSON.stringify(res.body));
      });
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
  it("handles a legacy pkid", () => {
    const expectedRedirect = test.api.eventDay(2, "2002-08-01");
    return test.GET(test.api.eventInstance(201))
      .expect(302) // redirect reports found
      .expect('Location', expectedRedirect)
      .then(_ => true);
    });

  it("succeeds with a valid series and day", () => {
    return test.GET(test.api.eventDay(2, "2002-08-01"))
      .then(test.expectOkay)
      .then(res => {
        assert.equal(res.body?.events?.length, 1);
        const evt = res.body.events[0];
        assert.equal(evt.id, '2');
        assert.equal(evt.caldaily_id, '201');
        assert.equal(evt.email, null, "with no secret the email should be nil");
        assert.equal(evt.hideemail, undefined, "only exists for manage/retrieve");
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
        assert.equal(evt.hideemail, undefined, "only exists for manage/retrieve");
        assert.equal(evt.email, null, "with no secret the email should be nil");
        assert.ok(res.body.pagination, "range should have pagination");
        const page = res.body.pagination;
        assert.equal(page.events, 2);
        assert.equal(page.start, '2002-08-01');
        assert.equal(page.end, '2002-08-02');
        const p = "/api/v2/events.json?s=2002-08-03&e=2002-08-04";
        assert.ok(page.next.endsWith(p), `expected ${p} got ${page.next}`);
      });
  });
});

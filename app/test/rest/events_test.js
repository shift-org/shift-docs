// additional possible tests:
// a test for the entire schedule of a particular series.
//
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const sandbox = require('sinon').createSandbox();
const test = require("../testData");

// via the command line -v option
const version = process.env.SHIFT_VERSION;

if (!version || version === "v1") {
  describe("viewing v1 events via rest", () => testEvents('v1'));
}
if (!version || version === "v2") {
  describe("viewing v2 events via rest", () => testEvents('v2'));
}

function testEvents(dbVersion, fmt = "json") {
  const testdb = require(`../${dbVersion}data`);

  // runs once before any of the tests in this block.
  before(() => {
    test.configure(dbVersion, fmt, "rest");
    test.fakeSiteUrl(sandbox);
    return testdb.setupTestData("events");
  });
  // runs once after the last test in this block
  after(() => {
    test.configure();
    sandbox.restore();
    return testdb.destroy();
  });
  // this returns pagination with no events. not sure exactly what we want here yet
  // at any rate, its fine that it doesn't error. setting to skip till the behavior is defined.
  // {"events":[],"pagination":{"start":"2026-04-30","end":"2026-10-30","range":184,"events":0,"prev":"https://shift2bikes.org/api/v1/events.json?s=2025-10-28&e=2026-04-29","next":"https://shift2bikes.org/api/v1/events.json?s=2026-10-31&e=2027-05-02"}}
  it.skip("returns paginated data with no parameters", () => {
    // ex. /api/v2/events.json
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
        const p = `/api/${dbVersion}/events.${fmt}?s=2002-08-03&e=2002-08-04`;
        assert.ok(page.next.endsWith(p), `expected to end with ${p} got ${page.next}`);
      });
  });
}

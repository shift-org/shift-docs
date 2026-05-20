const testdb = require("./testdb");
const test = require("../testData");
//
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const config = require("server/core/config");

function eventList(version = 2) {
  return `/api/v${version}/events.json`;
}
// todo: add a test for this
function eventSeries(seriesId, version = 2)  {
  return `/api/v${version}/events/${seriesId}.json`;
}
function eventInstance(series, ymd, version = 2) {
  return `/api/v${version}/events/${series}/${ymd}.json`;
}
function eventRange(start, end, version = 2) {
  return {
    path: `/api/v${version}/events.json`,
    query: {s: start, e: end}
  };
}
function legacyEvent(pkid, version = 2) {
  return `/api/v${version}/legacy/${pkid}.json`;
}

describe("v2 getting events", () => {
  // runs before the evt test in this block.
  before(() => {
    return testdb.setupTestData("events");
  });
  // runs once after the last test in this block
  after(() => {
    return testdb.destroy();
  });
  // NOTE: new api allows this
  it("errors with no parameters", () => {
    return test.GET(eventList())
      .expect(200)
      .then(res => {
        // TODO: add some validation here.
        console.log(JSON.stringify(res.body));
      });
  });
  it("errors on an invalid id", () => {
    return test.GET(legacyEvent(999))
      .then(test.expectError);
  });
  it("errors on an invalid date", () => {
    return test.GET(eventRange("apple", "sauce"))
      .then(test.expectError);
  });
  it("errors on too large a range", () => {
    return test.GET(eventRange("2002-01-01", "2003-01-01"))
      .then(test.expectError);
  });
  it("errors on a negative range", () => {
    return test.GET(eventRange("2003-01-01", "2002-01-01"))
      .then(test.expectError);
  });
  it("handles a legacy pkid", () => {
    const expectedRedirect = eventInstance(2, "2002-08-01");
    return test.GET(legacyEvent(201))
      .expect(302) // redirect reports found
      .expect('Location', expectedRedirect)
      .then(_ => true);
    });

  it.only("succeeds with a valid id", () => {
    // FISXXXX -- exactDay only returns first
    // i think thats fucking up summary.
    // probably it should return all but some other things might need fixup

    return test.GET(eventInstance(2, "2002-08-01"))
      .expect(200)
      .expect('Content-Type', /json/)
      .expect('Api-Version', /^3\./)
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
    return test.GET(eventRange("2002-08-01", "2002-08-02"))
      .expect(200)
      .expect('Content-Type', /json/)
      .expect('Api-Version', /^3\./)
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

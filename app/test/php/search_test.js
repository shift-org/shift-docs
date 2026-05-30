const assert = require("node:assert/strict");
const { describe, it, before, after } = require("node:test");
const testdb = require("../v1data");
const test = require("../testData");
//
const { EventSearch } = require("shift-docs/models/calConst");

describe("searching for v1 events", () => {
  // runs before the first test in this block.
  before(() => {
    test.configure("v1", "json");
    return testdb.setupFakeData("search");
  });
  // runs once after the last test in this block
  after(() => {
    return testdb.destroy();
  });
  // test:
  it("errors on an empty search term", () => {
    return test.GET(test.api.search())
      .then(test.expectError);
  });
  it("handles a search", () => {
    return test.GET(test.api.search({
        q: "go", all: true
      }))
      .then(test.expectOkay)
      .then(res => {
        assert.equal(res.body?.pagination?.fullcount, 14);
        assert.equal(res.body?.events?.length, 14);
      });
  });
  it("caps large limits", () => {
    return test.GET(test.api.search({
          q: "go",
          l: 1000000,
          all: true
      }))
      .then(test.expectOkay)
      .then(res => {
        // we've been capped to the internal limits
        assert.equal(res.body?.pagination?.limit, EventSearch.Limit);
        assert.equal(res.body?.pagination?.fullcount, 14);
        assert.equal(res.body?.pagination?.offset, 0);
        assert.equal(res.body?.events?.length, 14);
      });
  });
  it("handles narrow limits", () => {
    return test.GET(test.api.search({
          q: "go",
          l: 2,
          all: true
        }))
      .then(test.expectOkay)
      .then(res => {
        // pagination: still 14 events available; but we've asked for two at a time.
        assert.equal(res.body?.pagination.fullcount, 14);
        assert.equal(res.body?.pagination.offset, 0);
        assert.equal(res.body?.pagination.limit, 2);
        assert.equal(res.body?.events?.length, 2)
        const events = res.body.events;
        assert.equal(events[0].title, "Losing My Religion");
        assert.equal(events[1].title, "Nothing's Gonna Stop Us Now");
      });
  });
  it("handles offsets", () => {
    return test.GET(test.api.search({
          q: "go",
          o: 2,
          l: 2,
          all: true
        }))
      .then(test.expectOkay)
      .then(res => {
        // pagination: still 14 events available; but we've asked for two at a time.
        assert.equal(res.body?.pagination?.fullcount, 14);
        assert.equal(res.body?.pagination?.offset, 2);
        assert.equal(res.body?.pagination?.limit, 2);
        assert.equal(res.body?.events?.length, 2);
        const events = res.body.events;
        assert.equal(events[0].title, "Dreamlover");
        assert.equal(events[1].title, "Losing My Religion");
      });
  });
});

const assert = require('node:assert/strict');
const { describe, it, beforeEach, afterEach } = require('node:test');
const request = require('supertest');
//
const app = require('shift-docs/appEndpoints');
const testing = require('shift-docs/testing');
const { EventSearch } = require('shift-docs/models/newConst');

describe("searching for events", () => {
  beforeEach(() => {
    testing.configure("json");
    return testing.setupFakeData("search");
  });
  afterEach(() => {
    return testing.reset();
  });
  // test:
  it("reports error 400 on an empty search term", () => {
    return request(app)
      .get('/api/search.php')
      // .query({q: "events"})
      .then(testing.expectError)
      .then(res => {
        assert.ok(res.body?.error, "expects an error string");
      });
  });
  it("handles a search", () => {
    return request(app)
      .get('/api/search.php')
      .query({q: "go", all: true})
      .then(testing.expectOkay)
      .then(res => {
        assert.equal(res.body?.pagination?.fullcount, 14);
        assert.equal(res.body?.events?.length, 14);
      });
  });
  it("caps large limits", () => {
    return request(app)
      .get('/api/search.php')
      .query({
          q: "go",
          l: 1000000,
          all: true
        })
      .then(testing.expectOkay)
      .then(res => {
        // we've been capped to the internal limits
        assert.equal(res.body?.pagination?.limit, EventSearch.Limit);
        assert.equal(res.body?.pagination?.fullcount, 14);
        assert.equal(res.body?.pagination?.offset, 0);
        assert.equal(res.body?.events?.length, 14);
      });
  });
  it("handles narrow limits", () => {
    return request(app)
      .get('/api/search.php')
      .query({
          q: "go",
          l: 2,
          all: true
        })
      .then(testing.expectOkay)
      .then(res => {
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
    return request(app)
      .get('/api/search.php')
      .query({
          q: "go",
          o: 2,
          l: 2,
          all: true
        })
      .then(testing.expectOkay)
      .then(res => {
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

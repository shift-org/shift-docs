const app = require("../appEndpoints");
const testdb = require("./testdb");
const { EventSearch } = require("../models/calConst");
//
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const request = require('supertest');

describe("searching for events", () => {
  // runs before the first test in this block.
  before(() => {
    return testdb.setupFakeData("search");
  });
  // runs once after the last test in this block
  after(() => {
    return testdb.destroy();
  });
  // test:
  it("errors on an empty search term", () => {
    return request(app)
      .get('/api/search.php')
      // .query({q: "events"})
      .expect(400)
      .expect('Content-Type', /json/)
      .then(res => {
        assert.ok(res.body?.error, "expects an error string");
      });
  });
  it("handles a search", () => {
    return request(app)
      .get('/api/search.php')
      .query({q: "go", all: true})
      .expect(200)
      .expect('Content-Type', /json/)
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
      .expect(200)
      .expect('Content-Type', /json/)
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
      .expect(200)
      .expect('Content-Type', /json/)
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
      .expect(200)
      .expect('Content-Type', /json/)
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

const app = require("../appEndpoints");
const testdb = require("./testdb");
//
const { describe, it, before, after } = require("node:test");
const request = require('supertest');

describe("crawl testing", () => {
  // runs before the first test in this block.
  before(() => {
    return testdb.setupTestData("crawl")
  });
  // runs once after the last test in this block
  after(() => {
    return testdb.destroy();
  });
  // test:
  it("handles a simple get", () => {
    return request(app)
      .get('/api/crawl.php')
      .expect(200)
      .expect('Content-Type', /html/)
      // .then(logResponse);
  });
  it("handles a valid daily id", () => {
    return request(app)
      .get('/api/crawl.php')
      .query({id: 201})
      .expect(200)
      .expect('Content-Type', /html/)
      // .then(logResponse);
  });
  it("errors on an invalid daily id", () => {
    return request(app)
      .get('/api/crawl.php')
      .query({id: 999})
      .expect(404) // crawl returns an empty 404
      .expect('Content-Type', /text/)
      // .then(logResponse);
  });
});


function logResponse(res) {
  console.log(res.text);
}
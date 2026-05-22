const assert = require("node:assert/strict");
const { describe, it, before, after } = require("node:test");
const testdb = require("./testdb");
const test = require("../testData");

describe("crawl testing", () => {
  // runs before the first test in this block.
  before(() => {
    test.configure("v1", "html");
    return testdb.setupTestData("crawl")
  });
  // runs once after the last test in this block
  after(() => {
    test.configure();
    return testdb.destroy();
  });
  // test:
  it("handles a simple get", () => {
    return test.GET(test.api.crawl())
      .then(test.expectOkay)
      .then(handleResponse);
  });
  it("handles a valid daily id", () => {
    return test.GET(test.api.crawl(201))
      .then(test.expectOkay)
      .then(handleResponse);
  });
  it("errors on an invalid daily id", () => {
    return test.GET(test.api.crawl(999))
      .expect(404) // crawl returns an empty 404
      .expect('Content-Type', /text/)
      .then(handleResponse);
  });
});

function handleResponse(res) {
  assert.ok(true);
  //console.log(res.text);
}
const testdb = require("./testdb");
const testData = require("../testData");
//
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");

describe("deleting using a form", () => {
  // runs before the first test in this block.
  before(() => {
    testData.configure("v2", "json");
    return testdb.setupTestData("del");
  });
  // runs once after the last test in this block
  after(() => {
    testData.configure();
    return testdb.destroy();
  });
  // test:
  it("fails on an invalid id", () => {
    const id = 999;
    return testData.DELETE(testData.api.eventSeries(id), {
        id
      })
      .then(testData.expectError);
  });
  it("fails on an incorrect password", () => {
    const id = 2;
    return testData.DELETE(testData.api.eventSeries(id), {
        id,
        secret: "to life, etc.",
      })
      .then(testData.expectError)
      .then(async (res) => {
        // it should still have the original data.
        // ( ie. nothing should have been deleted on error )
        const events = await testdb.findSeries(id);
        assert.equal(events.length, 2);
        const [d1, d2] = events;
        assert.equal(d1.hidden, 0);
        assert.equal(d1.eventstatus, 'A');
        assert.equal(d2.eventstatus, 'A');
      });
  });
  it("deletes with a valid id and secret", async () => {
    // verify the original data in the db
    const id = 2;
    const events = await testdb.findSeries(id);
    assert.equal(events.length, 2);
    const [d1, d2] = events;
    assert.ok(d1.password);
    assert.equal(d1.hidden, 0);
    assert.equal(d1.eventstatus, 'A');
    assert.equal(d2.eventstatus, 'A');
    return testData.DELETE(testData.api.eventSeries(id), {
        id,
        secret: testData.secret,
      })
      .then(testData.expectOkay)
      .then(async (res) => {
        // deletion is deletion;
        // the series shouldn't exist anymore.
        const events = await testdb.findSeries(id);
        assert.equal(events.length, 0);
      });
  });
});

// do the same things again,but post json ( ala curl )
describe("deleting using json", () => {
  before(() => {
    testData.configure("v2", "json");
    return testdb.setupTestData("del json");
  });
  after(() => {
    testData.configure();
    return testdb.destroy();
  });
  it("deletes with a valid id and secret", async () => {
    const id = 2;
    const events = await testdb.findSeries(id);
    assert.equal(events.length, 2);
    const [ d1, d2 ] = events;
    assert.ok(d1.password);
    assert.equal(d1.hidden, 0);
    assert.equal(d1.eventstatus, 'A');
    assert.equal(d2.eventstatus, 'A');
    return testData.DELETE(testData.api.eventSeries(id), {
        id,
        secret: testData.secret,
      }, false) // false, not a form
      .then(testData.expectOkay)
      .then(async (res) => {
        // deletion is deletion;
        // the series shouldn't exist anymore.
        const events = await testdb.findSeries(id);
        assert.equal(events.length, 0);
      });
  });
  it("deletes unpublished events", async () => {
    // there should be one entry for event 3
    const id = 3;
    const events = await testdb.findSeries(id);
    assert.equal(events.length, 1);
    return testData.DELETE(testData.api.eventSeries(id), {
        id,  // 3 is unpublished
        secret: testData.secret,
      }, false) // false, not a form
      .then(testData.expectOkay)
      .then(async (res) => {
        // and now zero:
        const events = await testdb.findSeries(id);
        assert.equal(events.length, 0, "all gone");
      });
  });
  it("deletes a legacy event", async () => {
    const id = 1;
    const events = await testdb.findSeries(id);
    assert.equal(events.length, 1);
    // the test data for series 1 doesn't have any days
    // but we should still be able to mark it as unused.
    const [e0] = events;
    assert.notEqual(e0.review, 'E');
    assert.ok(e0.password);
    //
    return testData.DELETE(testData.api.eventSeries(id), {
        id, // id 1 is hidden null
        secret: testData.secret,
      }, false) // false, not a form
      .then(testData.expectOkay)
      .then(async (res) => {
        // deletion is deletion;
        // the series shouldn't exist anymore.
        const events = await testdb.findSeries(id);
        assert.equal(events.length, 0);
      });
  });
});

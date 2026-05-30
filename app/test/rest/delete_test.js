const testdb = require("./testdb");
const testData = require("../testData");
//
const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");

// check that the original data for id 2 exists
// ( ex. nothing should have been deleted on error )
async function verifyDataExists(id = 2) {
  const events = await testdb.findSeries(id);
  assert.equal(events.length, 2);
  const [d1, d2] = events;
  assert.equal(d1.hidden, 0);
  assert.equal(d1.eventstatus, 'A');
  assert.equal(d2.eventstatus, 'A');
}

async function verifyDataDeleted(id) {
  const events = await testdb.findSeries(id);
  assert.equal(events.length, 0);
}

describe("deleting using a form", () => {
  beforeEach(() => {
    testData.configure("v2", "json");
    return testdb.setupTestData("del");
  });
  afterEach(() => {
    testData.configure();
    return testdb.destroy();
  });
  // test:
  it("fails on an invalid id", () => {
    const id = 999;
    const delete_api = `/api/v2/events/${id}`;
    return testData.DELETE(delete_api, {
        id,
        secret: testData.secret,
      })
      .then(testData.expectError);
  });
  it("fails on an incorrect password", () => {
    const id = 2;
    const delete_api = `/api/v2/events/${id}`;
    return testData.DELETE(delete_api, {
        id,
        secret: "to life, etc.",
      })
      .then(testData.expectError)
      .then(_ => verifyDataExists(2));
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
    const delete_api = `/api/v2/events/${id}`;
    return testData.DELETE(delete_api, {
        id,
        secret: testData.secret,
      })
      .then(testData.expectOkay)
      .then(_ => verifyDataDeleted(2));
  });
  it("fails if endpoint and id are mismatched", async () => {
    const delete_api = `/api/v2/events/2`;
    return testData.DELETE(delete_api, {
        id: 3, // first: make the internal mismatched
        secret: testData.secret,
      })
      .then(testData.expectError)
      .then(_ => {
        // next: make the end point mismatched
        const delete_api = `/api/v2/events/3`;
        return testData.DELETE(delete_api, {
          id: 2,
          secret: testData.secret,
        })
        .then(testData.expectError)
      })
      .then(_ => verifyDataExists(2));
  });
});

// do the same things again,but post json ( ala curl )
describe("deleting using json", () => {
  beforeEach(() => {
    testData.configure("v2", "json");
    return testdb.setupTestData("del json");
  });
  afterEach(() => {
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
    const delete_api = `/api/v2/events/${id}`;
    return testData.DELETE(delete_api, {
        id,
        secret: testData.secret,
      }, false) // false, not a form
      .then(testData.expectOkay)
      .then(_ => verifyDataDeleted(2));
  });
  it("deletes unpublished events", async () => {
    // there should be one entry for event 3
    const id = 3;
    const events = await testdb.findSeries(id);
    assert.equal(events.length, 1);
    const delete_api = `/api/v2/events/${id}`;
    return testData.DELETE(delete_api, {
        id,
        secret: testData.secret,
      }, false) // false, not a form
      .then(testData.expectOkay)
      .then(_ => verifyDataDeleted(3));
  });
  it("deletes a legacy event", async () => {
    const id = 1; // id 1 is hidden null
    const events = await testdb.findSeries(id);
    assert.equal(events.length, 1);
    // the test data for series 1 doesn't have any days
    // but we should still be able to mark it as unused.
    const [e0] = events;
    assert.notEqual(e0.review, 'E');
    assert.ok(e0.password);
    //
    const delete_api = `/api/v2/events/${id}`;
    return testData.DELETE(delete_api, {
        id,
        secret: testData.secret,
      }, false) // false, not a form
      .then(testData.expectOkay)
      .then(_ => verifyDataDeleted(1));
  });
});

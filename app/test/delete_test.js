const app = require("../appEndpoints");
const testdb = require("./testdb");
const testData = require("./testData");

//
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const request = require('supertest');
//
const delete_api = '/api/delete_event.php';

describe("deleting using a form", () => {
  // runs before the first test in this block.
  before(() => {
    return testdb.setupTestData("del");
  });
  // runs once after the last test in this block
  after(() => {
    return testdb.destroy();
  });
  // test:
  it("fails on an invalid id", () => {
    return request(app)
      .post(delete_api)
      .type('form')
      .send({
        json: JSON.stringify({
          id: 999,
        })
      })
      .then(testData.expectError);
  });
  it("fails on an incorrect password", () => {
    return request(app)
      .post(delete_api)
      .type('form')
      .send({
        json: JSON.stringify({
          id: 2,
          secret: "to life, etc.",
        })
      })
      .then(testData.expectError)
      .then(async (res) => {
        // it should still have the original data.
        // ( ie. nothing should have been deleted on error )
        const events = await testdb.findSeries(2);
        assert.equal(events.length, 2);
        const [d1, d2] = events;
        assert.equal(d1.hidden, 0);
        assert.equal(d1.eventstatus, 'A');
        assert.equal(d2.eventstatus, 'A');
      });
  });
  it("deletes with a valid id and secret", async () => {
    // verify the original data in the db
    const events = await testdb.findSeries(2);
    assert.equal(events.length, 2);
    const [d1, d2] = events;
    assert.ok(d1.password);
    assert.equal(d1.hidden, 0);
    assert.equal(d1.eventstatus, 'A');
    assert.equal(d2.eventstatus, 'A');
    // request the deletion
    return request(app)
      .post(delete_api)
      .type('form')
      .send({
        json: JSON.stringify({
          id: 2,
          secret: testData.secret,
        })
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .expect('Api-Version', /^3\./)
      .then(async (res) => {
        // deletion is deletion;
        // the series shouldn't exist anymore.
        const events = await testdb.findSeries(2);
        assert.equal(events.length, 0);
      });
  });
});

// do the same things again,but post json ( ala curl )
describe("deleting using json", () => {
  before(() => {
    return testdb.setupTestData("del json");
  });
  after(() => {
    return testdb.destroy();
  });
  it("deletes with a valid id and secret", async () => {
    const events = await testdb.findSeries(2);
    assert.equal(events.length, 2);
    const [ d1, d2 ] = events;
    assert.equal(d1.hidden, 0);

    assert.ok(d1.password);
    assert.equal(d1.eventstatus, 'A');
    assert.equal(d2.eventstatus, 'A');

    return request(app)
      .post(delete_api)
      // .type('form') ... intentionally send not as a form
      .send({
        id: 2,
        secret: testData.secret,
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .expect('Api-Version', /^3\./)
      .then(async (res) => {
        // deletion is deletion;
        // the series shouldn't exist anymore.
        const events = await testdb.findSeries(2);
        assert.equal(events.length, 0);
      });
  });

  it("deletes unpublished events", async () => {
    // there should be one entry for event 3
    const events = await testdb.findSeries(3);
    assert.equal(events.length, 1);
    return request(app)
      .post(delete_api)
      .send({
        id: 3, // 3 is unpublished
        secret: testData.secret,
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .expect('Api-Version', /^3\./)
      .then(async (res) => {
        // and now zero:
        const events = await testdb.findSeries(3);
        assert.equal(events.length, 0, "all gone");
      });
  });

  it("deletes a legacy event", async () => {
    const events = await testdb.findSeries(1);
    assert.equal(events.length, 1);
    // the test data for series 1 doesn't have any days
    // but we should still be able to mark it as unused.
    const [e0] = events;
    assert.notEqual(e0.review, 'E');
    assert.ok(e0.password);
    //
    return request(app)
      .post(delete_api)
      .send({
        id: 1, // id 1 has hidden null; which is published.
        secret: testData.secret,
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .expect('Api-Version', /^3\./)
      .then(async (res) => {
        // deletion is deletion;
        // the series shouldn't exist anymore.
        const events = await testdb.findSeries(1);
        assert.equal(events.length, 0);
      });
  });
});

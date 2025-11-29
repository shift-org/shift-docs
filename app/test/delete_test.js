const app = require("../appSetup");
const testdb = require("./testdb");
const testData = require("./testData");

const { CalEvent } = require("../models/calEvent");
const { CalDaily } = require("../models/calDaily");
//
const sinon = require('sinon');
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const request = require('supertest');
//
const delete_api = '/api/delete_event.php';

describe("deleting using a form", () => {
  // spies on data storage:
  let spy;
  // runs before the first test in this block.
  before(() => {
    spy = testData.stubData(sinon);
    return testdb.setup();
  });
  // runs once after the last test in this block
  after(() => {
    sinon.restore();
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
      .then(testData.expectError);
  });
  it("delists a published event", async () => {
    const e0 = await CalEvent.getByID(2);
    const d1 = await CalDaily.getForTesting(201);
    const d2 = await CalDaily.getForTesting(202);

    assert.notEqual(e0.review, 'E'); // anything is fine other than excluded
    assert.ok(e0.password);
    assert.equal(d1.eventstatus, 'A');
    assert.equal(d2.eventstatus, 'A');

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
        assert.equal(spy.eventStore.callCount, 1);
        assert.equal(spy.dailyStore.callCount, 2);
        spy.resetHistory();

        const e0 = await CalEvent.getByID(2);
        const d1 = await CalDaily.getForTesting(201);
        const d2 = await CalDaily.getForTesting(202);

        // the days of deleted events are marked with D
        // to distinguish them from individually canceled events.
        assert.equal(e0.review, 'E');
        assert.ok(!e0.password);
        assert.equal(d1.eventstatus, 'D');
        assert.equal(d2.eventstatus, 'D');
      });
  });
});

// do the same things again,but post json ( ala curl )
describe("deleting using json", () => {
  let spy;
  before(() => {
    spy = testData.stubData(sinon);
    return testdb.setup();
  });
  after(() => {
    sinon.restore();
    return testdb.destroy();
  });
  it("delists a published event", async () => {
    const e0 = await CalEvent.getByID(2);
    const d1 = await CalDaily.getForTesting(201);
    const d2 = await CalDaily.getForTesting(202);

    assert.notEqual(e0.review, 'E');
    assert.ok(e0.password);
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
        assert.equal(spy.eventStore.callCount, 1);
        assert.equal(spy.dailyStore.callCount, 2);
        assert.equal(spy.eventErasures.callCount, 0);
        spy.resetHistory();

        const e0 = await CalEvent.getByID(2);
        const d1 = await CalDaily.getForTesting(201);
        const d2 = await CalDaily.getForTesting(202);

        // the days of deleted events are marked with D
        // to distinguish them from individually canceled events.
        assert.equal(e0.review, 'E');
        assert.ok(!e0.password);
        assert.equal(d1.eventstatus, 'D');
        assert.equal(d2.eventstatus, 'D');
      });
  });

  it("deletes unpublished events", () => {
    return request(app)
      .post(delete_api)
      .send({
        id: 3,
        secret: testData.secret,
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .expect('Api-Version', /^3\./)
      .then(res => {
        assert.equal(spy.eventErasures.callCount, 1);
        spy.resetHistory();
      });
  });
  it("deletes a legacy event", async () => {
    const e0 = await CalEvent.getByID(1);
    assert.notEqual(e0.review, 'E');
    assert.ok(e0.password);
    //
    return request(app)
      .post(delete_api)
      .send({
        id: 1, // id 1 is hidden null
        secret: testData.secret,
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .expect('Api-Version', /^3\./)
      .then(async (res) => {
        assert.equal(spy.eventErasures.callCount, 0);
        spy.resetHistory();
        const e0 = await CalEvent.getByID(1);
        assert.equal(e0.review, 'E');
        assert.ok(!e0.password);
      });
  });
});

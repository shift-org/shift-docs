const chai = require('chai');
const sinon = require('sinon');
const app = require("../app");
const testdb = require("./testdb");
const testData = require("./testData");

const { CalEvent } = require("../models/calEvent");
const { CalDaily } = require("../models/calDaily");

chai.use(require('chai-http'));
const expect = chai.expect;
const delete_api = '/api/delete_event.php';

describe("event cancellation using a form", () => {
  // spies on data storage:
  let data;
  // runs before the first test in this block.
  before(function() {
    data = testData.stubData(sinon);
    return testdb.setup();
  });
  // runs once after the last test in this block
  after(function () {
    sinon.restore();
    return testdb.destroy();
  });
  // test:
  it("fails on an invalid id", function(done) {
    chai.request( app )
      .post(delete_api)
      .type('form')
      .send({
        json: JSON.stringify({
          id: 999,
        })
      })
      .end(function (err, res) {
        expect(err).to.be.null;
        testData.expectError(expect, res);
        done();
      });
  });
  it("fails on an incorrect password", function(done) {
    chai.request( app )
      .post(delete_api)
      .type('form')
      .send({
        json: JSON.stringify({
          id: 2,
          secret: "to life, etc.",
        })
      })
      .end(function (err, res) {
        expect(err).to.be.null;
        testData.expectError(expect, res);
        done();
      });
  });
  it("succeeds with a valid id and secret", async function() {
    const e0 = await CalEvent.getByID(2);
    const d1 = await CalDaily.getForTesting(201);
    const d2 = await CalDaily.getForTesting(202);

    expect(e0.password).to.not.be.empty;
    expect(d1.eventstatus).to.equal('A');
    expect(d2.eventstatus).to.equal('A');

    return chai.request( app )
      .post(delete_api)
      .type('form')
      .send({
        json: JSON.stringify({
          id: 2,
          secret: testData.secret,
        })
      })
      .then(async function (res) {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body.version).to.be.a("string");
        expect(data.eventStore.callCount).to.equal(1);
        expect(data.dailyStore.callCount).to.equal(2);

        const e0 = await CalEvent.getByID(2);
        const d1 = await CalDaily.getForTesting(201);
        const d2 = await CalDaily.getForTesting(202);

        // the days of deleted events are marked with D
        // to distinguish them from individually canceled events.
        expect(e0.password).to.be.empty;
        expect(d1.eventstatus).to.equal('D');
        expect(d2.eventstatus).to.equal('D');
      });
  });
});

// do the same things again,but post json ( ala curl )
describe("event cancellation using json", () => {
  let data;
  before(function() {
    data = testData.stubData(sinon);
    return testdb.setup();
  });
  after(function () {
    sinon.restore();
    return testdb.destroy();
  });
  it("succeeds", async function() {
    const e0 = await CalEvent.getByID(2);
    const d1 = await CalDaily.getForTesting(201);
    const d2 = await CalDaily.getForTesting(202);

    expect(e0.password).to.not.be.empty;
    expect(d1.eventstatus).to.equal('A');
    expect(d2.eventstatus).to.equal('A');

    return chai.request( app )
      .post(delete_api)
      // .type('form') ... intentionally send not as a form
      .send({
        id: 2,
        secret: testData.secret,
      })
      .then(async function (res) {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body.version).to.be.a("string");
        expect(data.eventStore.callCount).to.equal(1);
        expect(data.dailyStore.callCount).to.equal(2);
        expect(data.eventErasures.callCount).to.equal(0);

        const e0 = await CalEvent.getByID(2);
        const d1 = await CalDaily.getForTesting(201);
        const d2 = await CalDaily.getForTesting(202);

        // the days of deleted events are marked with D
        // to distinguish them from individually canceled events.
        expect(e0.password).to.be.empty;
        expect(d1.eventstatus).to.equal('D');
        expect(d2.eventstatus).to.equal('D');
      });
  });

  it("deletes unpublished events", function(done) {
    chai.request( app )
      .post(delete_api)
      .send({
        id: 3,
        secret: testData.secret,
      })
      .end(function (err, res) {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body.version).to.be.a("string");
        expect(data.eventErasures.callCount).to.equal(1);
        done();
      });
  });
});

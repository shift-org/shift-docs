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

describe("deleting using a form", () => {
  // spies on data storage:
  let spy;
  // runs before the first test in this block.
  before(function() {
    spy = testData.stubData(sinon);
    return testdb.setup();
  });
  // runs once after the last test in this block
  after(function() {
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
      .end(function(err, res) {
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
      .end(function(err, res) {
        expect(err).to.be.null;
        testData.expectError(expect, res);
        done();
      });
  });
  it("delists a published event", async function() {
    const e0 = await CalEvent.getByID(2);
    const d1 = await CalDaily.getForTesting(201);
    const d2 = await CalDaily.getForTesting(202);

    expect(e0.review).to.not.equal('E'); // anything is fine other than excluded
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
      .then(async function(res) {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res).to.have.header('Api-Version');
        expect(spy.eventStore.callCount).to.equal(1);
        expect(spy.dailyStore.callCount).to.equal(2);
        spy.resetHistory();

        const e0 = await CalEvent.getByID(2);
        const d1 = await CalDaily.getForTesting(201);
        const d2 = await CalDaily.getForTesting(202);

        // the days of deleted events are marked with D
        // to distinguish them from individually canceled events.
        expect(e0.review).to.equal('E');
        expect(e0.password).to.be.empty;
        expect(d1.eventstatus).to.equal('D');
        expect(d2.eventstatus).to.equal('D');
      });
  });
});

// do the same things again,but post json ( ala curl )
describe("deleting using json", () => {
  let spy;
  before(function() {
    spy = testData.stubData(sinon);
    return testdb.setup();
  });
  after(function() {
    sinon.restore();
    return testdb.destroy();
  });
  it("delists a published event", async function() {
    const e0 = await CalEvent.getByID(2);
    const d1 = await CalDaily.getForTesting(201);
    const d2 = await CalDaily.getForTesting(202);

    expect(e0.review).to.not.equal('E');
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
      .then(async function(res) {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res).to.have.header('Api-Version');
        expect(spy.eventStore.callCount).to.equal(1);
        expect(spy.dailyStore.callCount).to.equal(2);
        expect(spy.eventErasures.callCount).to.equal(0);
        spy.resetHistory();

        const e0 = await CalEvent.getByID(2);
        const d1 = await CalDaily.getForTesting(201);
        const d2 = await CalDaily.getForTesting(202);

        // the days of deleted events are marked with D
        // to distinguish them from individually canceled events.
        expect(e0.review).to.equal('E');
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
      .end(function(err, res) {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res).to.have.header('Api-Version');
        expect(spy.eventErasures.callCount).to.equal(1);
        spy.resetHistory();
        done();
      });
  }); 

  it("deletes a legacy event", async function() {
    const e0 = await CalEvent.getByID(1);
    expect(e0.review).to.not.equal('E');
    expect(e0.password).to.not.be.empty;
    //
    return chai.request( app )
      .post(delete_api)
      .send({
        id: 1, // id 1 is hidden null
        secret: testData.secret,
      })
      .then(async function(res) {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res).to.have.header('Api-Version');
        expect(spy.eventErasures.callCount).to.equal(0);
        spy.resetHistory();
        
        const e0 = await CalEvent.getByID(1);
        expect(e0.review).to.equal('E');
        expect(e0.password).to.be.empty;
      });
  });
});

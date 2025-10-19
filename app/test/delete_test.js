const chai = require('chai');
const sinon = require('sinon');
const app = require("../app");
const db = require("../knex");
const testdb = require("./testdb");
const testData = require("./testData");

chai.use(require('chai-http'));
const expect = chai.expect;
const delete_api = '/api/delete_event.php';

describe("deleting using a form", () => {
  // runs before the first test in this block.
  before(function() {
    return testdb.setup();
  });
  // runs once after the last test in this block
  after(function () {
    return testdb.destroy();
  });
  // test:
  it("fails on an invalid id", function() {
    return chai.request( app )
      .post(delete_api)
      .type('form')
      .send({
        json: JSON.stringify({
          id: 999,
        })
      })
      .then((res) => {
        testData.expectError(expect, res);
      });
  });
  it("fails on an incorrect password", function() {
    return chai.request( app )
      .post(delete_api)
      .type('form')
      .send({
        json: JSON.stringify({
          id: 2,
          secret: "to life, etc.",
        })
      })
      .then(async (res) => {
        testData.expectError(expect, res);
        // it should still have the original data.
        const events = await testdb.findSeries(2);
        expect(events).to.have.lengthOf(2);
        const [d1, d2] = events;
        expect(d1.hidden).to.equal(0);
        expect(d1.eventstatus).to.equal('A');
        expect(d2.eventstatus).to.equal('A');
      });
  });
  it("delists a published event", async () => {
    // verify the original data in the db
    const events = await testdb.findSeries(2);
    expect(events).to.have.lengthOf(2);
    const [d1, d2] = events;
    expect(d1.hidden).to.equal(0);
    expect(d1.eventstatus).to.equal('A');
    expect(d2.eventstatus).to.equal('A');
    // request the deletion
    return chai.request( app )
      .post(delete_api)
      .type('form')
      .send({
        json: JSON.stringify({
          id: 2,
          secret: testData.secret,
        })
      })
      .then(async (res) => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res).to.have.header('Api-Version');

        // the days of deleted events are marked with D
        // to distinguish them from individually canceled events.
        const events = await testdb.findSeries(2);
        expect(events).to.have.lengthOf(2);
        const [ d1, d2 ] = events;
        expect(d1.eventdate).to.equal("2002-08-01");
        expect(d1.eventstatus).to.equal('D');
        expect(d2.eventdate).to.equal("2002-08-02");
        expect(d2.eventstatus).to.equal('D');
      });
  });
});

// do the same things again,but post json ( ala curl )
describe("deleting using json", () => {
  before(function() {
    return testdb.setup();
  });
  after(function () {
    sinon.restore();
    return testdb.destroy();
  });
  it("delists a published event", async () => {
    const events = await testdb.findSeries(2);
    expect(events).to.have.lengthOf(2);
    const [ d1, d2 ] = events;
    expect(d1.hidden).to.equal(0);
    expect(d1.eventstatus).to.equal('A');
    expect(d2.eventstatus).to.equal('A');

    return chai.request( app )
      .post(delete_api)
      // .type('form') ... intentionally send not as a form
      .send({
        id: 2,
        secret: testData.secret,
      })
      .then(async (res) => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res).to.have.header('Api-Version');
        
        // the days of deleted events are marked with D
        // to distinguish them from individually canceled events.
        const events = await testdb.findSeries(2);
        expect(events).to.have.lengthOf(2);
        const [d1, d2] = events;
        expect(d1.eventstatus).to.equal('D');
        expect(d2.eventstatus).to.equal('D');
      });
  });

  it("deletes unpublished events", async () => {
    // there should be one entry for event 3
    const events = await testdb.findSeries(3);
    expect(events).to.have.lengthOf(1);
        
    return chai.request( app )
      .post(delete_api)
      .send({
        id: 3, // 3 is unpublished
        secret: testData.secret,
      })
      .then(async (res) => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res).to.have.header('Api-Version');
        // and now zero:
        const events = await testdb.findSeries(3);
        expect(events).to.have.lengthOf(0, "all gone");
      });
  });

  it("deletes a legacy event", async () => {
    const events = await testdb.findSeries(1);
    expect(events).to.have.lengthOf(1);
    // the test data for series 1 doesn't have any days
    // but we should still be able to mark it as unused. 
    const [e0] = events;
    expect(e0.review).to.not.equal('E');
    expect(e0.password).to.not.be.empty;
    //
    return chai.request( app )
      .post(delete_api)
      .send({
        id: 1, // id 1 has hidden null; which is published.
        secret: testData.secret,
      })
      .then(async (res) => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res).to.have.header('Api-Version');
        // 
        const events = await testdb.findSeries(1);
        expect(events).to.have.lengthOf(1);
        //
        const [e0] = events;
        expect(e0.review).to.equal('E');
        expect(e0.password).to.be.empty;
      });
  });
});

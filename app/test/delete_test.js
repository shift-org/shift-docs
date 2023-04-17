const chai = require('chai');
const sinon = require('sinon');
const app = require("../app");
const testData = require("./testData");

chai.use(require('chai-http'));
const expect = chai.expect;
const endpoint = '/api/delete_event.php';

describe("event cancellation using a form", () => {
  // create a pool of fake calendar data:
  let data;
  // runs before the first test in this block.
  before(function() {
    data = testData.stubData(sinon);
  });
  // runs once after the last test in this block
  after(function () {
    sinon.restore();
  });
  // test:
  it("fails on an invalid id", function(done) {
    chai.request( app )
      .post(endpoint)
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
      .post(endpoint)
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
  it("succeeds with a valid id and secret", function(done) {
    const e0 = data.events.get('2');
    const d1 = data.dailies.get('201');
    const d2 = data.dailies.get('202');

    expect(e0.password).to.not.be.empty;
    expect(d1.eventstatus).to.equal('A');
    expect(d2.eventstatus).to.equal('A');

    chai.request( app )
      .post(endpoint)
      .type('form')
      .send({
        json: JSON.stringify({
          id: 2,
          secret: testData.secret,
        })
      })
      .end(function (err, res) {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(data.eventStore.callCount).to.equal(1);
        expect(data.dailyStore.callCount).to.equal(2);
        expect(e0.password).to.be.empty;
        expect(d1.eventstatus).to.equal('C');
        expect(d2.eventstatus).to.equal('C');
        done();
      });
  });
});

// do the same things again,but post json ( ala curl )
// fix? really, the client should always be posting json
// rather than json in a form...
describe("event cancellation using json", () => {
  let data;
  before(function() {
    data = testData.stubData(sinon);
  });
  after(function () {
    sinon.restore();
  });
  it("succeeds", function(done) {
    const e0 = data.events.get('2');
    const d1 = data.dailies.get('201');
    const d2 = data.dailies.get('202');

    expect(e0.password).to.not.be.empty;
    expect(d1.eventstatus).to.equal('A');
    expect(d2.eventstatus).to.equal('A');

    chai.request( app )
      .post(endpoint)
      // .type('form') ... intentionally send not as a form
      .send({
        id: 2,
        secret: testData.secret,
      })
      .end(function (err, res) {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(data.eventStore.callCount).to.equal(1);
        expect(data.dailyStore.callCount).to.equal(2);
        expect(data.eventDeletions.callCount).to.equal(0);
        expect(e0.password).to.be.empty;
        expect(d1.eventstatus).to.equal('C');
        expect(d2.eventstatus).to.equal('C');
        done();
      });
  });

  it("deletes unpublished events", function(done) {
    chai.request( app )
      .post(endpoint)
      .send({
        id: 3,
        secret: testData.secret,
      })
      .end(function (err, res) {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(data.eventDeletions.callCount).to.equal(1);
        done();
      });
  });
});

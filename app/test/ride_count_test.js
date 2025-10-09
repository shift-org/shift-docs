const chai = require('chai');
const sinon = require('sinon');
const app = require("../app");
const testdb = require("./testdb");

chai.use(require('chai-http'));
const expect = chai.expect;

describe.only("ride count testing", () => {
  // runs before the first test in this block.
  before(function() {
    return testdb.setupWithFakeData();
  });
  // runs once after the last test in this block
  after(function () {
    return testdb.destroy();
  });
  // test:
  it("handles an all encompassing range", function(done) {
    chai.request( app )
      .get('/api/ride_count.php')
      .query({s: "1900-01-01", e: "2012-12-21"})
      .end(function (err, res) {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        // past and upcoming are based on today's date
        // all the test dates are earlier
        // TODO? set a global fake date, or fake some events in the future?
        expect(res.body).property('total').equal(66);
        expect(res.body).property('past').equal(66);
        expect(res.body).property('upcoming').equal(0);
        done();
      });
  });
  it("handles a slice of time", function(done) {
    chai.request( app )
      .get('/api/ride_count.php')
      .query({s: "2002-08-11", e: "2002-08-11"})
      .end(function (err, res) {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).property('total').equal(4);
        done();
      });
  });
  it("errors on a missing time", function(done) {
    chai.request( app )
      .get('/api/ride_count.php')
      .end(function (err, res) {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        expect(res).to.be.json;
        done();
      });
  });
  it("errors on an invalid time", function(done) {
    chai.request( app )
      .get('/api/ride_count.php')
      .query({s: "yesterday", e: "tomorrow"})
      .end(function (err, res) {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        expect(res).to.be.json;
        done();
      });
  });
});

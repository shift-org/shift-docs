const chai = require('chai');
const app = require("../app");
const testdb = require("./testdb");
const testData = require("./testData");

chai.use(require('chai-http'));
const expect = chai.expect;

describe("getting events", () => {
  // runs before the evt test in this block.
  before(function() {
    return testdb.setup();
  });
  // runs once after the last test in this block
  after(function () {
    return testdb.destroy();
  });
  const expectsError = function(q) {
    return function(done) {
      chai.request( app )
        .get('/api/events.php')
        .query(q)
        .end(function (err, res) {
          expect(err).to.be.null;
          testData.expectError(expect, res);
          done();
        });
    };
  };
  it("errors with no parameters", expectsError());
  it("errors on an invalid id", expectsError({
      id:999
    }));
  it("errors on an invalid date", expectsError({
      // date time formats have been loosened ( #ff5ae63 )
      // clearly invalid dates are still rejected.
      startdate: "apple",
      enddate  : "sauce",
      // startdate: "2002/05/06",
      // enddate  : "2002/05/06",
    }));
  it("errors on too large a range", expectsError({
      startdate: "2002-01-01",
      enddate  : "2003-01-01",
    }));
  it("errors on a negative range", expectsError({
      startdate: "2003-01-01",
      enddate  : "2002-01-01",
    }));
  it("succeeds with a valid id", function(done) {
    chai.request( app )
      .get('/api/events.php')
      .query({
         id: 201, // a daily id
       })
      .end(function (err, res) {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res).to.have.header('Api-Version');
        if (expect(res.body.events).to.have.lengthOf(1)) {
          const evt = res.body.events[0];
          expect(evt.id).to.equal('2');
          expect(evt.caldaily_id).to.equal('201');
          expect(evt.hideemail, "the test data has the email hidden")
            .to.be.true;
          expect(evt.email, "with no secret the email should be nil")
            .to.be.null;
          expect(res.body.pagination, "only ranges should have pagination")
            .to.be.undefined;
        }
        done();
      });
  });
  it("succeeds with a valid range", function(done) {
    chai.request( app )
      .get('/api/events.php')
      .query({
         startdate: "2002-08-01",
         enddate  : "2002-08-02",
       })
      .end(function (err, res) {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res).to.have.header('Api-Version');
        // console.log(res.body);
        if (expect(res.body.events).to.have.lengthOf(2)) {
          const evt = res.body.events[0];
          expect(evt.id).to.equal('2');
          expect(evt.caldaily_id).to.equal('201');
          expect(evt.hideemail, "the test data has the email hidden")
            .to.be.true;
          expect(evt.email, "with no secret the email should be nil")
            .to.be.null;
          expect(res.body.pagination, "range should have pagination")
            .to.exist;
          const page = res.body.pagination;
          expect(page.events).to.equal(2);
          expect(page.start).to.equal('2002-08-01');
          expect(page.end).to.equal('2002-08-02');
          expect(page.next).to.match(/\?startdate=2002-08-03&enddate=2002-08-04$/);
        }
        done();
      });
  });
});

const chai = require('chai');
const sinon = require('sinon');
const app = require("../app");
const testData = require("./testData");
const testdb = require("./testdb");

chai.use(require('chai-http'));
const expect = chai.expect;

describe("retrieving event data for editing", () => {
  // runs before the first test in this block.
  before(function() {
    return testdb.setup();
  });
  // runs once after the last test in this block
  after(function () {
    return testdb.destroy();
  });
  it("errors on an invalid id", function(done) {
    chai.request( app )
      .get('/api/retrieve_event.php')
      .query({
        id: 999
      })
      .end(function (err, res) {
        expect(err).to.be.null;
        testData.expectError(expect, res);
        done();
      });
  });
  it("private data requires the correct secret", function(done) {
    chai.request( app )
      .get('/api/retrieve_event.php')
      .query({
         id: 2,
         secret: "the incorrect answer to life, the universe, and this event.",
       })
      .end(function (err, res) {
        expect(err).to.be.null;
        // MOD-stravis: previously the incorrect secret would return the event
        // sans its private data; now it errors.
        expect(res).to.have.status(400);
        expect(res).to.be.json;
        expect(res).to.have.header('Api-Version');
        expect(res.body).property('error').to.exist;
        done();
      });
  });
  it("retrieves with a valid id and secret", function(done) {
    chai.request( app )
      .get('/api/retrieve_event.php')
      .query({
         id: 2,
         secret: testData.secret,
       })
      .end(function (err, res) {
        // console.dir(res.body);
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res).to.have.header('Api-Version');
        expect(res.body.id).to.equal('2');
        expect(res.body.email, "b/c of the secret, email should be present")
          .to.exist;
        expect(res.body.phone,  "b/c of the secret, phone should be present")
          .to.exist;
        expect(res.body.contact,  "b/c of the secret, contact should be present")
          .to.exist;
        expect(res.body.hideemail, "the test data has the email hidden")
          .to.be.true;
        expect(res.body.email, "b/c of the secret, we should see the email")
          .to.equal(testData.email);
        expect(res.body.datestatuses).to.deep.equal([{
          id: '201',
          date: '2002-08-01',
          status: 'A',
          newsflash: 'news flash'
        },{
          id: '202',
          date: '2002-08-02',
          status: 'A',
          newsflash: 'news flash'
        }]);
        done();
      });
  });
  it("errors on a hidden event", function(done) {
    chai.request( app )
      .get('/api/retrieve_event.php')
      .query({
        id: 3
      })
      .end(function (err, res) {
        expect(err).to.be.null;
        testData.expectError(expect, res);
        done();
      });
  });
  it("errors on a hidden event, unless given the secret", function(done) {
    chai.request( app )
      .get('/api/retrieve_event.php')
      .query({
        id: 3,
        secret: testData.secret,
      })
      .end(function (err, res) {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        done();
      });
  });
});


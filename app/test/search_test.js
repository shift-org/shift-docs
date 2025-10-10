const chai = require('chai');
const sinon = require('sinon');
const app = require("../app");
const testdb = require("./testdb");

chai.use(require('chai-http'));
const expect = chai.expect;

describe("searching for events", () => {
  // runs before the first test in this block.
  before(function() {
    return testdb.setupWithFakeData();
  });
  // runs once after the last test in this block
  after(function () {
    return testdb.destroy();
  });
  // test:
  it("errors on an empty search term", function(done) {
    chai.request( app )
      .get('/api/search.php')
      // .query({q: "events"})
      .end(function (err, res) {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        expect(res).to.be.json;
        expect(res.body).property('error').to.exist;
        done();
      });
  });
  it("handles a search", function(done) {
    chai.request( app )
      .get('/api/search.php')
      .query({q: "go", all: true})
      .end(function (err, res) {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.have.nested.property('pagination.fullcount', 8);
        expect(res.body).property('events').lengthOf(8);
        done();
      });
  });
  it("handles narrow limits", function(done) {
    chai.request( app )
      .get('/api/search.php')
      .query({
          q: "go", 
          l: 2,
          all: true
        })
      .end(function (err, res) {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.have.nested.property('pagination.fullcount', 8);
        expect(res.body).to.have.nested.property('pagination.offset', 0);
        expect(res.body).to.have.nested.property('pagination.limit', 2);
        expect(res.body).property('events').lengthOf(2);
        done();
      });
  });
  it("handles offsets", function(done) {
    chai.request( app )
      .get('/api/search.php')
      .query({
          q: "go", 
          o: 4,
          l: 2,
          all: true
        })
      .end(function (err, res) {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.have.nested.property('pagination.fullcount', 8);
        expect(res.body).to.have.nested.property('pagination.offset', 4);
        expect(res.body).to.have.nested.property('pagination.limit', 2);
        expect(res.body).property('events').lengthOf(2);
        const events = res.body.events;
        expect(events[0].title).to.equal("I Can't Go For That (No Can Do)");
        expect(events[1].title).to.equal("Na Na Hey Hey (Kiss Him Goodbye)");
        done();
      });
  });
});

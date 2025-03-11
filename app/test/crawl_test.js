const chai = require('chai');
const sinon = require('sinon');
const app = require("../app");
const testdb = require("./testdb");

chai.use(require('chai-http'));
const expect = chai.expect;

describe("crawl testing", () => {
  // runs before the first test in this block.
  before(function() {
    return testdb.setup();
  });
  // runs once after the last test in this block
  after(function () {
    return testdb.destroy();
  });
  // test:
  it("handles a simple get", function(done) {
    chai.request( app )
      .get('/api/crawl.php') // 735-TODO: update tests and run specs
      .end(function (err, res) {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res).to.be.html;
        // console.log(res.text);
        done();
      });
  });
  it("handles a valid daily id", function(done) {
    chai.request( app )
      .get('/api/crawl.php')
      .query({id: 201})
      .end(function (err, res) {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res).to.be.html;
        // console.log(res.text);
        done();
      });
  });
  it("errors on an invalid daily id", function(done) {
    chai.request( app )
      .get('/api/crawl.php')
      .query({id: 999})
      .end(function (err, res) {
        expect(err).to.be.null;
        expect(res).to.have.status(404);
        // crawl returns an empty 404
        expect(res).to.be.text;
        done();
      });
  });
});

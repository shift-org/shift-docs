const chai = require('chai');
const sinon = require('sinon');
const app = require("../app");
const testData = require("./testData");

chai.use(require('chai-http'));
const expect = chai.expect;

describe("crawl testing", () => {
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
  it("handles a simple get", function(done) {
    chai.request( app )
      .get('/api/crawl.php')
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

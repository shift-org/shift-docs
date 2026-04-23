const dt = require("../util/dateTime");
const config = require("../config");
const assert = require("node:assert/strict");

const secret = "12e1c433836d6c92431ac71f1ff6dd97";
const email ="email@example.com";

module.exports = {
  secret,
  email,
  expectOkay(res) {
    assert.equal(res.status, 200);
  },
  // helper for testing the calendar's custom error message format.
  expectError(res, field) {
    assert.equal(res.status, 400);
    assert.match(res.header['content-type'], /json/);
    assert.match(res.header['api-version'], /^3\./);
    assert.ok(res.body?.error?.message);
    assert.ok(!field || res.body.error.fields[field]);
  },
  // create a fake database of cal events and dailies:
  fakeNow(sinon) {
    // fake now to be 5th day of august 2002
    sinon.stub(dt, 'getNow').callsFake(() => {
      return dt.fromYMDString('2002-08-05');
    });
  },
  // changes how absolute urls are generated
  fakeSiteUrl(sinon, path) {
    sinon.stub(config.site, 'url').callsFake((...parts) => {
      return [path, ...parts].join("/");
    });  
  },
  setupImageDir(sinon, path) {
    sinon.replace(config.image, 'dir', path);
  }
};

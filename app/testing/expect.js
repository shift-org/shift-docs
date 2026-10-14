/**
 * Helpers for common http test results.
 */
const assert = require('node:assert/strict');

const expect = {
  // a little ugly. poked in by testing.configure.
  expectedFormat: "",
  // dress for success.
  okay(res) {
    const types = {
      json: /json/,
      html: /html/,
      ical: /^text\/calendar/,
    };
    const fmt = this.expectedFormat;
    if (fmt) {
      const expectedType = types[fmt];
      if (!expectedType) {
        throw new Error(`test requested an unknown format '${fmt}'`)
      }
      assert.match(res.header['content-type'], expectedType);
    }
    // note: crawl sends html and doesn't set the api version.
    if (fmt !== 'html') {
      assert.match(res.header['api-version'] || "missing api version", /^3\./);
    }
    const body = JSON.stringify(res.body);
    assert.equal(res.status, 200, `got status ${res.status} with body ${body}`);
    return res;
  },
  // checks for shift's custom error message format.
  // field can check for a particular message field
  error(res, field = null) {
    if (field) {
      const errMsg = res.body?.error?.fields[field];
      assert.ok(errMsg, `expected an error message for field "${field}"`);
    }
    assert.notEqual(res.status, 200, `unexpected status 200`);
    assert.match(res.header['content-type'], /json/);
    assert.match(res.header['api-version'] || "missing api version", /^3\./);
    assert.ok(res.body?.error?.message, "a general error message must exist");
    return res;
  }
};

module.exports = expect;


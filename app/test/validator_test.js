const { ErrorCollector, makeValidator } = require("../models/calEventValidator");
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

describe('event field validation', () => {
  it('int validator should succeed', () => {
    const pairs = [
      // value, expectation
      12, 12,
      "12", 12,
      null, 0,
      0, 0,
    ];
    for (let i = 0; i < pairs.length; i += 2) {
      const key = "key";
      const value = pairs[i + 0];
      const want  = pairs[i + 1];
      const errors = new ErrorCollector();
      const v = makeValidator({ key: value }, errors);
      const got = v.zeroInt(key);
      assert.equal(got, want, `test ${i / 2}`);
      assert.equal(errors.count, 0);
    }
  });
  it('int validator should fail', () => {
    const list = [  // all of these should fail.
      -12,
      "-12",
      NaN,
      "i am not a number",
      "42a",
      "a42",
      "3.5",
    ];
    // collect all of the errors
    const errors = new ErrorCollector();
    for (let i = 0; i < list.length; i++) {
      const key = "key";
      const v = makeValidator({ key: list[i] }, errors);
      const got = v.zeroInt(key);
      assert.equal(got, undefined, `test ${i / 2}`);
      assert.equal(errors.count, i + 1, `count ${i}`);
    }
    assert.equal(errors.count, list.length, "final length");
    const msg = errors.getErrors();
    // all of the fields had the same name "key"
    // there should be one error in there
    assert.ok(msg.key);
    assert.equal(msg.key, `Please enter a value for <span class="field-name">key</span>`);
  });
});

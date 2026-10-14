const { ErrorCollector, makeValidator } = require("../models/calEventValidator");
const { RideLength } = require("../models/calConst");
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
  it('ride length validator should accept the known lengths', () => {
    for (const want of Object.keys(RideLength)) {
      const errors = new ErrorCollector();
      const v = makeValidator({ ridelength: want }, errors);
      assert.equal(v.validateRideLength('ridelength'), want);
      assert.equal(errors.count, 0);
    }
  });
  it('ride length validator should reject anything else', () => {
    const list = [
      "bogus",
      "",
      null,
      // these are inherited from Object.prototype;
      // an 'in' test would let them through. re: #1089
      "toString",
      "constructor",
      "hasOwnProperty",
      "valueOf",
      "__proto__",
    ];
    for (const bad of list) {
      const errors = new ErrorCollector();
      const v = makeValidator({ ridelength: bad }, errors);
      assert.equal(v.validateRideLength('ridelength'), null, `for ${JSON.stringify(bad)}`);
    }
  });
  it('ride length validator should not leak a global', () => {
    delete globalThis.value;
    const errors = new ErrorCollector();
    const v = makeValidator({ ridelength: '0-3' }, errors);
    v.validateRideLength('ridelength');
    assert.equal(globalThis.value, undefined, "expected no implicit global");
  });
});

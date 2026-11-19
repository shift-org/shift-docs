const { ErrorCollector } = require('shift-docs/util/errors');
const { EventValidator } = require('shift-docs/support/eventValidator');
const { Area, Audience, Distance, Distances, LocType, Showable, TagName, WebType } = require('shift-docs/models/newConst');
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

function validateRideLength(testValue, errors) {
  // the validator throws if not a string
  const input = { ridelength: String(testValue) };
  const v = new EventValidator(input, errors || new ErrorCollector());
  const got = v.select('ridelength').shorthand(Distance);
  return { value: got, errors: v.errors };
}

function validateInt(testValue, errors) {
  // the validator throws if not a string
  const input = { key: String(testValue) };
  const v = new EventValidator(input, errors || new ErrorCollector());
  const got = v.select("key").zeroInt();
  return { value: got, errors: v.errors };
}

describe('event field validation', () => {
  it('int validator should succeed', () => {
    const list = [ 12, 0 ];
    for (let i = 0; i < list.length; i ++) {
      const value = list[i];
      const res = validateInt(value);
      assert.equal(res.value, value, `test ${i / 2}`);
      assert.equal(res.errors.count, 0);
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
      const res = validateInt(list[i], errors);
      assert.equal(res.value, undefined, `test ${i / 2}`);
      assert.equal(res.errors.count, i + 1, `count ${i}`);
    }
    assert.equal(errors.count, list.length, "final length");
    const msg = errors.getErrors();
    // all of the fields had the same name "key"
    // there should be one error in there
    assert.ok(msg.key);
    assert.equal(msg.key, `Please enter a value for <span class="field-name">key</span>`);
  });
  it('ride length validator should accept the known lengths', () => {
    for (const dist of Distances) {
      const res = validateRideLength(dist.key);
      assert.equal(res.value, dist.value);
      assert.equal(res.errors.count, 0);
    }
  });
  it('ride length validator should reject anything else', () => {
    const list = [
      "bogus",
      "",
      null,
      // inherited from Object.prototype
      "toString",
      "constructor",
      "hasOwnProperty",
      "valueOf",
      "__proto__",
    ];
    for (const bad of list) {
      const res = validateRideLength(bad);
      assert.equal(res.value, undefined, `for ${JSON.stringify(bad)}`);
      assert.notEqual(res.errors.count, 0);
    }
  });
  // this is for an issue that has been fixed
  // since we aren't testing all the code for leaking globals:
  // we can nix this test now.
  it('ride length validator should not leak a global', () => {
    delete globalThis.value;
    validateRideLength('0-3');
    assert.equal(globalThis.value, undefined, "expected no implicit global");
  });
});

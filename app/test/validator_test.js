const chai = require('chai');
const expect = chai.expect;
const { ErrorCollector, makeValidator } = require("../models/calEventValidator");

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
      expect(got, `test ${i / 2}`).to.equal(want);
      expect(errors.count).to.equal(0);
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
      expect(got, `test ${i / 2}`).to.be.undefined;
      expect(errors.count, `count ${i}`).to.equal(i+1);
    }
    expect(errors.count, "final length").to.equal(list.length);
    const msg = errors.getErrors();
    // all of the fields had the same name "key"
    // there should be one error in ther e
    expect(msg.key).to.exist;
    expect(msg.key).to.equal(`Please enter a value for <span class="field-name">key</span>`);
  });

});

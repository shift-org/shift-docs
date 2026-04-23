const dt = require('../util/dateTime.js');
//
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

describe.skip('date time', () => {
  it('parse times', () => {
    // these should be considered valid
    const validTimes = ["9:10 AM", "9:00 PM"];
    validTimes.forEach(t => {
      const time = dt.from12HourString(t);
      assert.ok(time.isValid(), `expected "${t}" to be valid`);
    });
    // all of these should be considered invalid
    // ( if we wanted 09:00 PM to be valid, we could trim leading zeros from the input )
    const invalidTimes = ["9:10", "12:10:30", "9 PM", "9:00 XX", "99:99 PM", "09:00 PM"];
    invalidTimes.forEach(t => {
      const time = dt.from12HourString(t);
      assert.ok(!time.isValid(), `expected "${t}" to be invalid; ${time} ${dt.to24HourString(time)}`);
    });
  });
  it('should format ical date times', () => {
    // april 12th 9:10pm local, should be utc april 13th, 4:10am
    const day = dt.fromYMDString("2023-04-12");
    const time = dt.from12HourString("9:10 PM");
    const when = dt.combineDateAndTime(day, time);
    assert.equal(dt.icalFormat(when), "20230413T041000Z");
  });
  it('should handle invalid dates', () => {
    assert.equal(dt.to24HourString(null), null);
    // mimic a bad or empty date sent to calEvent.updateFromJSON
    assert.equal(dt.to24HourString(dt.from12HourString()),null);
  });
});

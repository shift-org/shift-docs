const dt = require('../util/dateTime.js');
//
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

describe('date time', () => {
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

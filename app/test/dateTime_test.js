const chai = require('chai');
const dt = require('../util/dateTime.js');
const expect = chai.expect;

describe('date time', () => {
  it('should format ical date times', () => {
    const day = dt.fromYMDString("2023-04-12");
    const time = dt.from12HourString("9:10 PM");
    const when = dt.combineDateAndTime(day, time);
    expect(dt.icalFormat(when)).to.equal("20230413T041000Z");
  });

  it('should handle invalid dates', () => {
    expect(dt.to24HourString(null)).to.be.null;
    // mimic a bad or empty date sent to calEvent.updateFromJSON
    expect(dt.to24HourString(dt.from12HourString())).to.be.null;
  });
});

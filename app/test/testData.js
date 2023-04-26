const dt = require("../util/dateTime");

const { CalEvent } = require("../models/calEvent");
const { CalDaily } = require("../models/calDaily");

const secret = "12e1c433836d6c92431ac71f1ff6dd97";
const email ="email@example.com";

module.exports = {
  secret,
  email,
  // helper for testing the calendar's custom error message format.
  expectError(expect, res) {
    expect(res).to.have.status(400);
    expect(res).to.be.json;
    if (expect(res.body).to.have.property('error') &&
      expect(res.body.error).to.have.property('message')) {
      expect(res.body.error.message).to.be.a('string');
      expect(res.body.error.message).to.not.be.empty;
    }
  },
  // create a fake database of cal events and dailies:
  stubData(sinon) {
    // fake now to be 5th day of august 2002
    sinon.stub(dt, 'getNow').callsFake(function() {
      return dt.fromYMDString('2002-08-05');
    });

    const dailyStore = sinon.spy(CalDaily.methods, '_store')
    const eventStore = sinon.spy(CalEvent.methods, '_store')
    const eventDeletions = sinon.spy(CalEvent.methods, 'deleteEvent');

    return {
      dailyStore,
      eventStore,
      eventDeletions
    }
  },
};

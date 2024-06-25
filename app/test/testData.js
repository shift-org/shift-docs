const dt = require("../util/dateTime");

const { CalEvent } = require("../models/calEvent");
const { CalDaily } = require("../models/calDaily");

const secret = "12e1c433836d6c92431ac71f1ff6dd97";
const email ="email@example.com";

module.exports = {
  secret,
  email,
  // helper for testing the calendar's custom error message format.
  expectError(expect, res, ...fields) {
    expect(res).to.have.status(400);
    expect(res).to.be.json;
    expect(res).to.have.header('Api-Version');
    if (expect(res.body).to.have.property('error')) {
      const err= res.body.error;
      if (expect(err).to.have.property('message')) {
        expect(err.message).to.be.a('string');
        expect(err.message).to.not.be.empty;
      }
      fields.forEach(field => {
        expect(err.fields, field).to.have.key(field);
      });
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
    const eventErasures = sinon.spy(CalEvent.methods, 'eraseEvent');

    return {
      dailyStore,
      eventStore,
      eventErasures
    }
  },
};

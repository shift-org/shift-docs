const dt = require("server/util/dateTime");

const { CalEvent } = require("shift-docs/models/calEvent");
const { CalDaily } = require("shift-docs/models/calDaily");
module.exports = stubData;

// list to writes into the cal/daily event data
function stubData(sinon) {
  // fake now to be 5th day of august 2002
  sinon.stub(dt, 'getNow').callsFake(() => {
    return dt.fromYMDString('2002-08-05');
  });

  const dailyStore = sinon.spy(CalDaily.methods, '_store')
  const eventStore = sinon.spy(CalEvent.methods, '_store')
  const eventErasures = sinon.spy(CalEvent.methods, 'eraseEvent');

  return {
    dailyStore,
    eventStore,
    eventErasures,
    resetHistory() {
      dailyStore.resetHistory();
      eventStore.resetHistory();
      eventErasures.resetHistory();
    }
  }
}

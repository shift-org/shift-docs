const { CalEvent } = require("../models/calEvent");
const { CalDaily } = require("../models/calDaily");
const { Area, Audience, DatesType, EventStatus, Review } = require("../models/calConst");
const dt = require("../util/dateTime");
const loremIpsum = require("lorem-ipsum").loremIpsum;

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

    const events = new Map();
    const dailies = new Map();
    let customIds = 500;

    // first, before creating any data:
    // modify the low level functions
    const eventDeletions = sinon.fake.resolves(true);
    sinon.replace(CalEvent.methods, 'deleteEvent', eventDeletions);

    // stub out the database to return that data
    // tbd: maybe _store, etc. should be in knex and changed there instead.
    const eventStore = sinon.stub(CalEvent.methods, '_store').callsFake(function() {
      const evt = this;
      if (!evt.id) {
        evt.id = (++customIds).toString();
        events.set(evt.id, evt);
      }
      return Promise.resolve(evt);
    });
    const dailyStore = sinon.stub(CalDaily.methods, '_store').callsFake(function() {
      const at = this;
      if (!at.pkid) {
        at.pkid = (++customIds).toString();
        dailies.set(at.pkid, at);
      }
      return Promise.resolve(at);
    });

    // create three events:
    // 1&3 have no dailies; 3 is unpublished.
    const eventList = [fakeCalEvent(1), fakeCalEvent(2), fakeCalEvent(3)];
    eventList.forEach(a => events.set(a.id, a));

    // create two dailies: 201, 202 both using cal event 2.
    const dailyList = [fakeCalDaily(1, 2), fakeCalDaily(2, 2)];
    dailyList.forEach(a => dailies.set(a.pkid, a));

    // stub out the database to return that data
    sinon.stub(CalEvent, 'getByID').callsFake(function(id) {
      // tbd: not sure what's right the actual ids
      // some queries send ints, others strings
      // maybe its all the same to the mysql driver?
      id = id.toString();
      return Promise.resolve(events.get(id));
    });

    sinon.stub(CalDaily, 'getByDailyID').callsFake(function(id) {
      id = id.toString();
      return Promise.resolve(dailies.get(id));
    });
    // promises an array of CalDaily(s).
    sinon.stub(CalDaily, 'getByEventID').callsFake(function(id) {
      id = id.toString();
      const matching = Array.from(dailies.values()).filter((at) => at.id === id);
      return Promise.resolve(matching);
    });
    // a simplified version of the real thing.
    // ignores event filtering ...
    // this is really only for testing the endpoint processing; not the db.
    sinon.stub(CalDaily, 'getRangeVisible').callsFake(function(first, last) {
      // testing by string works okay; otherwise could use dayjs isSameOrAfter
      first = dt.toYMDString( first );
      last = dt.toYMDString( last );
      const matching = Array.from(dailies.values()).filter((at) => {
        const d = dt.toYMDString( at.eventdate );
        return d >= first && d <= last;
      });
      return Promise.resolve(matching);
    });

    return {
      events,
      dailies,
      dailyStore,
      eventStore,
      eventDeletions
    }
  },
};

function fakeCalDaily(order, eventId) {
  if (!eventId) { throw new Error("expects a valid id"); }
  const pkid = order + (eventId * 100);
  const ymd = "2002-08-" + order.toString().padStart(2, "0");
  return CalDaily.wrap({
    id          : '' + eventId,
    pkid        : '' + pkid,
    eventdate   : dt.fromYMDString(ymd).toDate(),
    eventstatus : EventStatus.Active,
    newsflash   : "news flash",
  }, false);
}

function fakeCalEvent(eventId) {
  if (!eventId) { throw new Error("expects a valid id"); }
  // an arbitrary created, modified time.
  const created = new Date(1993, 6, 28, 14, 39);
  const modified = new Date(1993, 7, 28, 2, 7);
  const contacturl = "http://example.com";
  const title = `ride ${eventId} title`;
  const organizer = "organizer";
  // generate some consistent, arbitrary text:
  const descr = loremIpsum({
    random: mulberry32(eventId),
  });
  return CalEvent.wrap({
    created,
    modified,
    changes: 1,
    id: ''+eventId,
    name: organizer,
    email: email,
    hideemail: 1,
    printemail: 0,
    phone: "555-503-5055",
    hidephone: 1,
    printphone: 0,
    weburl: contacturl,
    webname: "example.com",
    printweburl: contacturl,
    contact: organizer,
    hidecontact : 1,
    printcontact : 1,
    title: title,
    tinytitle: title,
    audience: Audience.General,
    descr,
    printdescr: descr,
    image: `/eventimages/${eventId}.png`,
    datestype: DatesType.OneDay,
    eventtime: "19:00:00",
    eventduration: 60,
    timedetails: "time details",
    // use some ical sensitive chars
    locname: "location, name.",
    // use some html characters
    address: "<address>",
    // use some more html chars
    locdetails: "location && details",
    // use some more ical sensitive chars
    locend: "location; end.",
    loopride : 1,
    area: Area.Portland,
    highlight: 0,
    hidden: eventId !== 3 ? 0 : 1,  // #3 is unpublished.
    password: secret,
    safetyplan : 1,
  });
}

// https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript
function mulberry32(a) {
  return function() {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

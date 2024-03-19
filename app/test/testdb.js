const { Area, Audience, DatesType, EventStatus, Review } = require("../models/calConst");
const dt = require("../util/dateTime");
const loremIpsum = require("lorem-ipsum").loremIpsum;
const testData = require("./testData");
const knex = require("../knex");

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
module.exports = {
  setup : async function() {
    await knex.recreate();
    return createData(knex.query);
  },
  destroy: function() {
    return knex.query.destroy();
  }
}

async function createData(knex) {
  await knex.table('calevent').insert(fakeCalEvent(1));
  await knex.table('calevent').insert(fakeCalEvent(2));
  await knex.table('calevent').insert(fakeCalEvent(3));
  //
  await knex.table('caldaily').insert(fakeCalDaily(1, 2));
  await knex.table('caldaily').insert(fakeCalDaily(2, 2));
};

function fakeCalDaily(order, eventId) {
  if (!eventId) { throw new Error("expects a valid id"); }
  const pkid = order + (eventId * 100);
  const ymd = "2002-08-" + order.toString().padStart(2, "0");
  return {
    id          : eventId,
    pkid        : pkid,
    eventdate   : dt.fromYMDString(ymd).toDate(),
    eventstatus : EventStatus.Active,
    newsflash   : "news flash",
  };
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
  return {
    created,
    modified,
    changes: 1,
    id: eventId,
    name: organizer,
    email: testData.email,
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
    password: testData.secret,
    safetyplan : 1,
  };
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

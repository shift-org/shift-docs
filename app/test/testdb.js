const { Area, Audience, DatesType, EventStatus, Review } = require("../models/calConst");
const tables = require("../models/tables");
const dt = require("../util/dateTime");
const { faker } = require('@faker-js/faker');
const testData = require("./testData");
const db = require("../db");
const { generateFakeData, insertFakeData } = require("./fakeData");

module.exports = {
  // generates a hand rolled set of data
  setupTestData: async (name) => {
    await db.initialize();
    await tables.dropTables();
    await tables.createTables();
    faker.seed(23204); // uses lorem generator
    await createTestData();
  },
  // uses faker to generate a good amount of fake data
  setupFakeData: async (name) => {
    await db.initialize();
    await tables.dropTables();
    await tables.createTables();
    const firstDay = dt.fromYMDString("2002-08-01");
    const lastDay  = dt.fromYMDString("2002-08-31");
    const numEvents = 46;
    const seed = 23204; // keeps the generated data stable.
    const fakeData = generateFakeData(firstDay, lastDay, numEvents, seed, seed);
    return insertFakeData(fakeData);
  },
  destroy() {
    // leaves the tables in place; lets create drop them when needed.
    return db.destroy();
  }
}

async function createTestData() {
  await db.query('calevent').insert(fakeCalEvent(1));
  await db.query('calevent').insert(fakeCalEvent(2));
  await db.query('calevent').insert(fakeCalEvent(3));
  //
  await db.query('caldaily').insert(fakeCalDaily(1, 2));
  await db.query('caldaily').insert(fakeCalDaily(2, 2));
};

function fakeCalDaily(order, eventId) {
  if (!eventId) { throw new Error("expects a valid id"); }
  const pkid = order + (eventId * 100);
  const ymd = "2002-08-" + order.toString().padStart(2, "0");
  return {
    id          : eventId,
    pkid        : pkid,
    eventdate   : db.toDate(dt.fromYMDString(ymd)),
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
  const descr = faker.lorem.text();
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
    printweburl: 1,
    contact: organizer,
    hidecontact : 1,
    printcontact : 1,
    title: title,
    tinytitle: title,
    audience: Audience.General,
    descr,
    printdescr: descr,
    image: `${eventId}.png`,
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
    hidden: hidden(eventId),
    password: testData.secret,
    safetyplan : 1,
  };
}

function hidden(eventId) {
  switch (eventId) {
  case 3:
    return 1; // #3 is hidden/unpublished.
  case 2:
    return 0;
  case 1:
    return null; // use a legacy hidden code.
  default:
    throw new Error("unexpected event id", eventId);
  }
}
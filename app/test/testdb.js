const { Area, Audience, DatesType, EventStatus, Review } = require("../models/calConst");
const dt = require("../util/dateTime");
const { faker } = require('@faker-js/faker');
const testData = require("./testData");
const knex = require("../knex");
const { makeFakeData } = require("./fakeData");

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
module.exports = {
  setup: async () => {
    await knex.recreate();
    faker.seed(23204); // keeps the generated data stable.
    return createData(knex.query);
  },
  setupWithFakeData: async () => {
    await knex.recreate();
    const firstDay = dt.fromYMDString("2002-08-01");
    const lastDay  = dt.fromYMDString("2002-08-31");
    const numEvents = 46;
    faker.seed(23204); // keeps the generated data stable.
    return makeFakeData(firstDay, lastDay, numEvents);
  },
  destroy: async () => {
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
    eventdate   : knex.toDate(dt.fromYMDString(ymd)),
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
    printweburl: contacturl,
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
const { TagName, LocType, WebType } = require("../models/calConst");
const tables = require("../models/tables");
const dt = require("../util/dateTime");
const { faker } = require('@faker-js/faker');
const testData = require("./testData");
const db = require("../db");
const { generateFakeData, insertFakeData } = require("./fakeData");

module.exports = {
  // generates a hand rolled set of data
  setupTestData: async (name) => {
    await db.initialize('setupTestData');
    await tables.createTables(db, {drop: true});
    faker.seed(23204); // uses lorem generator
    await createTestData();
  },
  // uses faker to generate a good amount of fake data
  setupFakeData: async (name) => {
    await db.initialize('setupFakeData');
    await tables.createTables(db, {drop: true});
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
  },
  // retun all data including private data
  findSeries(seriesId) {
    return db
      .query('private_events')
      .where('id', seriesId);
  }
}

async function createTestData() {
  // create 3 separate series with ids 1, 2, 3
  for (const id of [1, 2, 3]) {
    const tableValues = fakeCalEvent(id);
    await tables.insertEventData(db.query, tableValues);
  }
  // generates two status days for series 2.
  const eventId = 2;
  for (const order of [1, 2]) {
    const item = fakeCalDaily(order, eventId);
    await db.query('schedule').insert(item);
  }
}

function fakeCalDaily(order, eventId) {
  if (!eventId) { throw new Error("expects a valid id"); }
  const pkid = order + (eventId * 100);
  const ymd = "2002-08-" + order.toString().padStart(2, "0");
  return {
    id       : eventId,
    pkid     : pkid,
    ymd      : ymd,
    news     : "news flash",
    is_scheduled : 1  // boolean as a number
  };
}

// returns data which gets written directly to the db
function fakeCalEvent(eventId) {
  if (!eventId) { throw new Error("expects a valid id"); }
  // an arbitrary created, modified time.
  const created = new Date(1993, 6, 28, 14, 39);
  const modified = new Date(1993, 7, 28, 2, 7);
  const contacturl = "http://example.com";
  const title = `ride ${eventId} title`;
  const organizer = "organizer";
  // generate some consistent, arbitrary text:
  const descr = faker.lorem.text();
  return {
    // image: {
    //   img_version: 1,
    //   img_ext: 'jpg',
    // },
    series: {
      id: eventId,
      created,
      modified,
      published: eventId === 3 ? 0 : 1,
      organizer,
      start_time: "19:00:00",
      ride_duration: 60,
      title,
      tiny: title,
      details: descr,
    },
    location: [{
      loc_type:    LocType.Start,
      place_name:  "location, name.",    // test ical handling: comma and full-stop are ical sensitive chars
      address:     "<address>",          // test html renedering: gt, lt are html sensitive chars
      place_info:  "location && details",
      time_info:   "time details",
    },{
      loc_type: LocType.Finish,
      place_name: "location; end.",  // semi-colon is another ical sensitive char
    }],
    private: {
      secret: testData.secret,
      private_email: testData.email,
      private_phone: "555-503-5055",
      private_contact: organizer,
      show_email: 0,
      show_phone: 0,
      show_contact: 0,
    },
    print: {
      add_contact : 1,
      add_email: 0,
      add_link: 1,
      add_phone: 0,
      printed_summary: descr,
    },
    tag: [
      tag(TagName.LoopRide),
      tag(TagName.SafetyPlan),
    ],
    web: [{
      web_type: WebType.Url,
      web_link: contacturl,
      web_text: "example.com",
    }],
  }
}

function tag(a, b = 'true') {
  return {
    tag_type: a,
    tag_value: b,
  }
}

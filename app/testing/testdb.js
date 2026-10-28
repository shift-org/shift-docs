const { faker } = require('@faker-js/faker');
const db = require('shift-docs/db');
const dt = require('shift-docs/util/dateTime');
const { setupTables } = require('shift-docs/schema');
const { insertNewData } = require('shift-docs/support/reconcile');
const { TagName, LocType, Showable, WebType } = require('shift-docs/models/newConst');
const user = require('shift-docs/testing/user');

module.exports = {
  createTestData,
}

// a small set of manually defined test data
async function createTestData(db, scheduledEvents) {
  // create 3 separate series with ids 1, 2, 3
  for (const id of [1, 2, 3]) {
    const tableValues = fakeCalEvent(id);
    await insertNewData(db.query, tableValues);
  }
  // schedules a few days to some of the events
  const whichEvents = scheduledEvents || [2];
  for (const id of whichEvents) {
    for (const order of [1, 2]) {
      const item = fakeCalDaily(order, id);
      await db.query('cal_schedule').insert(item);
    }
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
      scheduled_duration: 60,
      title,
      tiny_title: title,
      summary: descr,
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
      secret: user.secret,
      private_email: user.email,
      private_phone: "555-503-5055",
      private_contact: organizer,
      show_contact: Showable.Printable.value,
      show_email: Showable.Private.value,
      show_phone: Showable.Private.value,
    },
    tag: [
      tag(TagName.LoopRide),
      tag(TagName.SafetyPlan),
    ],
    web: [{
      web_type: WebType.Url,
      web_link: contacturl,
      web_text: "example.com",
      show_weburl: Showable.Public.value, // test always uses printable, visible.
    }],
  }
}

function tag(a, b = 'true') {
  return {
    tag_type: a,
    tag_value: b,
  }
}

const sinon = require('sinon');
const app = require("../appEndpoints");
const testData = require("./testData");
const testdb = require("./testdb");

const { CalEvent } = require("../models/calEvent");
const { CalDaily } = require("../models/calDaily");
const { EventStatus } = require("../models/calConst");
const ical = require("../endpoints/ical");
const dt = require("../util/dateTime");
//
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const request = require('supertest');

const CalendarType = /^text\/calendar/;

describe("ical feed", () => {
  // runs before the evt test in this block.
  before(() => {
    testData.stubData(sinon);
    return testdb.setupTestData("ical");
  });
  // runs once after the last test in this block
  after(() => {
    sinon.restore();
    return testdb.destroy();
  });
  it("errors on an invalid id", () => {
    return request(app)
      .get('/api/ical.php')
      .query({
        id: 999
      })
      .expect(400);
  });
  it("errors on an invalid date",  () => {
    return request(app)
      .get('/api/ical.php')
      .query({
        // date time formats have been loosened ( #ff5ae63 )
        // clearly invalid dates are still rejected.
        startdate: "apple",
        enddate  : "sauce",
        // startdate: "2002/05/06",
        // enddate  : "2002/05/06",
      })
      .expect(400);
  });
  it("errors on too large a range",  () => {
    return request(app)
      .get('/api/ical.php')
      .query({
        startdate: "2002-01-01",
        enddate  : "2003-01-01",
      })
      .expect(400);
  });
  it("errors on a negative range",  () => {
    return request(app)
      .get('/api/ical.php')
      .query({
        startdate: "2003-01-01",
        enddate  : "2002-01-01",
      })
      .expect(400);
  });
  it("supports an 'all events' feed", () => {
    return request(app)
      .get('/api/ical.php')
      // test that it also has an api version
      // that exists everywhere, but only tested here.
      .expect('Api-Version', /^3\./)
      .expect(200)
      .expect('content-type', CalendarType);
  });
  it("provides the days of a single event", () => {
    return request(app)
      .get('/api/ical.php')
      .query({
         id: 2, // an event id
       })
      .expect(200)
      .expect('content-type', CalendarType)
      .then(res => {
        assert.equal(res.text, allEvents);
      });
  });
  it("provides a range of days", () => {
    return request(app)
      .get('/api/ical.php')
      .query({
         startdate: "2002-08-01",
         enddate  : "2002-08-02",
       })
      .expect(200)
      .expect('content-type', CalendarType);
  });
  it("can return an empty range", () => {
    return request(app)
      .get('/api/ical.php')
      .query({
         startdate: "2002-01-01",
         enddate  : "2002-01-02",
       })
      .expect(200)
      .expect('content-type', CalendarType)
      .then(res => {
        assert.equal(res.text, emptyRange);
      });
  });
  it("has a special pedalpalooza feed", () => {
     return request(app)
      .get('/api/ical.php')
      .query({
         startdate: "2002-08-01",
         enddate  : "2002-08-02",
         filename : "pedalpalooza-2024.ics",
       })
      .expect(200)
      .expect('content-type', CalendarType)
      .then(res => {
        assert.equal(res.text, pedalpaloozaFeed);
      });
  });
  it("can handle a canceled event", () => {
    return CalEvent.getByID(2).then(evt => {
      // todo: create a separate test where these values are nil and zero.
      // that had caused a bad feed at one point; its fixed but still good to test.
      // evt.eventtime = null;
      // evt.eventduration = 0;
      return evt._store().then(() => {
        return CalDaily.getForTesting(201).then(d => {
          d.eventstatus = EventStatus.Cancelled;
          return d._store().then(_ => {
            return request(app)
              .get('/api/ical.php')
              .query({
                 id: 2, // an event id
               })
              .expect(200)
              .expect('content-type', CalendarType)
              .then(res => {
                assert.equal(res.text, cancelledDay);
              });
          });
        });
      });
    });
  });
});

const shiftHeader = [
String.raw`VERSION:2.0`,
String.raw`PRODID:-//shift2bikes.org//NONSGML shiftcal v2.1//EN`,
String.raw`METHOD:PUBLISH`,
String.raw`X-WR-CALNAME:Shift Community Calendar`,
String.raw`X-WR-CALDESC:Find fun bike events all year round.`,
String.raw`X-WR-RELCALID:community@shift2bikes.org`,
];

const pedalpHeader = [
String.raw`VERSION:2.0`,
String.raw`PRODID:-//shift2bikes.org//NONSGML shiftcal v2.1//EN`,
String.raw`METHOD:PUBLISH`,
String.raw`X-WR-CALNAME:Pedalpalooza Bike Calendar`,
String.raw`X-WR-CALDESC:Find fun Pedalpalooza bike events!`,
String.raw`X-WR-RELCALID:shift@shift2bikes.org`,
];

const event1 = [
String.raw`BEGIN:VEVENT`,
String.raw`UID:event-201@shift2bikes.org`,
String.raw`SUMMARY:ride 2 title`,
String.raw`CONTACT:organizer`,
String.raw`DESCRIPTION:news flash\nPeior amicitia texo. Delectus sequi qui temporibus`,
String.raw`  clibanus. Creber creo adamo aedificium creta bardus aegre.\ntime `,
String.raw` details\nEnds at location\; end.\nhttp://localhost:3080/calendar/event-201`,
String.raw`LOCATION:location\, name.\n<address>\nlocation && details`,
String.raw`STATUS:CONFIRMED`,
String.raw`DTSTART:20020802T020000Z`,
String.raw`DTEND:20020802T030000Z`,
String.raw`CREATED:19930728T213900Z`,
String.raw`DTSTAMP:19930828T090700Z`,
String.raw`SEQUENCE:2`,
String.raw`URL:http://localhost:3080/calendar/event-201`,
String.raw`END:VEVENT`,
];
const event2 = [
String.raw`BEGIN:VEVENT`,
String.raw`UID:event-202@shift2bikes.org`,
String.raw`SUMMARY:ride 2 title`,
String.raw`CONTACT:organizer`,
String.raw`DESCRIPTION:news flash\nPeior amicitia texo. Delectus sequi qui temporibus`,
String.raw`  clibanus. Creber creo adamo aedificium creta bardus aegre.\ntime `,
String.raw` details\nEnds at location\; end.\nhttp://localhost:3080/calendar/event-202`,
String.raw`LOCATION:location\, name.\n<address>\nlocation && details`,
String.raw`STATUS:CONFIRMED`,
String.raw`DTSTART:20020803T020000Z`,
String.raw`DTEND:20020803T030000Z`,
String.raw`CREATED:19930728T213900Z`,
String.raw`DTSTAMP:19930828T090700Z`,
String.raw`SEQUENCE:2`,
String.raw`URL:http://localhost:3080/calendar/event-202`,
String.raw`END:VEVENT`,
];


const allEvents = [
String.raw`BEGIN:VCALENDAR`,
...shiftHeader,
...event1,
...event2,
String.raw`END:VCALENDAR`,
"" // trailing new line. i think.
].join("\r\n");

const emptyRange = [
String.raw`BEGIN:VCALENDAR`,
...shiftHeader,
String.raw`END:VCALENDAR`,
"" // trailing new line. i think.
].join("\r\n");

const canceled1= [
String.raw`BEGIN:VEVENT`,
String.raw`UID:event-201@shift2bikes.org`,
String.raw`SUMMARY:CANCELLED: ride 2 title`,
String.raw`CONTACT:organizer`,
String.raw`DESCRIPTION:news flash\nPeior amicitia texo. Delectus sequi qui temporibus`,
String.raw`  clibanus. Creber creo adamo aedificium creta bardus aegre.\ntime `,
String.raw` details\nEnds at location\; end.\nhttp://localhost:3080/calendar/event-201`,
String.raw`LOCATION:location\, name.\n<address>\nlocation && details`,
String.raw`STATUS:CANCELLED`,
String.raw`DTSTART:20020802T020000Z`,
String.raw`DTEND:20020802T030000Z`,
String.raw`CREATED:19930728T213900Z`,
String.raw`DTSTAMP:19930828T090700Z`,
String.raw`SEQUENCE:2`,
String.raw`URL:http://localhost:3080/calendar/event-201`,
String.raw`END:VEVENT`,
];

const cancelledDay = [
String.raw`BEGIN:VCALENDAR`,
...shiftHeader,
...canceled1,
...event2,
String.raw`END:VCALENDAR`,
"" // trailing new line. i think.
].join("\r\n");

const pedalEnd = [
String.raw`BEGIN:VEVENT`,
String.raw`UID:pedalpalooza-2002-end@shift2bikes.org`,
String.raw`SUMMARY:Pedalpalooza 2002 is over!`,
String.raw`CONTACT:bikecal@shift2bikes.org`,
String.raw`DESCRIPTION:We hope you've had a great bike summer and a great `,
String.raw` Pedalpalooza!!!\nWhile Pedalpalooza is done\, there is still plenty of `,
String.raw` bike fun to be found on the Shift2bikes website. And you can also `,
String.raw` subscribe to the Shift community calendar to see those rides.\nVisit `,
String.raw` https://shift2bikes.org/calendar/ for more details.`,
String.raw`LOCATION:Portland\, and beyond!`,
String.raw`STATUS:CONFIRMED`,
// midnight on the last day
String.raw`DTSTART:20020803T070000Z`,
// the end of the next day
String.raw`DTEND:20020804T065959Z`,
// fake created date ( in the same year )
String.raw`CREATED:20020601T070000Z`,
String.raw`DTSTAMP:20020601T070000Z`,
String.raw`SEQUENCE:1`,
String.raw`URL:https://shift2bikes.org/calendar/`,
String.raw`END:VEVENT`,
];

const pedalpaloozaFeed = [
String.raw`BEGIN:VCALENDAR`,
...pedalpHeader,
...event1,
...event2,
...pedalEnd,
String.raw`END:VCALENDAR`,
"" // trailing new line. i think.
].join("\r\n");

// buildCalEntry is a pure function, so these need no database.
// re: #498 -- and the "nil and zero" todo in "can handle a canceled event".
describe("ical duration", () => {
  const day = dt.fromYMDString("2002-08-01");

  // build the pieces buildCalEntry() needs for one occurrence.
  function entryFor(eventduration, timedetails = null) {
    const evt = CalEvent.wrap({
      id: 1, title: "Test Ride", name: "organizer",
      descr: "details", eventtime: "19:00:00", eventduration, timedetails,
      created: day.toDate(), modified: day.toDate(), changes: 0,
    });
    const at = CalDaily.wrap({
      pkid: 201, id: 1, eventdate: day.toDate(),
      eventstatus: EventStatus.Active, newsflash: null,
    });
    return ical.buildCalEntry(evt, at);
  }

  it("notes the assumed duration when the organizer gave none", () => {
    for (const none of [null, 0, undefined]) {
      const entry = entryFor(none);
      assert.ok(entry.description.includes(ical.UNSPECIFIED_DURATION),
        `expected the note for eventduration ${JSON.stringify(none)}`);
      // the invented end time is one hour after the start
      assert.equal(entry.end.diff(entry.start, 'minute'), 60);
    }
  });

  it("says nothing when the organizer gave a duration", () => {
    const entry = entryFor(90);
    assert.ok(!entry.description.includes(ical.UNSPECIFIED_DURATION),
      "did not expect the note when a duration was supplied");
    assert.equal(entry.end.diff(entry.start, 'minute'), 90);
  });

  // a ride without a duration may still describe its timing in free text,
  // which prints just above this note; repeating it there reads as a
  // contradiction. re: #498
  it("says nothing when timedetails already covers the timing", () => {
    const entry = entryFor(null, "meet 7pm, roll 7:30");
    assert.ok(!entry.description.includes(ical.UNSPECIFIED_DURATION),
      "did not expect the note alongside timedetails");
    assert.ok(entry.description.includes("meet 7pm, roll 7:30"),
      "expected the organizer's own timing note to still be there");
    // the end time is still assumed; we just don't say so twice.
    assert.equal(entry.end.diff(entry.start, 'minute'), 60);
  });
});

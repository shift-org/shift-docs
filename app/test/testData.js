/**
 * misc test helpers
 */
const assert = require("node:assert/strict");
const request = require('supertest');
//
const dt = require('server/util/dateTime');
const config = require('server/core/config');
//
const app = require("shift-docs/appEndpoints");

const secret = "12e1c433836d6c92431ac71f1ff6dd97";
const email ="email@example.com";

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
String.raw` details\nEnds at location\; end.\nhttps://shift2bikes.org/calendar/event-`,
String.raw` 201`,
String.raw`LOCATION:location\, name.\n<address>\nlocation && details`,
String.raw`STATUS:CONFIRMED`,
String.raw`DTSTART:20020802T020000Z`,
String.raw`DTEND:20020802T030000Z`,
String.raw`CREATED:19930728T213900Z`,
String.raw`DTSTAMP:19930828T090700Z`,
String.raw`SEQUENCE:2`,
String.raw`URL:https://shift2bikes.org/calendar/event-201`,
String.raw`END:VEVENT`,
];

const event2 = [
String.raw`BEGIN:VEVENT`,
String.raw`UID:event-202@shift2bikes.org`,
String.raw`SUMMARY:ride 2 title`,
String.raw`CONTACT:organizer`,
String.raw`DESCRIPTION:news flash\nPeior amicitia texo. Delectus sequi qui temporibus`,
String.raw`  clibanus. Creber creo adamo aedificium creta bardus aegre.\ntime `,
String.raw` details\nEnds at location\; end.\nhttps://shift2bikes.org/calendar/event-`,
String.raw` 202`,
String.raw`LOCATION:location\, name.\n<address>\nlocation && details`,
String.raw`STATUS:CONFIRMED`,
String.raw`DTSTART:20020803T020000Z`,
String.raw`DTEND:20020803T030000Z`,
String.raw`CREATED:19930728T213900Z`,
String.raw`DTSTAMP:19930828T090700Z`,
String.raw`SEQUENCE:2`,
String.raw`URL:https://shift2bikes.org/calendar/event-202`,
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

const canceled1 = [
String.raw`BEGIN:VEVENT`,
String.raw`UID:event-201@shift2bikes.org`,
String.raw`SUMMARY:CANCELLED: ride 2 title`,
String.raw`CONTACT:organizer`,
String.raw`DESCRIPTION:news flash\nPeior amicitia texo. Delectus sequi qui temporibus`,
String.raw`  clibanus. Creber creo adamo aedificium creta bardus aegre.\ntime `,
String.raw` details\nEnds at location\; end.\nhttps://shift2bikes.org/calendar/event-`,
String.raw` 201`,
String.raw`LOCATION:location\, name.\n<address>\nlocation && details`,
String.raw`STATUS:CANCELLED`,
String.raw`DTSTART:20020802T020000Z`,
String.raw`DTEND:20020802T030000Z`,
String.raw`CREATED:19930728T213900Z`,
String.raw`DTSTAMP:19930828T090700Z`,
String.raw`SEQUENCE:2`,
String.raw`URL:https://shift2bikes.org/calendar/event-201`,
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

// ---------------------------------------------
const options = {};

const restApi = {
  crawl() {
    throw new Error("legacy event not supported via the rest api");
  },
  eventList() {
    return `/api/${options.version}/events.${options.format}`;
  },
  eventSeries(seriesId, secret)  {
    return {
      path: `/api/${options.version}/events/${seriesId}.${options.format}`,
      query: {secret}
    };
  },
  eventDay(series, ymd) {
    return `/api/${options.version}/events/${series}/${ymd}.${options.format}`;
  },
  eventRange(start, end) {
    return {
      path: `/api/${options.version}/events.${options.format}`,
      query: {s: start, e: end}
    };
  },
  count(s, e) {
    return {
      path: "/api/v2/count.json",
      query: { s, e }
    };
  },
  search(query) {
    return {
      path: `/api/${options.version}/search.${options.format}`,
      query,
    };
  },
  eventInstance(pkid) {
    // legacy: generates a redirect
    return `/api/${options.version}/legacy/${pkid}.${options.format}`;
  },
};
const phpApi = {
  calList() {
    return "/api/ical.php";
  },
  calSeries(seriesId)  {
    return {
      path: "/api/ical.php",
      query: {id: seriesId},
    }
  },
  calInstance(pkid) {
    return {
      path: "/api/ical.php",
      query: {event_id: pkid},
    }
  },
  calRange(startdate, enddate, filename = undefined) {
    return {
      path: "/api/ical.php",
      query: {startdate, enddate, filename}
    };
  },
  count(s, e) {
    return {
      path: '/api/ride_count.php',
      query: { s, e }
    };
  },
  crawl(id) {
    return {
     path: "/api/crawl.php",
     query: {id}
    }
  },
  eventInstance(pkid) {
    return {
      path: "/api/events.php",
      query: {id: pkid}
    };
  },
  eventList() {
    return "/api/events.php";
  },
  eventRange(start, end) {
    return {
      path: "/api/events.php",
      query: {startdate: start, enddate: end}
    };
  },
  retrieve(id, secret)  {
    return {
      path: '/api/retrieve_event.php',
      query: {id, secret},
    }
  },
  search(query) {
    return {
      path: "/api/search.php",
      query,
    };
  }
};

const test = {
  secret,
  email,
  api: null, // the endpoints. errors if used w/o configure

  // todo: figure out how to link this into the sandbox/sandbox.reset
  configure(version, format) {
    options.version = version;
    options.format = format;
    test.api = version === "v2"  ? restApi :
               version === "v1"  ? phpApi :
               null;
  },
  expectOkay(res) {
    const types = {
      json: /json/,
      html: /html/,
      ical: /^text\/calendar/,
    };
    const fmt = options.format;
    if (fmt) {
      const expectedType = types[fmt];
      if (!expectedType) {
        throw new Error(`test requested an unknown format '${fmt}'`)
      }
      assert.match(res.header['content-type'], expectedType);
    }
    // crawl sends html and doesn't set the api version.
    if (fmt !== 'html') {
      assert.match(res.header['api-version'] || "missing api version", /^3\./);
    }
    assert.equal(res.status, 200);
    return res;
  },
  // helper for testing the calendar's custom error message format.
  expectError(res, field) {
    assert.equal(res.status, 400);
    assert.match(res.header['content-type'], /json/);
    assert.match(res.header['api-version']  || "missing api version", /^3\./);
    assert.ok(res.body?.error?.message);
    assert.ok(!field || res.body.error.fields[field]);
    return res;
  },
  // create a fake database of cal events and dailies:
  fakeNow(sinon) {
    // fake now to be 5th day of august 2002
    sinon.stub(dt, 'getNow').callsFake(() => {
      return dt.fromYMDString('2002-08-05');
    });
  },
  // changes how absolute urls are generated
  fakeSiteUrl(sinon, path) {
    sinon.stub(config.site, 'url').callsFake((...parts) => {
      return [path, ...parts].join("/");
    });
  },
  setupImageDir(sinon, path) {
    sinon.replace(config.image, 'dir', path);
  },
  // p can be a string or {path, query}
  GET(p) {
    // console.log("get", JSON.stringify(p));
    return request(app).get(p.path || p).query(p.query || {});
  },
  DELETE(p, data, form = true) {
    const q = Object.assign( {}, p.query, {_method: "DELETE"} );
    return test.POST({
      path: p.path || p,
      query: q,
    }, data, form);
  },
  POST(p, data, form = true) {
    // console.log("post", JSON.stringify(p));
    const req = request(app)
      .post(p.path || p)
      .query(p.query || {});
    return !form ?
      req.send(data) :
      req.type('form').send({
        json: JSON.stringify(data)
      });
  },
  // ical data:
  pedalpaloozaFeed,
  cancelledDay,
  emptyRange,
  allEvents
};

module.exports = test;
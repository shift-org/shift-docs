const chai = require('chai');
const sinon = require('sinon');
const app = require("../app");
const testData = require("./testData");
const testdb = require("./testdb");

const { CalEvent } = require("../models/calEvent");
const { CalDaily } = require("../models/calDaily");
const { EventStatus } = require("../models/calConst");

chai.use(require('chai-http'));
const expect = chai.expect;

describe("ical feed", () => {
  // runs before the evt test in this block.
  before(function() {
    testData.stubData(sinon);
    return testdb.setup();
  });
  // runs once after the last test in this block
  after(function () {
    sinon.restore();
    return testdb.destroy();
  });
  const expectsServerError = function(q) {
    return function(done) {
      chai.request( app )
        .get('/api/ical.php')
        .query(q)
        .end(function (err, res) {
          expect(err).to.be.null;
          expect(res).to.have.status(400);
          done();
        });
    };
  };
  it("errors on an invalid id", expectsServerError({
      id: 999
    }));
  it("errors on an invalid date", expectsServerError({
      // date time formats have been loosened ( #ff5ae63 )
      // clearly invalid dates are still rejected.
      startdate: "apple",
      enddate  : "sauce",
      // startdate: "2002/05/06",
      // enddate  : "2002/05/06",
    }));
  it("errors on too large a range", expectsServerError({
      startdate: "2002-01-01",
      enddate  : "2003-01-01",
    }));
  it("errors on a negative range", expectsServerError({
      startdate: "2003-01-01",
      enddate  : "2002-01-01",
    }));
  it("errors too many parameters", expectsServerError({
      id: 2,
      startdate: "2002-08-01",
      enddate  : "2002-08-02",
    }));
  it("supports an 'all events' feed", function(done) {
    chai.request( app )
      .get('/api/ical.php')
      .end(function (err, res) {
        // now() is set by testData to 2002-08-05
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        // test that it also has an api version
        // that exists everywhere, but only tested here.
        expect(res).to.have.header('Api-Version');
        // not quite sure the proper way to test this.
        // expect(res).to.have.header('content-type', 'text/calendar');
        expect(res.text).to.equal(allEvents);
        done();
      });
  });
  it("provides the days of a single event", function(done) {
    chai.request( app )
      .get('/api/ical.php')
      .query({
         id: 2, // an event id
       })
      .end(function (err, res) {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        // expect(res).to.have.header('content-type', 'text/calendar');
        expect(res.text).to.equal(allEvents);
        done();
      });
  });
  it("provides a range of days", function(done) {
    chai.request( app )
      .get('/api/ical.php')
      .query({
         startdate: "2002-08-01",
         enddate  : "2002-08-02",
       })
      .end(function (err, res) {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        // expect(res).to.have.header('content-type', 'text/calendar');
        done();
      });
  });
  it("can return an empty range", function(done) {
    chai.request( app )
      .get('/api/ical.php')
      .query({
         startdate: "2002-01-01",
         enddate  : "2002-01-02",
       })
      .end(function (err, res) {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        // expect(res).to.have.header('content-type', 'text/calendar');
        expect(res.text).to.equal(emptyRange);
        done();
      });
  });
  it("has a special pedalpalooza feed", function(done) {
     chai.request( app )
      .get('/api/ical.php')
      .query({
         startdate: "2002-08-01",
         enddate  : "2002-08-02",
         filename : "pedalpalooza-2024.ics",
       })
      .end(function (err, res) {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        // expect(res).to.have.header('content-type', 'text/calendar');
        expect(res.text).to.equal(pedalpaloozaFeed);
        done();
      });
  });
  it("can handle a canceled event", function(done) {
    CalEvent.getByID(2).then(evt => {
      // todo: create a separate test where these values are nil and zero.
      // that had caused a bad feed at one point; its fixed but still good to test.
      // evt.eventtime = null;
      // evt.eventduration = 0;
      evt._store().then(_ => {
        CalDaily.getForTesting(201).then(d => {
          d.eventstatus = EventStatus.Cancelled;
          d._store().then(_ => {
            chai.request( app )
              .get('/api/ical.php')
              .query({
                 id: 2, // an event id
               })
              .end(function (err, res) {
                expect(err).to.be.null;
                expect(res).to.have.status(200);
                expect(res.text).to.equal(cancelledDay);
                done();
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
String.raw`DESCRIPTION:Quis ex cupidatat pariatur cillum pariatur esse id magna sit `,
String.raw` ipsum duis elit.\ntime details\nEnds at location\; `,
String.raw` end.\nhttp://localhost:3080/calendar/event-201`,
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
String.raw`DESCRIPTION:Quis ex cupidatat pariatur cillum pariatur esse id magna sit `,
String.raw` ipsum duis elit.\ntime details\nEnds at location\; `,
String.raw` end.\nhttp://localhost:3080/calendar/event-202`,
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
String.raw`SUMMARY:ride 2 title`,
String.raw`CONTACT:organizer`,
String.raw`DESCRIPTION:Quis ex cupidatat pariatur cillum pariatur esse id magna sit `,
String.raw` ipsum duis elit.\ntime details\nEnds at location\; `,
String.raw` end.\nhttp://localhost:3080/calendar/event-201`,
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

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
  it("can handle a canceled event", function(done) {
    CalEvent.getByID(2).then(evt => {
      // maybe its just test data, but these are null
      // in the mysql data that i have;
      // and they generated bad caldata as a result.
      // ( while the php works fine )
      evt.eventtime = null;
      evt.eventduration = 0;
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


const allEvents = [
String.raw`BEGIN:VCALENDAR`,
String.raw`VERSION:2.0`,
String.raw`PRODID:-//shift2bikes.org//NONSGML shiftcal v2.1//EN`,
String.raw`METHOD:PUBLISH`,
String.raw`X-WR-CALNAME:Shift Bike Calendar`,
String.raw`X-WR-CALDESC:Find fun bike events and make new friends!`,
String.raw`X-WR-RELCALID:shift@shift2bikes.org`,
String.raw`BEGIN:VEVENT`,
String.raw`UID:event-201@shift2bikes.org`,
String.raw`SUMMARY:ride 2 title`,
String.raw`CONTACT:organizer`,
String.raw`DESCRIPTION:news flash\nQuis ex cupidatat pariatur cillum pariatur esse id`,
String.raw`  magna sit ipsum duis elit.\ntime details\nEnds at location\; `,
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
String.raw`BEGIN:VEVENT`,
String.raw`UID:event-202@shift2bikes.org`,
String.raw`SUMMARY:ride 2 title`,
String.raw`CONTACT:organizer`,
String.raw`DESCRIPTION:news flash\nQuis ex cupidatat pariatur cillum pariatur esse id`,
String.raw`  magna sit ipsum duis elit.\ntime details\nEnds at location\; `,
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
String.raw`END:VCALENDAR`,
"" // trailing new line. i think.
].join("\r\n");


const emptyRange = [
String.raw`BEGIN:VCALENDAR`,
String.raw`VERSION:2.0`,
String.raw`PRODID:-//shift2bikes.org//NONSGML shiftcal v2.1//EN`,
String.raw`METHOD:PUBLISH`,
String.raw`X-WR-CALNAME:Shift Bike Calendar`,
String.raw`X-WR-CALDESC:Find fun bike events and make new friends!`,
String.raw`X-WR-RELCALID:shift@shift2bikes.org`,
String.raw`END:VCALENDAR`,
"" // trailing new line. i think.
].join("\r\n");



const cancelledDay = [
String.raw`BEGIN:VCALENDAR`,
String.raw`VERSION:2.0`,
String.raw`PRODID:-//shift2bikes.org//NONSGML shiftcal v2.1//EN`,
String.raw`METHOD:PUBLISH`,
String.raw`X-WR-CALNAME:Shift Bike Calendar`,
String.raw`X-WR-CALDESC:Find fun bike events and make new friends!`,
String.raw`X-WR-RELCALID:shift@shift2bikes.org`,
String.raw`BEGIN:VEVENT`,
String.raw`UID:event-201@shift2bikes.org`,
String.raw`SUMMARY:CANCELLED: ride 2 title`,
String.raw`CONTACT:organizer`,
String.raw`DESCRIPTION:news flash\nQuis ex cupidatat pariatur cillum pariatur esse id`,
String.raw`  magna sit ipsum duis elit.\ntime details\nEnds at location\; `,
String.raw` end.\nhttp://localhost:3080/calendar/event-201`,
String.raw`LOCATION:location\, name.\n<address>\nlocation && details`,
String.raw`STATUS:CANCELLED`,
String.raw`DTSTART:20020801T190000Z`,
String.raw`DTEND:20020801T200000Z`,
String.raw`CREATED:19930728T213900Z`,
String.raw`DTSTAMP:19930828T090700Z`,
String.raw`SEQUENCE:2`,
String.raw`URL:http://localhost:3080/calendar/event-201`,
String.raw`END:VEVENT`,
String.raw`BEGIN:VEVENT`,
String.raw`UID:event-202@shift2bikes.org`,
String.raw`SUMMARY:ride 2 title`,
String.raw`CONTACT:organizer`,
String.raw`DESCRIPTION:news flash\nQuis ex cupidatat pariatur cillum pariatur esse id`,
String.raw`  magna sit ipsum duis elit.\ntime details\nEnds at location\; `,
String.raw` end.\nhttp://localhost:3080/calendar/event-202`,
String.raw`LOCATION:location\, name.\n<address>\nlocation && details`,
String.raw`STATUS:CONFIRMED`,
String.raw`DTSTART:20020802T190000Z`,
String.raw`DTEND:20020802T200000Z`,
String.raw`CREATED:19930728T213900Z`,
String.raw`DTSTAMP:19930828T090700Z`,
String.raw`SEQUENCE:2`,
String.raw`URL:http://localhost:3080/calendar/event-202`,
String.raw`END:VEVENT`,
String.raw`END:VCALENDAR`,
"" // trailing new line. i think.
].join("\r\n");

const chai = require('chai');
const sinon = require('sinon');
const app = require("../app");
const testData = require("./testData");

chai.use(require('chai-http'));
const expect = chai.expect;

describe("ical feed", () => {
  // create a pool of fake calendar data:
  let data;
  // runs before the evt test in this block.
  before(function() {
    data = testData.stubData(sinon);
  });
  // runs once after the last test in this block
  after(function () {
    sinon.restore();
  });
  const expectsServerError = function(q) {
    return function(done) {
      chai.request( app )
        .get('/api/ical.php')
        .query(q)
        .end(function (err, res) {
          expect(err).to.be.null;
          expect(res).to.have.status(500);
          done();
        });
    };
  };
  it("errors on an invalid id", expectsServerError({
      id: 999
    }));
  it("errors on an invalid date", expectsServerError({
      startdate: "2002/05/06",
      enddate  : "2002/05/06",
    }));
  it("errors on too large a range", expectsServerError({
      startdate: "2002-01-01",
      enddate  : "2003-01-01",
    }));
  it("errors on a negative range", expectsServerError({
      startdate: "2003-01-01",
      enddate  : "2002-01-01",
    }));
  it("supports an 'all events' feed", function(done) {
    chai.request( app )
      .get('/api/ical.php')
      .end(function (err, res) {
        // now() is set by testData to 2002-08-05
        expect(err).to.be.null;
        expect(res).to.have.status(200);
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
String.raw`UID:evt-201@shift2bikes.org`,
String.raw`SUMMARY:ride 2 title`,
String.raw`CONTACT:organizer`,
String.raw`DESCRIPTION:Quis ex cupidatat pariatur cillum pariatur esse id magna sit`,
String.raw` ipsum duis elit.\ntime details\nEnds at location\;`,
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
String.raw`UID:evt-202@shift2bikes.org`,
String.raw`SUMMARY:ride 2 title`,
String.raw`CONTACT:organizer`,
String.raw`DESCRIPTION:Quis ex cupidatat pariatur cillum pariatur esse id magna sit`,
String.raw` ipsum duis elit.\ntime details\nEnds at location\;`,
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

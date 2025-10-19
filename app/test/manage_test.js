// some possible tests:
// - delete an unpublished event.
// - explicitly cancel an event.
// - resurrect dates from a canceled event.
// - test email output.
// x manage invalid id
// x empty; invalid secret
// x missing required fields (ex. code of conduct, etc.)
// x create a new event
// x update a hidden event to publish it
// x add / cancel dates from a published event
// x raw json ( curl ) vs body json ( forms )
// x multi-part form ( attach image )
const fs = require('fs');
const fsp = fs.promises;
const path = require('node:path');
//
const app = require("../app");
const config = require("../config");
const db = require("../knex");
const testdb = require("./testdb");
const testData = require("./testData");
//
const CalEvent = require("../models/calEvent");
const { EventStatus } = require("../models/calConst");

const chai = require('chai');
chai.use(require('chai-http'));
const expect = chai.expect;
const manage_api = '/api/manage_event.php';

// used for getting private data from the db
const privateOptions = {
  includePrivate: testData.secret,
};

describe("managing events", () => {
  // reset after each one.
  beforeEach(() => {
    return testdb.setup();
  });
  afterEach(function () {
    return testdb.destroy();
  });
  it("errors on an invalid id", () => {
    return chai.request( app )
      .post(manage_api)
      .type('form')
      .send({
        json: JSON.stringify({
          id: 999,
        })
      })
      .then(function(res) {
        testData.expectError(expect, res);
      });
  });
  it("creates a new event, using raw json", () => {
    return chai.request( app )
      .post(manage_api)
      .send(eventData)
      .then(async (res) => {
        expect(res).to.have.status(200);
        //
        const id = res.body.id;
        const events = await testdb.findSeries(id);
        // there are 2 days in the posted data
        expect(events).to.have.lengthOf(2);
        const [ evt ] = events;
        expect(evt.hidden).to.equal(1, "should be hidden by default");
      });
  });
  it("fail creation when missing required fields", function(){
    // each time substitute a field value that should fail
    const pairs = [
      "title", "",
      "details", null,
      "venue", "    ",
      "address", null,
      "organizer", null,
      "code_of_conduct", null,
      "read_comic", null,
      "code_of_conduct", "invalid",
      "read_comic", "0",
      "email", null,
      "email", "i am not an email",
    ];
    let seq = Promise.resolve(""); // something to kick off the sequences.
    for (let i=0; i< pairs.length; i+=2) {
      const key = pairs[i];
      const value = pairs[i+1];
      const post = Object.assign({}, eventData);
      post[key] = value;
      seq = seq.then(_ => {
        return chai.request( app )
        .post(manage_api)
        .send(post)
        .then(function (res) {
          expect(res, `expected failure for '${key}'`).to.have.status(400);
          expect(res.body.error.fields).to.have.key(key);
        });
      })
    }
    return seq;
  });

  it("fails creation when fields have invalid values", function(){
    const pairs = [
      "eventduration", "i am not a number, i am a man!",
      // converting directly toInt will ignore trailing text
      // so verify that this fails as expected.
      "eventduration", "42beep",
      "eventduration", "-12",
      "eventduration", -12,
      "hideemail", "wants bool",
      "hidephone", 42,
      "loopride", "wants bool",
      "datestype", "a long string",
      "area", 23,
    ];
    let seq = Promise.resolve(""); // something to kick off the sequences.
    for (let i=0; i< pairs.length; i+=2) {
      const key = pairs[i];
      const value = pairs[i+1];
      const post = Object.assign({}, eventData);
      post[key] = value;
      seq = seq.then(_ => {
        return chai.request( app )
        .post(manage_api)
        .send(post)
        .then(function (res) {
          expect(res, `expected failure for '${key}'`).to.have.status(400);
          expect(res.body.error.fields).to.have.key(key);
        });
      })
    }
    return seq;
  });
  it("publishes an event", () => {
    return testdb.findSeries(3).then(events => {
      const evt = events[0];
      // id 3 starts unpublished
      expect(evt.hidden, 1);
       // by posting some valid event data
      // we should be able to publich it
      return chai.request( app )
        .post(manage_api)
        .send(Object.assign({
          id: 3,
          secret: testData.secret,
        }, eventData))
        .then(async (res) => {
          expect(res).to.have.status(200);
          // because the client sends it, it shouldn't need this id back
          // but... currently... the client does require it.
          expect(res.body).property('id', 3);
          // we also don't really have to send this
          // a simple http 200 would be enough. future work maybe.
          expect(res.body).property('published', true);
          // 
          const events = await testdb.findSeries(3);
          const evt = events[0];
          expect(evt.hidden).to.equal(0, "the event should be published");
          expect(events.length).to.equal(2, "should have published two days");
          // look over the days we requested
          // to validate what wound up in the db.
          statusData.forEach((requested, i) => {
            const evt = events[i]; // raw db data
            // one of our requested newsflashes is missing;
            // that should result in a null database value.
            expect(evt.newsflash).to.equal(requested.newsflash || null, `news mismatch ${i}`);
            expect(evt.eventdate).to.equal(requested.date, `date mismatch ${i}`);
            expect(evt.eventstatus).to.equal(requested.status, `status mismatch ${i}`);
          });
        });
    });
  });
  it("fails to use an empty secret", function(){
    return chai.request( app )
      .post(manage_api)
      .send(Object.assign({
        id: 3,
        // not sending any secret
      }, eventData))
      .then(function(res) {
        testData.expectError(expect, res);
      });
  });
  it("fails to use an invalid secret", function(){
    return chai.request( app )
      .post(manage_api)
      .send(Object.assign({
        id: 3, // reverses the secret:
        secret: testData.secret.split("").reverse().join(""),
      }, eventData))
      .then(function(res) {
        testData.expectError(expect, res);
      });
  });
  it("adds one date and removes another", function(){
    return testdb.findSeries(2).then(events => {
      expect(events).to.have.lengthOf(2);
      const evt = events[0];
      const post = Object.assign( {
        secret: testData.secret,
        code_of_conduct: "1",
        read_comic: "1",
        datestatuses : [
        // keep the first date;
        { "date": "2002-08-01", status: 'A' },
        // implicitly cancel the second;
        // add a third.
        { "date": "2002-08-03", status: 'A' }
      ]}, CalEvent.getOverview(evt, privateOptions));

      return chai.request( app )
        .post(manage_api)
        .type('form')
        .send({
          json: JSON.stringify(post)
        })
        .then(async (res) => {
          expect(res).to.have.status(200);
          // three dailies for our event are in the db:
          const events = await testdb.findSeries(2);
          expect(events).to.have.lengthOf(3);
          const [ d0, d1, d2 ] = events;
          expect(d0.eventdate).to.equal("2002-08-01");
          expect(d0.eventstatus).to.equal(EventStatus.Active);
          
          expect(d1.eventdate).to.equal("2002-08-02");
          expect(d1.eventstatus).to.equal(EventStatus.Delisted);

          expect(d2.eventdate).to.equal("2002-08-03");
          expect(d2.eventstatus).to.equal(EventStatus.Active);
        });
    });
  });
  function getImageTarget(id, imageSource) {
    return path.join( config.image.dir, id + path.extname(imageSource) );
  };
  function postImage(id, imageSource, imageTarget) {
    // remove any image from earlier tests:
    return fsp.rm(imageTarget, {force:true}).then(_ => {
      // act as if we are a client who just created an event
      // and is posting it back up again, along with the new image.
      return testdb.findSeries(3).then(events => {
        const evt = events[0];
        const post = Object.assign({
          secret: testData.secret,
          code_of_conduct: "1",
          read_comic: "1",
        }, CalEvent.getOverview(evt, {includePrivate: true}));
        return chai.request( app )
          .post(manage_api)
          .type('form')
          .field({
            json: JSON.stringify(post)
          })
          // the tests originally based a filepath here
          // but that started generating EPIPE errors for reasons.
          .attach('file', fs.readFileSync(imageSource), path.basename(imageSource));
      });
    });
  }
  it("attaches an image", function(){
    const imageSource = path.join( config.image.dir, "bike.jpg" );
    const imageTarget = getImageTarget(3, imageSource);
    return postImage(3, imageSource, imageTarget).then(function (res) {
      expect(res).to.have.status(200);
      //
      testdb.findSeries(3).then(events => {
        const evt = events[0];
        // event creation is change 1,
        // the image post is change 2,
        // the event id is 3.
        expect(evt.image, "image names should have a sequence number")
          .to.equal("3-2.jpg");
        //
        const imageTarget = getImageTarget(3, imageSource);
        return fsp.stat(imageTarget); // rejects if it doesn't exist on disk.
      });
    });
  });
  it("fails too large", function(){
    const imageSource = path.join( config.image.dir, "bike-big.png" );
    const imageTarget = getImageTarget(3, imageSource);
    return postImage(3, imageSource, imageTarget).then(function (res) {
      testData.expectError(expect, res, 'image');
      return fsp.stat(imageTarget)
        .then(_ => {
          chai.assert(false, `didn't expect ${imageTarget} to exists`);
        })
        .catch(_ => {
          chai.assert(true);
        });
    });
  });
  it("fails bad format", function(){
    const imageSource = path.join( config.image.dir, "bike-bad.tiff" );
    const imageTarget = getImageTarget(3, imageSource);
    return postImage(3, imageSource, imageTarget).then(function (res) {
      testData.expectError(expect, res, 'image');
      return fsp.stat(imageTarget)
        .then(_ => {
          chai.assert(false, `didn't expect ${imageTarget} to exists`);
        })
        .catch(_ => {
          chai.assert(true);
        });
    });
  });
  it("prevents image upload on new events", function(){
    const imageSource = path.join( config.image.dir, "bike.jpg" );
    // follows from "creates a new event" which would normally succeed
    // only we attach an image and it should fail because that's diallowed.
    return chai.request( app )
      .post(manage_api)
      .type('form')
      .field({
        json: JSON.stringify(eventData)
      })
      .attach('file', fs.readFileSync(imageSource), path.basename(imageSource))
      .then(async function (res) {
        expect(res).to.have.status(400);
        expect(res.body.error.fields).to.have.key('image');
      });
  });
});

// some days to request
const statusData = [{
  date: "2023-05-24",
  status: EventStatus.Active,
},{
  date: "2023-05-26",
  status: EventStatus.Cancelled,
  newsflash: "not the news",
}];

// minimal json for pushing a new event
const eventData = {
  "title": "new event",
  "details": "some details",
  "venue": "the secret hideout",
  "address": "the location of the secret hideout",
  "organizer": "js test",
  "email": "test@example.com",
  "code_of_conduct": "1",
  "read_comic": "1",
  "time": "3:15 PM", // time is sent with meridian for some reason.
  // currently, these aren't actually needed...
  // tbd: maybe it should require at least one when creating an event?
  "datestatuses": statusData
};

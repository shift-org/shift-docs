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

const fsp = require('fs').promises;
const fs = require('fs');
const path = require('node:path');
const sinon = require('sinon');
const app = require("../app");
const config = require("../config");
const testdb = require("./testdb");
const testData = require("./testData");

const { CalEvent } = require("../models/calEvent");
const { CalDaily } = require("../models/calDaily");

const chai = require('chai');
chai.use(require('chai-http'));
const expect = chai.expect;
const manage_api = '/api/manage_event.php';

describe("managing events", () => {
  let data;
  // reset after each one.
  beforeEach(function() {
    data = testData.stubData(sinon);
    return testdb.setup();
  });
  afterEach(function () {
    sinon.restore();
    return testdb.destroy();
  });
  it("errors on an invalid id", function() {
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
  it("creates a new event, using raw json", function(){
    return chai.request( app )
      .post(manage_api)
      .send(eventData)
      .then(async function (res) {
        expect(res).to.have.status(200);
        expect(data.eventStore.callCount, "event stores")
          .to.equal(1);
        expect(data.dailyStore.callCount, "daily store")
          .to.equal(2);

        const id = res.body.id;
        const evt = await CalEvent.getByID(id);
        expect(evt.hidden, "the initial event should be hidden by default")
          .to.equal(1);
        // console.log(res.body);
      });
  });

  it("fail creation when missing required fields", function(){
    // each time substitute a field value that should fail
    let pairs = [
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
    let pairs = [
      "eventduration", "i am not a number, i am a man!",
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

  it("publishes an event", function() {
    // id three is unpublished
    return CalEvent.getByID(3).then(evt => {
      expect(evt.isPublished()).to.be.false;
      return chai.request( app )
        .post(manage_api)
        // by adding the id and posting to it, we should be able to publish it.
        .send(Object.assign({
          id: 3,
          secret: testData.secret,
        }, eventData))
        .then(async function (res) {
          expect(res).to.have.status(200);
          expect(data.eventStore.callCount, "event stores")
            .to.equal(1);
          const evt = await CalEvent.getByID(3);
          expect(evt.isPublished()).to.be.true;
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
    return CalEvent.getByID(2).then(evt => {
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
      ]}, evt.getJSON({includePrivate:true}));

      return chai.request( app )
        .post(manage_api)
        .type('form')
        .send({
          json: JSON.stringify(post)
        })
        .then(async function (res) {
          expect(res).to.have.status(200);
          expect(data.eventStore.callCount, "event stores")
            .to.equal(1);
          expect(data.dailyStore.callCount, "daily store")
            .to.equal(3);
          // three dailies for our event are in the db:
          const dailies = await CalDaily.getByEventID(2);
          expect(dailies).to.have.lengthOf(3);
          expect(dailies[0].isUnscheduled()).to.be.false;
          expect(dailies[1].isUnscheduled()).to.be.true;
          expect(dailies[2].isUnscheduled()).to.be.false;
          // only two should be in the returned data
          // ( the second one is delisted; filtered by reconcile )
          // fix: should add a test for an explicitly canceled day.
          expect(res.body.datestatuses).to.deep.equal([{
              "id": "201",
              "date": "2002-08-01",
              "status": "A",
              "newsflash": null,
            }, {
              "id": "203", // the new id is one after the last one
              "date": "2002-08-03",
              "status": "A",
              "newsflash": null,
            }
          ]);
        });
    });
  });
  it("attaches an image", function(){
    const imageSource = path.join( config.image.dir, "bike.jpg" );
    const imageTarget = path.join( config.image.dir, "3.jpg" );
    // remove any image from earlier tests:
    return fsp.rm(imageTarget, {force:true}).then(_ => {
      // act as if we are a client who just created an event
      // and is posting it back up again, along with the new image.
      return CalEvent.getByID(3).then(evt => {
        const statuses = CalDaily.getStatusesByEventId(evt.id);
        return evt.getDetails(statuses, {includePrivate:true}).then(eventData => {
          const post = Object.assign( {
            secret: testData.secret,
            code_of_conduct: "1",
            read_comic: "1",
            }, eventData);
          return chai.request( app )
            .post(manage_api)
            .type('form')
            .field({
              json: JSON.stringify(post)
            })
            .attach('file', imageSource, path.basename(imageSource))
            .then(async function (res) {
              // console.log(res.body);
              expect(res).to.have.status(200);
              //
              const evt = await CalEvent.getByID(3);
              // event creation is change 1,
              // the image post is change 2,
              // the event id is 3.
              expect(evt.image, "image names should have a sequence number")
                .to.equal("3-2.jpg");
              //
              return fsp.stat(imageTarget); // rejects if it doesn't exist on disk.
            });
        });
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
      .attach('file', imageSource, path.basename(imageSource))
      .then(function (res) {
        expect(res).to.have.status(400);
        expect(res.body.error.fields).to.have.key('image');
      });
  });
});

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
  "datestatuses": [{
    "date": "2023-05-24",
  },{
    "date": "2023-05-26",
    "newsflash": "not the news",
  }]
}


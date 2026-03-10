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
const sinon = require('sinon');
const app = require("../appEndpoints");
const config = require("../config");
const testdb = require("./testdb");
const testData = require("./testData");

const { CalEvent } = require("../models/calEvent");
const { CalDaily } = require("../models/calDaily");
//
const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const request = require('supertest');
//
const manage_api = '/api/manage_event.php';

describe("managing events", () => {
  let spy;
  // reset after each one.
  beforeEach(() => {
    spy = testData.stubData(sinon);
    return testdb.setupTestData("manage");
  });
  afterEach(() => {
    sinon.restore();
    return testdb.destroy();
  });
  it("errors on an invalid id", () => {
    return request(app)
      .post(manage_api)
      .type('form')
      .send({
        json: JSON.stringify({
          id: 999,
        })
      })
      .then(testData.expectError);
  });
  it("creates a new event, using raw json", () => {
    return request(app)
      .post(manage_api)
      .send(eventData)
      .expect(200)
      .expect('Content-Type', /json/)
      .expect('Api-Version', /^3\./)
      .then(async (res) => {
        assert.equal(spy.eventStore.callCount, 1, "event stores");
        assert.equal(spy.dailyStore.callCount, 2, "daily store");
        spy.resetHistory();

        const id = res.body.id;
        const evt = await CalEvent.getByID(id);
        assert.equal(evt.hidden, 1, "the initial event should be hidden by default");
        // console.log(res.body);
      });
  });
  it("fail creation when missing required fields", () => {
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
        return request(app)
        .post(manage_api)
        .send(post)
        .then(res => testData.expectError(res, key));
      })
    }
    return seq;
  });
  it("fails creation when fields have invalid values", () => {
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
        return request(app)
        .post(manage_api)
        .send(post)
        .then(res => testData.expectError(res, key));
      })
    }
    return seq;
  });
  it("publishes an event", () => {
    // id three is unpublished
    return CalEvent.getByID(3).then(evt => {
      assert.equal(evt.isPublished(), false);
      return request(app)
        .post(manage_api)
        // by adding the id and posting to it, we should be able to publish it.
        .send(Object.assign({
          id: 3,
          secret: testData.secret,
        }, eventData))
        .expect(200)
        .then(async (res) => {
          assert.equal(spy.eventStore.callCount, 1, "event stores");
          spy.resetHistory();
          const evt = await CalEvent.getByID(3);
          assert.equal(evt.isPublished(), true);
        });
    });
  });
  it("fails to use an empty secret", () => {
    return request(app)
      .post(manage_api)
      .send(Object.assign({
        id: 3,
        // not sending any secret
      }, eventData))
      .then(testData.expectError);
  });
  it("fails to use an invalid secret", () => {
    return request(app)
      .post(manage_api)
      .send(Object.assign({
        id: 3, // reverses the secret:
        secret: testData.secret.split("").reverse().join(""),
      }, eventData))
      .then(testData.expectError);
  });
  it("adds one date and removes another", () => {
    return CalEvent.getByID(2).then(evt => {
      //
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
      //
      return request(app)
        .post(manage_api)
        .type('form')
        .send({
          json: JSON.stringify(post)
        })
        .expect(200)
        .then(async (res) => {
          assert.equal(spy.eventStore.callCount, 1, "event stores");
          assert.equal(spy.dailyStore.callCount, 3, "daily store");
          spy.resetHistory();
          // three dailies for our event are in the db:
          const dailies = await CalDaily.getByEventID(2);
          assert.equal(dailies.length, 3);
          assert.equal(dailies[0].isUnscheduled(), false);
          assert.equal(dailies[1].isUnscheduled(), true);
          assert.equal(dailies[2].isUnscheduled(), false);
          // only two should be in the returned data
          // ( the second one is delisted; filtered by reconcile )
          // fix: should add a test for an explicitly canceled day.
          assert.deepEqual(res.body.datestatuses, [{
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
  function getImageTarget(id, imageSource) {
    return path.join( config.image.dir, id + path.extname(imageSource) );
  };
  function postImage(id, imageSource, imageTarget) {
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
          return request(app)
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
    });
  }
  it("attaches an image", () => {
    const imageSource = path.join( config.image.dir, "bike.jpg" );
    const imageTarget = getImageTarget(3, imageSource);
    return postImage(3, imageSource, imageTarget)
      .then(res => {
        assert.equal(res.status, 200);
        return CalEvent.getByID(3).then(evt => {
          // event creation is change 1,
          // the image post is change 2,
          // the event id is 3.
          assert.equal(evt.image, "3-2.jpg", "image names should have a sequence number");
          //
          const imageTarget = getImageTarget(3, imageSource);
          return fsp.stat(imageTarget); // rejects if it doesn't exist on disk.
        });
      });
  });
  it("fails too large", () => {
    const imageSource = path.join( config.image.dir, "bike-big.png" );
    const imageTarget = getImageTarget(3, imageSource);
    return postImage(3, imageSource, imageTarget)
      .then(res => {
        testData.expectError(res, 'image');
        return fsp.stat(imageTarget)
          .then(_ => {
            assert.fail(`didn't expect ${imageTarget} to exists`);
          })
          .catch(_ => {
            assert(true);
          });
    });
  });
  it("fails bad format", () => {
    const imageSource = path.join( config.image.dir, "bike-bad.tiff" );
    const imageTarget = getImageTarget(3, imageSource);
    return postImage(3, imageSource, imageTarget).then(res => {
      testData.expectError(res, 'image');
      return fsp.stat(imageTarget)
        .then(_ => {
          assert.fail(`didn't expect ${imageTarget} to exists`);
        })
        .catch(_ => {
          assert(true);
        });
    });
  });
  it("prevents image upload on new events", () => {
    const imageSource = path.join( config.image.dir, "bike.jpg" );
    // follows from "creates a new event" which would normally succeed
    // only we attach an image and it should fail because that's diallowed.
    return request(app)
      .post(manage_api)
      .type('form')
      .field({
        json: JSON.stringify(eventData)
      })
      .attach('file', fs.readFileSync(imageSource), path.basename(imageSource))
      .then(res => {
        testData.expectError(res, 'image');
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


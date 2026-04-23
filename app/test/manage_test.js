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
const app = require("../appEndpoints");
const config = require("../config");
const testdb = require("./testdb");
const testData = require("./testData");
//
const CalEvent = require("../models/calEvent");
const { EventStatus } = require("../models/calConst");
//
const { describe, it, before, after, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const supertest = require('supertest');
const sandbox = require('sinon').createSandbox();
const manage_api = '/api/manage_event.php';
const db = require('../db');

describe("managing events",  () => {
  // hangs occur if the http requests throw exceptions;
  // using supertest's agent api instead of its 'request' api
  // allows this to call the agent's close
  // which fixes the hang
  // ( calling catch at the end of every promise change would too. )
  // tbd: we don't need to test express itself, so setting up the endpoints for each test
  // is overkill. maybe there's a way to share the agent globally through the testRunner...
  //  "It is possible to apply the same configuration to all files by placing common configuration code in a module preloaded with --require or --import."
  // https://nodejs.org/api/cli.html#-require-module
  // https://nodejs.org/api/cli.html#importmodule
  let agent;
  before(() => {
    const server = app.listen();
    agent = supertest.agent(server);
  });
  after(() => {
    const server = agent.app;
    server.close();
  });
  // reset after each one.
  beforeEach(() => {
    // docker config sets an explicit SHIFT_IMAGE_DIR
    // but tests need the directory under app.
    testData.setupImageDir(sandbox, "./eventimages");
    return testdb.setupTestData("manage");
  });
  afterEach(() => {
    sandbox.restore();
    return testdb.destroy();
  });
  it("errors on an invalid id", () => {
    return agent
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
    return agent
      .post(manage_api)
      .send(eventData)
      .expect(200)
      .expect('Content-Type', /json/)
      .expect('Api-Version', /^3\./)
      .then(async (res) => {
        assert.equal(res.body?.error?.message, undefined);
        //
        const id = res.body.id;
        const events = await testdb.findSeries(id);
        // there are 2 days in the posted data
        assert.equal(events.length, 2);
        const [ evt ] = events;
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
        return agent
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
      "area", 23,
    ];
    let seq = Promise.resolve(""); // something to kick off the sequences.
    for (let i=0; i< pairs.length; i+=2) {
      const key = pairs[i];
      const value = pairs[i+1];
      const post = Object.assign({}, eventData);
      post[key] = value;
      seq = seq.then(_ => {
        return agent
        .post(manage_api)
        .send(post)
        .then(res => testData.expectError(res, key));
      })
    }
    return seq;
  });
  it("publishes an event", () => {
    return testdb.findSeries(3).then(events => {
      const evt = events[0];
      // id 3 starts unpublished
      assert.equal(evt.hidden, 1);
      // by posting some valid event data
      // we should be able to publish it
      return agent
        .post(manage_api)
        .send(Object.assign({
          id: 3,
          secret: testData.secret,
        }, eventData))
        .expect(200)
        .then(async (res) => {
          // first, validate the response
          // because the client sends it, it shouldn't need this id back
          // but... currently... the client does require it.
          assert.equal(res.body?.id, '3'); // the ids are sent back as strings.
          // we also don't really have to send this
          // a simple http 200 would be enough. future work maybe.
          assert.equal(res.body?.published, true);
          //
          const events = await testdb.findSeries(3);
          const evt = events[0];
          assert.equal(evt.hidden, 0, "the event should be published");
          assert.equal(events.length, 2, "should have published two days");
          // look over the days we requested
          // to validate what wound up in the db.
          statusData.forEach((requested, i) => {
            const evt = events[i]; // raw db data
            // one of our requested newsflashes is missing;
            // that should result in a null database value.
            assert.equal(evt.newsflash, requested.newsflash || null, `news mismatch ${i}`);
            assert.equal(evt.eventdate, requested.date, `date mismatch ${i}`);
            assert.equal(evt.eventstatus, requested.status, `status mismatch ${i}`);
          });
        });
    });
  });
  it("fails to use an empty secret", () => {
    return agent
      .post(manage_api)
      .send(Object.assign({
        id: 3,
        // not sending any secret
      }, eventData))
      .then(testData.expectError);
  });
  it("fails to use an invalid secret", () => {
    return agent
      .post(manage_api)
      .send(Object.assign({
        id: 3, // reverses the secret:
        secret: testData.secret.split("").reverse().join(""),
      }, eventData))
      .then(testData.expectError);
  });
  it("adds one date and removes another", ()=> {
    return testdb.findSeries(2).then(events => {
      assert.equal(events.length, 2);
      // 2 2002-08-01  news flash  1 201 2025-11-17 05:50:02
      // 2 2002-08-02  news flash  1 202 2025-11-17 05:50:02
      const evt = events[0];
      const post = Object.assign({
        secret: testData.secret,
        code_of_conduct: "1",
        read_comic: "1",
        datestatuses : [
        // keep the first date ( removes the newsflash )
        { "date": "2002-08-01", status: 'C' },
        // delist the second;
        // .....
        // add a third.
        { "date": "2002-08-03", status: 'A', newsflash: "new!" }
      ]}, CalEvent.getSummary(evt, {includePrivate: true}));
      return agent
        .post(manage_api)
        .type('form')
        .send({
          json: JSON.stringify(post)
        })
        .expect(200)
        .then(async (res) => {
          // three dailies for our event are in the db:
          // but the delisted one is hidden
          const events = await testdb.findSeries(2);
          assert.equal(events.length, 2);
          const [ d0, d2 ] = events;

          assert.equal(d0.eventdate, "2002-08-01");
          assert.equal(d0.eventstatus, EventStatus.Cancelled.key);

          assert.equal(d2.eventdate, "2002-08-03");
          assert.equal(d2.eventstatus, EventStatus.Active.key);
          // fix: should add a test for an explicitly cancelled day.
        });
    });
  });
  function getImageTarget(id, imageSource) {
    return path.join( config.image.dir, id + path.extname(imageSource) );
  }
  function postImage(id, imageSource, imageTarget) {
    // remove any image from earlier tests:
    return fsp.rm(imageTarget, {force: true}).then(_ => {
      // act as if we are a client who just created an event
      // and is posting it back up again, along with the new image.
      return testdb.findSeries(id).then(events => {
        console.log(`found series ${id} ${events}`);
        const evt = events[0];
        const post = Object.assign({
          secret: testData.secret,
          code_of_conduct: "1",
          read_comic: "1",
        }, CalEvent.getSummary(evt, {includePrivate: true}));
        return agent
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
  // FIFOFASDLKJDSKLJFSKLDFJSDFLKJASFLKJSADFLKJASDFLKJASDLKJADSLKJASDLKJDFA
  // THIS TEST IS HANGING ....
  // NOT SURE WHY
  //
  it("attaches and updates images", async () => {
    // posting eventimages/bike.jpg eventimages/3.jpg
    const imageSource = path.join(config.image.dir, "bike.jpg");
    const imageTarget = getImageTarget(3, imageSource);
    // post the image once
    await postImage(3, imageSource, imageTarget)
      .then(testData.expectOkay)
      .then(_ => {
        return testdb.findSeries(3).then(events => {
          const evt = events[0];
          assert.equal(evt.image, "3-1.jpg", "should have a sequence number");
          //
          const imageTarget = getImageTarget(3, imageSource);
          return fsp.stat(imageTarget); // rejects if it doesn't exist on disk.
        });
      });
    // post again to update it
    const altSource = path.join(config.image.dir, "bike.png");
    const altTarget = getImageTarget(3, altSource);
    // posting eventimages/bike.png eventimages/3.png
    console.log("posting", altSource, altTarget);
    await postImage(3, altSource, altTarget)
      .then(testData.expectOkay)
      .then(res => {
        return testdb.findSeries(3).then(events => {
          const evt = events[0];
          assert.equal(evt.image, "3-2.png", "sequence should have incremented");
          //
          const imageTarget = getImageTarget(3, altSource);
          return fsp.stat(altTarget); // rejects if it doesn't exist on disk.
        });
      });
  });
  it("fails too large", () => {
    const imageSource = path.join( config.image.dir, "bike-big.png" );
    const imageTarget = getImageTarget(3, imageSource);
    return postImage(3, imageSource, imageTarget)
      .then(res => {
        testData.expectError(res, 'image');

        // check for the image on disk:
        return fsp.stat(imageTarget)
          .then(_ => {
            // fail if it existed
            assert.fail(`didn't expect ${imageTarget} to exist`);
          })
          .catch(_ => {
            // make sure we get here
            assert.ok(true);
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
          // fail if it existed
            assert.fail(`didn't expect ${imageTarget} to exist`);
        })
        .catch(_ => {
          // make sure we get here
          assert.ok(true);
        });
    });
  });
  it("prevents image upload on new events", () => {
    const imageSource = path.join( config.image.dir, "bike.jpg" );
    // follows from "creates a new event" which would normally succeed
    // only we attach an image and it should fail because that's diallowed.
    return agent
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

// some days to request
const statusData = [{
  date: "2023-05-24",
  status: "A",
},{
  date: "2023-05-26",
  status: "C",
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
  "audience": "G",
  "area": "P",
  // currently, these aren't actually needed...
  // tbd: maybe it should require at least one when creating an event?
  "datestatuses": statusData
};

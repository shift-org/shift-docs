// some possible tests:
// - delete an unpublished event.
// - resurrect dates from a canceled event.
// - use sinon to count the number of email calls; test 1 for each create; 0 for each update
// x explicitly cancel an day.
// x test email output.
// x manage invalid id
// x empty; invalid secret
// x missing required fields (ex. code of conduct, etc.)
// x create a new event
// x update a hidden event to publish it
// x add / cancel dates from a published event
// x raw json ( curl ) vs body json ( forms )
// x multi-part form ( attach image )
const assert = require("node:assert/strict");
const { describe, it, before, after, beforeEach, afterEach } = require("node:test");
const fs = require('node:fs');
const fsp = fs.promises;
const path = require('node:path');
const sandbox = require('sinon').createSandbox();
const { faker } = require('@faker-js/faker');
const emailer = require("server/support/emailer");
const misc = require('server/util/misc');
//
const config = require('server/core/config');
const db = require('server/core/db');
const DailyData = require("server/model/dailyData");
const EventData = require("server/model/eventData");
const { EventStatus } = require("server/model/shorthands");
//
const testdb = require("../v2data");
const testData = require("../testData");
//
const request = require('supertest');
const app = require("shift-docs/appEndpoints");

describe("v2 managing events",  () => {
  let getMostRecentlySentEmail;
  // reset after each one.
  beforeEach(() => {
    testData.configure("v2", "json");
    // docker config sets an explicit SHIFT_IMAGE_DIR
    // but tests need the directory under app.
    testData.setupImageDir(sandbox);
    testData.fakeSiteUrl(sandbox);
    // listen to email sending.
    // requires callers to use emailer.sendMail()
    sandbox.stub(emailer, 'sendMail').callsFake(email => {
      getMostRecentlySentEmail = email;
    }).callThrough();
    // temporarily replace the secret generation
    // requires callers to use misc.newSecret()
    sandbox.stub(misc, 'newSecret').callsFake(_ => {
      return faker.string.uuid().replaceAll("-", "");
    });
    return testdb.setupTestData("manage");
  });
  afterEach(() => {
    testData.configure();
    sandbox.restore();
    return testdb.destroy();
  });
  it("errors on an invalid id", () => {
    // handled by updateExistingEvent()
    const manage_api = "/api/v2/events/999";
    return request(app)
      .post(manage_api)
      .type('form')
      .send({
        json: JSON.stringify({
          id: 999,
          secret: testData.secret,
        })
      })
      .then(testData.expectError);
  });
  it("creates a new event, using raw json", () => {
    // handled by createNewEvent()
    const manage_api = "/api/v2/events";
    return request(app)
      .post(manage_api)
      .send(eventData)
      .then(testData.expectOkay)
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
        assert.deepStrictEqual(getMostRecentlySentEmail, testData.createdEmail);
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
        // handled by createNewEvent()
        const manage_api = "/api/v2/events";
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
      // new data doesnt have "datestype"
      "area", 23,
    ];
    let seq = Promise.resolve(""); // something to kick off the sequences.
    for (let i=0; i< pairs.length; i+=2) {
      const key = pairs[i];
      const value = pairs[i+1];
      const post = Object.assign({}, eventData);
      post[key] = value;
      seq = seq.then(_ => {
        // handled by createNewEvent()
        const manage_api = "/api/v2/events";
        return request(app)
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
      // by posting to we should be able to publish it
      // handled by updateExistingEvent()
      const manage_api = "/api/v2/events/3";
      return request(app)
        .post(manage_api)
        .send(Object.assign({
          id: 3,
          secret: testData.secret,
        }, eventData))
        .then(testData.expectOkay)
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
    // handled by updateExistingEvent()
    const manage_api = "/api/v2/events/3";
    return request(app)
      .post(manage_api)
      .send(Object.assign({
        id: 3,
        // not sending any secret
      }, eventData))
      .then(testData.expectError);
  });
  it("fails to use an invalid secret", () => {
    // handled by updateExistingEvent()
    const manage_api = "/api/v2/events/3";
     // reverses the secret:
    const reversedSecret = testData.secret.split("").reverse().join("");
    return request(app)
      .post(manage_api)
      .send(Object.assign({
        id: 3,
        secret: reversedSecret,
      }, eventData))
      .then(testData.expectError);
  });
  it("fails if endpoint and id are mismatched", () => {
    // handled by updateExistingEvent()
    const manage_api = "/api/v2/events/3";
    return request(app)
      .post(manage_api)
      .send(Object.assign({
        id: 3 + 1, // first: make the internal mismatched
        secret: testData.secret,
      }, eventData))
      .then(res => {
        testData.expectError(res);
        // next: make the end point mismatched
        const manage_api = "/api/v2/events/4";
        return request(app).post(manage_api, {
          id: 3,
          secret: testData.secret,
        })
        .then(testData.expectError)
      });
  });
  it("adds one date and removes another", ()=> {
    return testdb.findSeries(2).then(events => {
      assert.equal(events.length, 2);
      // 2 2002-08-01  news flash  1 201 2025-11-17 05:50:02
      // 2 2002-08-02  news flash  1 202 2025-11-17 05:50:02
      const eventData = EventData.getSummary(events[0], {includePrivate: true});
      const post = Object.assign( {
        secret: testData.secret,
        code_of_conduct: "1",
        read_comic: "1",
        datestatuses : [
        // 1. keep the first date ( removes the newsflash )
        { "date": "2002-08-01", status: 'C' },
        // 2. implicitly remove the second;
        // .....
        // 3. add a third.
        { "date": "2002-08-03", status: 'A', newsflash: "new!" }
      ]}, eventData);
      // handled by updateExistingEvent()
      const manage_api = "/api/v2/events/2";
      return request(app)
        .post(manage_api)
        .type('form')
        .send({
          json: JSON.stringify(post)
        })
        .then(testData.expectOkay)
        .then(async (res) => {
          // three dailies for our event are in the db:
          // but the delisted one is hidden
          const events = await testdb.findSeries(2);
          assert.equal(events.length, 2);
          const [ d0, d2 ] = events;

          assert.equal(d0.eventdate, "2002-08-01");
          assert.equal(d0.eventstatus, EventStatus.Cancelled.toString());

          assert.equal(d2.eventdate, "2002-08-03");
          assert.equal(d2.eventstatus, EventStatus.Active.toString());

          // NOTE: new manage event doesn't return "datestatuses" when done.
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
        const eventData = EventData.getSummary(events[0], {includePrivate: true});
        const post = Object.assign({
          secret: testData.secret,
          code_of_conduct: "1",
          read_comic: "1",
        }, eventData);
        // handled by createNewEvent()
        // id is always 3 in these tests
        const manage_api = "/api/v2/events/3";
        return request(app)
          .post(manage_api)
          .type('form')
          .field({
            json: JSON.stringify(post)
          })
          // Queue the given `file` as an attachment to the specified `field`,
          // with optional `options` (or filename).
          .attach('file', imageSource, path.basename(imageSource));
      });
    });
  }
  //
  it("attaches and updates images", async () => {
    // posting eventimages/bike.jpg eventimages/3.jpg
    const imageSource = path.join(config.image.dir, "bike.jpg");
    const imageTarget = getImageTarget(3, imageSource);
    // post the image once
    await postImage(3, imageSource, imageTarget)
      .then(res => {
        testData.expectOkay(res);
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
    await postImage(3, altSource, altTarget)
      .then(res => {
        testData.expectOkay(res);
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
    // handled by createNewEvent()
    const manage_api = "/api/v2/events";
    // follows from "creates a new event" which would normally succeed
    // only we attach an image and it should fail because that's diallowed.
    return request(app)
      .post(manage_api)
      .type('form')
      .field({
        json: JSON.stringify(eventData)
      })
      .attach('file', imageSource, path.basename(imageSource))
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

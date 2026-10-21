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
const assert = require('node:assert/strict');
const {
  describe,
  it,
  beforeEach,
  afterEach,
} = require('node:test');
const fsp = require('node:fs').promises;
const path = require('node:path');
const sandbox = require('sinon').createSandbox();
const { faker } = require('@faker-js/faker');
const request = require('supertest');
const app = require('shift-docs/appEndpoints');
const config = require('shift-docs/config');
const emailer = require('shift-docs/emailer');
const testing = require('shift-docs/testing');
const misc = require('shift-docs/util/misc');
const images = require('shift-docs/images');
const { CalEvent } = require("../models/calEvent");
const { CalDaily } = require("../models/calDaily");
//
const manage_api = '/api/manage_event.php';

describe("managing events", () => {
  let getMostRecentlySentEmail;
  // reset after each one.
  beforeEach(() => {
    testing.configure("json");
    testing.fakeSiteUrl(sandbox);
    // listen to email sending.
    // requires callers to use emailer.sendMail()
    sandbox
      .stub(emailer, "sendMail")
      .callsFake((email) => {
        getMostRecentlySentEmail = email;
        return Promise.resolve(true);
      })
      .callThrough();
    // temporarily replace the secret generation
    // requires callers to use misc.newSecret()
    sandbox.stub(misc, "newSecret").callsFake((_) => {
      return faker.string.uuid().replaceAll("-", "");
    });
    return testing.setupTestData("manage", [1, 2, 3]);
  });
  afterEach(() => {
    sandbox.restore();
    return testing.reset();
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
      .then(testing.expectError);
  });
  it("creates a new event, using raw json", () => {
    return request(app)
      .post(manage_api)
      .send(requestedSeries)
      .expect(testing.expectOkay)
      .then(async (res) => {
        const id = res.body.id;
        const series = await CalEvent.getByID(id);
        assert.equal(series.hidden, 1,
          "the initial event should be hidden by default",
        );
        const schedule = await CalDaily.getByEventID(id);
        assert.equal(schedule.length, 2,
          "there are two days in the posted data");
        // console.log(res.body);
        assert.deepStrictEqual(
          getMostRecentlySentEmail,
          testing.expectedResults.createdEmail,
        );
        // console.log(res.body);
      });
  });
  it("fails creation when missing required fields", () => {
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
    let seq = Promise.resolve(); // something to kick off the sequences.
    for (let i=0; i< pairs.length; i+=2) {
      const key = pairs[i];
      const value = pairs[i+1];
      const post = Object.assign({}, requestedSeries);
      post[key] = value;
      seq = seq.then(_ => {
        return request(app)
        .post(manage_api)
        .send(post)
        .expect(400)
        .then(res => {
          assert.ok(res.body.error.fields[key]);
        });
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
      //  no longer used:
      //"datestype", "a long string",
    ];
    let seq = Promise.resolve(); // something to kick off the sequences.
    for (let i=0; i< pairs.length; i+=2) {
      const key = pairs[i];
      const value = pairs[i+1];
      const post = Object.assign({}, requestedSeries);
      post[key] = value;
      seq = seq.then(_ => {
        return request(app)
        .post(manage_api)
        .send(post)
        .then((res) => testing.expectError(res, key));
      })
    }
    return seq;
  });
  it("publishes an event", () => {
    // id three is unpublished
    return CalEvent.getByID(3).then((initialEvent) => {
      assert.equal(initialEvent.hidden, 1);
      return request(app)
        .post(manage_api)
        // by adding the id and posting to it, we should be able to publish it.
        .send(Object.assign({
          id: 3,
          secret: testing.user.secret,
        }, requestedSeries))
        .expect(testing.expectOkay)
        .then(async (res) => {
          assert.equal(res.body?.id, "3"); // the ids are sent back as strings.
          assert.equal(res.body?.published, true);

          const publishedEvent = await CalEvent.getByID(3);
          assert.equal(publishedEvent.isPublished(), true);
          // look over the days we requested
          // to validate what wound up in the db.
          const schedule = await CalDaily.getByEventID(3);
          requestedSchedule.forEach((requested, i) => {
            const at = schedule[i]; // raw db data
            // one of our requested newsflashes is missing;
            // that should result in a null database value.
            assert.equal(
              at.newsflash,
              requested.newsflash || null,
              `news mismatch ${i}`,
            );
            assert.equal(at.eventdate, requested.date, `date mismatch ${i}`);
            assert.equal(
              at.eventstatus,
              requested.status,
              `status mismatch ${i}`,
            );
          });
        });
    });
  });
  it("fails to use an empty secret", () => {
    return request(app)
      .post(manage_api)
      .send(Object.assign({
        id: 3,
        // not sending any secret
      }, requestedSeries))
      .then(testing.expectError);
  });
  it("fails to use an invalid secret", () => {
    return request(app)
      .post(manage_api)
      .send(Object.assign({
        id: 3, // reverses the secret:
        secret: testing.user.secret.split("").reverse().join(""),
      }, requestedSeries))
      .then(testing.expectError);
  });
  it("adds one date and removes another", () => {
    return CalEvent.getByID(2).then(evt => {
      const post = Object.assign({
        secret: testing.user.secret,
        code_of_conduct: "1",
        read_comic: "1",
        datestatuses : [
        // keep the first date;
        { "date": "2002-08-01", status: 'A' },
        // implicitly remove the second;
        // add a third.
        { "date": "2002-08-03", status: 'A' }
      ]}, evt.getSummary({includePrivate:true}));
      //
      return request(app)
        .post(manage_api)
        .type('form')
        .send({
          json: JSON.stringify(post)
        })
        .expect(testing.expectOkay)
        .then(async (res) => {
          assert.equal(res.body.id, "2");
          assert.equal(res.body.published, true);
          // two dailies for our event are in the db:
          const dailies = await CalDaily.getStatusesByEventId(2);
          // only two should be in the returned data
          // ( the second one is delisted; filtered by reconcile )
          // fix: should add a test for an explicitly canceled day.
          assert.deepEqual(dailies[0], {
            "id": "201",
            "date": "2002-08-01",
            "status": "A",
            "newsflash": null,
          });
          assert.deepEqual(dailies[1], {
            "id": "303", // the auto-generated id is after the last manually created one
            "date": "2002-08-03",
            "status": "A",
            "newsflash": null,
          });
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
        return evt.getDetails(statuses, {includePrivate:true}).then(requestedSeries => {
          const eventData = Object.assign({
            secret: testing.user.secret,
            code_of_conduct: "1",
            read_comic: "1",
          }, requestedSeries);
          return fsp.readFile(imageSource).then((fileData) => {
            return request(app)
              .post(manage_api)
              .type('form')
              .field({
                json: JSON.stringify(eventData)
              })
              // the tests originally based a filepath here
              // but that started generating EPIPE errors for reasons.
              .attach('file', fileData, path.basename(imageSource));
            });
        });
      });
    });
  }
  it("attaches an image", () => {
    const imageSource = images.bike.jpg;
    const imageTarget = getImageTarget(3, imageSource);
    return postImage(3, imageSource, imageTarget)
      .then(testing.expectOkay)
      .then(res => {
        return CalEvent.getByID(3).then(evt => {
          // FIX: the number changed here.
          // could there be a bug?
          assert.equal(evt.image, "3-1.jpg", "image names should have a sequence number");
          //
          const imageTarget = getImageTarget(3, imageSource);
          return fsp.stat(imageTarget); // rejects if it doesn't exist on disk.
        });
      });
  });
  it("fails too large", () => {
    const imageSource = images.bike.big;
    const imageTarget = getImageTarget(3, imageSource);
    return postImage(3, imageSource, imageTarget)
      .then(res => {
        testing.expectError(res, 'image');
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
    const imageSource = images.bike.unsupportedFormat;
    const imageTarget = getImageTarget(3, imageSource);
    return postImage(3, imageSource, imageTarget).then(res => {
      testing.expectError(res, 'image');
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
    const imageSource = images.bike.jpg;
    // follows from "creates a new event" which would normally succeed
    // only we attach an image and it should fail because that's diallowed.
    return fsp.readFile(imageSource).then((fileData) => {
      return request(app)
        .post(manage_api)
        .type('form')
        .field({
          json: JSON.stringify(requestedSeries)
        })
        .attach('file', fileData, path.basename(imageSource))
        .then(res => testing.expectError(res, 'image'));
    });
  });
});

// some days to request
const requestedSchedule = [
  {
    date: "2023-05-24",
    status: "A",
  },
  {
    date: "2023-05-26",
    status: "C",
    newsflash: "not the news",
  },
];

// minimal json for pushing a new event
const requestedSeries = {
  title: "new event",
  details: "some details",
  venue: "the secret hideout",
  address: "the location of the secret hideout",
  organizer: "js test",
  email: "test@example.com",
  code_of_conduct: "1",
  read_comic: "1",
  time: "3:15 PM", // time is sent with meridian for some reason.
  datestatuses: requestedSchedule,
};

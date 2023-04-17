// some possible tests:
// x manage invalid id
// x empty; invalid secret
// x missing required fields (ex. code of conduct, etc.)
// x create a new event
// x update a hidden event to publish it
// x add / cancel dates from a published event
// - delete an unpublished event
// - resurrect dates from a canceled event.
// x raw json ( curl ) vs body json ( forms )
// - multi-part form ( attach image )

const chai = require('chai');
const sinon = require('sinon');
const app = require("../app");
const testData = require("./testData");

chai.use(require('chai-http'));
const expect = chai.expect;
const endpoint = '/api/manage_event.php';

describe("managing events", () => {
  let data;
  // reset after each one.
  beforeEach(function() {
    data = testData.stubData(sinon);
  });
  afterEach(function () {
    sinon.restore();
  });
  it("errors on an invalid id",function(done) {
    chai.request( app )
      .post(endpoint)
      .type('form')
      .send({
        json: JSON.stringify({
          id: 999,
        })
      })
      .end(function (err, res) {
        expect(err).to.be.null;
        testData.expectError(expect, res);
        done();
      });
  });
  it("creates a new event, using raw json", function(done){
    chai.request( app )
      .post(endpoint)
      .send(eventData)
      .end(function (err, res) {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(data.eventStore.callCount, "event stores")
          .to.equal(1);
        expect(data.dailyStore.callCount, "daily store")
          .to.equal(2);
        const evt = data.events.get('501');
        expect(evt.hidden, "the initial event should be hidden by default")
          .to.equal(1);
        console.log(res.body);
        done();
      });
  });

  it("fail creation when missing required fields", function(){
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
      // use the data that succeeded in "creates a new event"
      // but each time substitute a field value that should fail
      const post = Object.assign({}, eventData);
      post[key] = value;
      seq = seq.then(_ => {
        return chai.request( app )
        .post(endpoint)
        .send(post)
        .then(function (res) {
          expect(res, `expected failure for '${key}'`).to.have.status(400);
          expect(res.body.error.fields).to.have.lengthOf(1);
          expect(res.body.error.fields[0]).to.have.key(key);
        });
      })
    }
    return seq;
  });
  it("publishes an event", function(done){
    // id three is unpublished
    const evt = data.events.get('3');
    expect(evt.isPublished()).to.be.false;
    chai.request( app )
      .post(endpoint)
      // by adding the id and posting to it, we should be able to publish it.
      .send(Object.assign({
        id: 3,
        secret: testData.secret,
      }, eventData))
      .end(function (err, res) {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(data.eventStore.callCount, "event stores")
          .to.equal(1);
        expect(evt.isPublished()).to.be.true;
        done();
      });
  });
  it("fails to use an empty secret", function(done){
    chai.request( app )
      .post(endpoint)
      .send(Object.assign({
        id: 3,
        // not sending any secret
      }, eventData))
      .end(function (err, res) {
        expect(err).to.be.null;
        testData.expectError(expect, res);
        done();
      });
  });
  it("fails to use an invalid secret", function(done){
    chai.request( app )
      .post(endpoint)
      .send(Object.assign({
        id: 3, // reverses the secret:
        secret: testData.secret.split("").reverse().join(""),
      }, eventData))
      .end(function (err, res) {
        expect(err).to.be.null;
        testData.expectError(expect, res);
        done();
      });
  });
  it("adds one date and removes another", function(done){
    const evt = data.events.get('2');
    const post = Object.assign( {
      secret: evt.password,
      code_of_conduct: "1",
      read_comic: "1",
      datestatuses : [
      // keep the first date;
      { "date": "2002-08-01", status: 'A' },
      // implicitly cancel the second;
      // add a third.
      { "date": "2002-08-03", status: 'A' }
    ]}, evt.getJSON({includePrivate:true}));
    chai.request( app )
      .post(endpoint)
      .type('form')
      .send({
        json: JSON.stringify(post)
      })
      .end(function (err, res) {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(data.eventStore.callCount, "event stores")
          .to.equal(1);
        expect(data.dailyStore.callCount, "daily store")
          .to.equal(3);
        // all the dailies for our event:
        const dailies = Array.from(data.dailies.values()).filter(at => at.id === evt.id);
        expect(dailies).to.have.lengthOf(3);
        expect(dailies[0].getCancelled()).to.be.false;
        expect(dailies[1].getCancelled()).to.be.true;
        expect(dailies[2].getCancelled()).to.be.false;
        // we should get back all of the days.
        expect(res.body.datestatuses).to.deep.equal([{
            "id": "201",
            "date": "2002-08-01",
            "status": "A",
            "newsflash": null,
          }, {
            "id": "202",
            "date": "2002-08-02",
            "status": "C",
            "newsflash": "news flash",
          }, {
            "id": "501",
            "date": "2002-08-03",
            "status": "A",
            "newsflash": null,
          }
        ]);
        done();
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

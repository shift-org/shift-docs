// tests looking up map coordinates when saving events.
// ( the geocoder is disabled while testing; these tests enable it
//   and replace fetch so nothing goes out over the network. )
const sinon = require('sinon');
const app = require("../appEndpoints");
const config = require("../config");
const testdb = require("./testdb");
const testData = require("./testData");
const geocode = require("../util/geocode");
const { CalEvent } = require("../models/calEvent");
//
const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const request = require('supertest');
//
const manage_api = '/api/manage_event.php';

// a nominatim style response
function placeResponse(places) {
  return new Response(JSON.stringify(places), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
const hawthorne = [{ lat: "45.5122", lon: "-122.6587", display_name: "Hawthorne" }];

describe("geocoding", () => {
  let fetch;
  const savedGeocoder = config.geocoder;
  beforeEach(() => {
    config.geocoder = {
      url: "http://geocoder.test/search",
      userAgent: "test",
      viewbox: "-123.2,45.8,-122.2,45.2",
    };
    fetch = sinon.stub(global, 'fetch');
  });
  afterEach(() => {
    sinon.restore();
    config.geocoder = savedGeocoder;
  });

  it("searches for the address within the event's city", async () => {
    fetch.resolves(placeResponse(hawthorne));
    const evt = { address: " 915 SE Hawthorne Blvd ", locname: "the park", area: "P" };
    await geocode.updateEvent(evt);
    assert.equal(evt.latitude, 45.5122);
    assert.equal(evt.longitude, -122.6587);
    assert.equal(evt.geoaddress, "915 SE Hawthorne Blvd, Portland, OR");
    const url = new URL(fetch.firstCall.args[0]);
    assert.equal(url.searchParams.get('q'), "915 SE Hawthorne Blvd, Portland, OR");
  });
  it("falls back to the location name", () => {
    const text = geocode.searchText({ address: "", locname: "Laurelhurst Park", area: "V" });
    assert.equal(text, "Laurelhurst Park, Vancouver, WA");
  });
  it("only searches when the location changes", async () => {
    const evt = {
      address: "915 SE Hawthorne Blvd", area: "P",
      geoaddress: "915 SE Hawthorne Blvd, Portland, OR",
      latitude: 1, longitude: 2,
    };
    await geocode.updateEvent(evt);
    assert.equal(fetch.callCount, 0);
    assert.equal(evt.latitude, 1);
  });
  it("clears the coordinates when nothing matches", async () => {
    fetch.resolves(placeResponse([]));
    const evt = { address: "nowhere", latitude: 1, longitude: 2 };
    await geocode.updateEvent(evt);
    assert.equal(evt.latitude, null);
    assert.equal(evt.longitude, null);
    assert.equal(evt.geoaddress, "nowhere, Portland, OR");
  });
  it("tries again next time if the geocoder fails", async () => {
    fetch.rejects(new Error("network down"));
    sinon.stub(console, 'error'); // keep the expected error out of the test output.
    const evt = { address: "915 SE Hawthorne Blvd", latitude: 1, longitude: 2 };
    await geocode.updateEvent(evt);
    assert.equal(evt.geoaddress, undefined);
    assert.equal(evt.latitude, 1, "keeps the old coordinates");
  });
  it("does nothing when disabled", async () => {
    config.geocoder = false;
    const evt = { address: "915 SE Hawthorne Blvd" };
    await geocode.updateEvent(evt);
    assert.equal(fetch.callCount, 0);
    assert.equal(evt.geoaddress, undefined);
  });

  describe("saving events", () => {
    beforeEach(() => {
      testData.stubData(sinon);
      // supertest makes real requests to the app; only fake the geocoder's.
      fetch.callThrough();
      fetch.withArgs(sinon.match(url => String(url).startsWith("http://geocoder.test/")))
        .resolves(placeResponse(hawthorne));
      return testdb.setupTestData("geocode");
    });
    afterEach(() => {
      return testdb.destroy();
    });
    it("stores and returns the coordinates", () => {
      return request(app)
        .post(manage_api)
        .send(eventData)
        .expect(200)
        .then(async (res) => {
          assert.equal(res.body.latitude, 45.5122);
          assert.equal(res.body.longitude, -122.6587);
          const evt = await CalEvent.getByID(res.body.id);
          assert.equal(evt.geoaddress, "915 SE Hawthorne Blvd, Portland, OR");
        });
    });
  });
});

const eventData = {
  "title": "map test",
  "details": "some details",
  "venue": "the secret hideout",
  "address": "915 SE Hawthorne Blvd",
  "organizer": "js test",
  "email": "test@example.com",
  "code_of_conduct": "1",
  "read_comic": "1",
  "time": "3:15 PM",
  "datestatuses": [{
    "date": "2023-05-24",
  }]
};

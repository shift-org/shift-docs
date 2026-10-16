const app = require("../appEndpoints");
const testData = require("./testData");
const testdb = require("./testdb");
//
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const request = require('supertest');

describe("retrieving event data for editing", () => {
  // runs before the first test in this block.
  before(() => {
    return testdb.setupTestData("retrieve");
  });
  // runs once after the last test in this block
  after(() => {
    return testdb.destroy();
  });
  it("reports 404 on an invalid id", () => {
    return request(app)
      .get('/api/retrieve_event.php')
      .query({
        id: 999
      })
      .then(res => testData.expectError(res, null, 404));
  });
  it("private data requires the correct secret", () => {
    return request(app)
      .get('/api/retrieve_event.php')
      .query({
         id: 2,
         secret: "the incorrect answer to life, the universe, and this event.",
       })
      .expect(200)
      .expect('Content-Type', /json/)
      .expect('Api-Version', /^3\./)
      .then(res => {
        assert.equal(res.body.id, '2'); // a string
        assert.equal(res.body.email, null, "email should be private");
        assert.equal(res.body.phone, null, "phone should be private");
        assert.equal(res.body.contact, null, "contact should be private");
      });
  });
  it("retrieves with a valid id and secret", () => {
    return request(app)
      .get('/api/retrieve_event.php')
      .query({
         id: 2,
         secret: testData.secret,
       })
      .expect(200)
      .expect('Content-Type', /json/)
      .expect('Api-Version', /^3\./)
      .then(res => {
        // console.dir(res.body);
        assert.equal(res.body.id, '2'); // a string
        assert.ok(res.body.email, "b/c of the secret, email should be present");
        assert.ok(res.body.phone, "b/c of the secret, phone should be present");
        assert.ok(res.body.contact, "b/c of the secret, contact should be present");
        assert.equal(res.body.hideemail, true, "the test data has the email hidden");
        assert.equal(res.body.email, testData.email, "b/c of the secret, we should see the email");
        assert.deepEqual(res.body.datestatuses, [{
          id: '201',
          date: '2002-08-01',
          status: 'A',
          newsflash: 'news flash'
        },{
          id: '202',
          date: '2002-08-02',
          status: 'A',
          newsflash: 'news flash'
        }]);
      });
  });
  it("reports 404 on a hidden event", () => {
    // same answer as an unknown id, so the secret isn't leaked by the status
    return request(app)
      .get('/api/retrieve_event.php')
      .query({
        id: 3
      })
      .then(res => testData.expectError(res, null, 404));
  });
  it("errors on a hidden event, unless given the secret", () => {
    return request(app)
      .get('/api/retrieve_event.php')
      .query({
        id: 3,
        secret: testData.secret,
      })
      .expect(200)
      .expect('Content-Type', /json/);
  });
});


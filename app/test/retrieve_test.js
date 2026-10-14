const assert = require('node:assert/strict');
const { describe, it, beforeEach, afterEach } = require('node:test');
const request = require('supertest');
//
const app = require('shift-docs/appEndpoints')
const testing = require('shift-docs/testing');
const testdb = require('shift-docs/testing/testdb');

describe("retrieving event data for editing", () => {
  beforeEach(() => {
    testing.configure("json");
    return testing.setupTestData("retrieve");
  });
  afterEach(() => {
    return testing.reset();
  });
  it("errors on an invalid id", () => {
    return request(app)
      .get('/api/retrieve_event.php')
      .query({
        id: 999
      })
      .then(testing.expectError);
  });
  it("private data requires the correct secret", () => {
    return request(app)
      .get('/api/retrieve_event.php')
      .query({
         id: 2,
         secret: "the incorrect answer to life, the universe, and this event.",
       })
      .then(testing.expectOkay)
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
         secret: testing.user.secret,
       })
      .then(testing.expectOkay)
      .then(res => {
        // console.dir(res.body);
        assert.equal(res.body.id, '2'); // a string
        assert.ok(res.body.email, "b/c of the secret, email should be present");
        assert.ok(res.body.phone, "b/c of the secret, phone should be present");
        assert.ok(res.body.contact, "b/c of the secret, contact should be present");
        assert.equal(res.body.hideemail, true, "the test data has the email hidden");
        assert.equal(res.body.email, testing.user.email, "b/c of the secret, we should see the email");
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
  it("errors on a hidden event", () => {
    return request(app)
      .get('/api/retrieve_event.php')
      .query({
        id: 3
      })
      .then(testing.expectError);
  });
  it("errors on a hidden event, unless given the secret", () => {
    return request(app)
      .get('/api/retrieve_event.php')
      .query({
        id: 3,
        secret: testing.user.secret,
      })
      .then(testing.expectOkay);
  });
});

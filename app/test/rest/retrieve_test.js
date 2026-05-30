const test = require("../testData");
const testdb = require("../v2data");
//
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");

describe("retrieving event data for editing", () => {
  // runs before the first test in this block.
  before(() => {
    test.configure("v2", "json");
    return testdb.setupTestData("retrieve");
  });
  // runs once after the last test in this block
  after(() => {
    test.configure();
    return testdb.destroy();
  });
  it("errors on an invalid id", () => {
    return test.GET(test.api.eventSeries(999))
      .then(test.expectError);
  });
   // fix? originally, incorrect secrets returned the public event data;
   // now this errors.
  it("incorrect secrets return an error", () => {
    return test.GET(test.api.eventSeries(2, "the incorrect answer to life, the universe, and this event."))
      .then(test.expectError);
  });
  it("retrieves with a valid id and secret", () => {
    return test.GET(test.api.eventSeries(2, test.secret))
      .then(test.expectOkay)
      .then(res => {
        // console.dir(res.body);
        assert.equal(res.body.id, '2'); // a string
        assert.ok(res.body.email, "b/c of the secret, email should be present");
        assert.ok(res.body.phone, "b/c of the secret, phone should be present");
        assert.ok(res.body.contact, "b/c of the secret, contact should be present");
        assert.equal(res.body.hideemail, true, "the test data has the email hidden");
        assert.equal(res.body.email, test.email, "b/c of the secret, we should see the email");
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
  it("errors on a hidden event with no secret", () => {
    return test.GET(test.api.eventSeries(3))
      .then(test.expectError);
  });
  it("errors on a hidden event, unless given the secret", () => {
    return test.GET(test.api.eventSeries(3, test.secret))
      .then(test.expectOkay);
  });
});


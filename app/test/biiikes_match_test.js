const crypto = require("crypto");
const app = require("../appEndpoints");
const config = require("../config");
const db = require("../db");
const testdb = require("./testdb");
const testData = require("./testData");
const match = require("../endpoints/biiikes_match");

const { CalEvent } = require("../models/calEvent");
//
const sinon = require('sinon');
const { describe, it, before, after, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const request = require('supertest');
//
const match_api = '/api/biiikes_match.php';
const token = "test-token-one";
const otherToken = "test-token-two";

// test data: event 1 is published ( legacy null hidden ), 2 is published, 3 is unpublished.
// all three use testData.email as their organizer email.
// event 4 is published but deleted; event 5 is published with a blank email.

// post json with a token.
function post(body, auth = `Bearer ${token}`) {
  const req = request(app).post(match_api);
  if (auth) {
    req.set('Authorization', auth);
  }
  return req.send(body);
}

// watches everything the app might write to the console.
function spyConsole() {
  return ['log', 'info', 'warn', 'error', 'debug'].map(k => sinon.spy(console, k));
}

// asserts that no console call mentioned the text ( case insensitive. )
function assertNeverLogged(spies, text) {
  const lower = text.toLowerCase();
  for (const spy of spies) {
    for (const call of spy.getCalls()) {
      const out = call.args.map(a => (a instanceof Error) ? a.stack : String(a)).join(" ");
      assert.ok(!out.toLowerCase().includes(lower), `console.${spy.name} logged the email`);
    }
  }
}

describe("matching an organizer email", () => {
  let saved;
  before(async () => {
    saved = { ...config.biiikesMatch };
    config.biiikesMatch.tokens = [ token, otherToken ];
    config.biiikesMatch.perHour = 1000;
    await testdb.setupTestData("biiikes match");
    // a deleted event; soft delete keeps the email.
    const row = await db.query('calevent').where('id', 2).first();
    await db.query('calevent').insert({ ...row, id: 4, review: 'E', password: "" });
    // a published event with no email.
    await db.query('calevent').insert({ ...row, id: 5, email: "" });
  });
  after(() => {
    Object.assign(config.biiikesMatch, saved);
    sinon.restore();
    return testdb.destroy();
  });
  beforeEach(() => {
    match.resetLimits();
  });
  afterEach(() => {
    sinon.restore();
  });

  it("says yes for the organizer email of a published event", () => {
    return post({ series_id: "2", email: testData.email })
      .expect(200)
      .expect('Content-Type', /json/)
      .expect('Api-Version', /^3\./)
      .expect('Cache-Control', 'no-store')
      .then(res => {
        assert.deepEqual(res.body, { leads: true });
        assert.equal(res.header['access-control-allow-origin'], undefined);
      });
  });
  it("matches a legacy published event", () => {
    return post({ series_id: "1", email: testData.email })
      .expect(200)
      .then(res => assert.deepEqual(res.body, { leads: true }));
  });
  it("accepts a numeric series_id", () => {
    return post({ series_id: 2, email: testData.email })
      .expect(200)
      .then(res => assert.deepEqual(res.body, { leads: true }));
  });
  it("ignores case and surrounding spaces on both sides", async () => {
    await db.query('calevent').where('id', 2).update({ email: "  EMAIL@Example.com " });
    try {
      const res = await post({ series_id: "2", email: " Email@EXAMPLE.COM\t" }).expect(200);
      assert.deepEqual(res.body, { leads: true });
    } finally {
      await db.query('calevent').where('id', 2).update({ email: testData.email });
    }
  });

  it("says no the same way for every other well-formed request", async () => {
    const cases = {
      "a different email": { series_id: "2", email: "someone-else@example.com" },
      "an unknown event": { series_id: "999", email: testData.email },
      "an unpublished event": { series_id: "3", email: testData.email },
      "a deleted event": { series_id: "4", email: testData.email },
      "an event with no email": { series_id: "5", email: "" },
      "a blank email": { series_id: "2", email: "" },
      "an all space email": { series_id: "2", email: "   " },
      "a partial email": { series_id: "2", email: "email@example" },
    };
    let first;
    for (const [name, body] of Object.entries(cases)) {
      const res = await post(body);
      assert.equal(res.status, 200, name);
      assert.equal(res.text, '{"leads":false}', name);
      // byte identical, headers included ( other than the date. )
      const headers = { ...res.header };
      delete headers.date;
      if (!first) {
        first = headers;
      } else {
        assert.deepEqual(headers, first, name);
      }
    }
  });

  it("looks up the event and compares digests even when it can't match", async () => {
    const lookup = sinon.spy(CalEvent, 'getByID');
    const compare = sinon.spy(crypto, 'timingSafeEqual');
    const cases = [
      { series_id: "999", email: testData.email },  // not found
      { series_id: "3", email: testData.email },    // unpublished
      { series_id: "2", email: "" },                // blank input
      { series_id: "5", email: testData.email },    // blank stored email
    ];
    for (const body of cases) {
      lookup.resetHistory();
      compare.resetHistory();
      const res = await post(body).expect(200);
      assert.deepEqual(res.body, { leads: false });
      assert.equal(lookup.callCount, 1, `looked up ${body.series_id}`);
      // one compare per configured token, and one for the email.
      assert.equal(compare.callCount, config.biiikesMatch.tokens.length + 1);
      const last = compare.lastCall.args;
      assert.equal(last[0].length, 32);
      assert.equal(last[1].length, 32);
    }
  });

  it("refuses a missing or unknown token", async () => {
    const auths = [
      null,
      "Bearer not-a-token",
      `Bearer ${token}x`,
      `Basic ${token}`,
      token,
      "Bearer ",
    ];
    for (const auth of auths) {
      const res = await post({ series_id: "2", email: testData.email }, auth);
      assert.equal(res.status, 401, `auth: ${auth}`);
      assert.equal(res.header['www-authenticate'], 'Bearer');
      assert.equal(res.body.leads, undefined);
      testData.expectError(res, null, 401);
    }
  });
  it("accepts any configured token", () => {
    return post({ series_id: "2", email: testData.email }, `Bearer ${otherToken}`)
      .expect(200)
      .then(res => assert.deepEqual(res.body, { leads: true }));
  });
  it("checks every token, so timing doesn't say which one matched", async () => {
    const compare = sinon.spy(crypto, 'timingSafeEqual');
    await post({ series_id: "2", email: testData.email }, `Bearer ${token}`).expect(200);
    // two tokens plus the email
    assert.equal(compare.callCount, 3);
  });

  it("refuses malformed requests", async () => {
    const bodies = {
      "no series_id": { email: testData.email },
      "no email": { series_id: "2" },
      "a non-string email": { series_id: "2", email: 5 },
      "a non-numeric series_id": { series_id: "two", email: testData.email },
      "a negative series_id": { series_id: "-2", email: testData.email },
      "a fractional series_id": { series_id: 2.5, email: testData.email },
      "an array": [ "2", testData.email ],
    };
    for (const [name, body] of Object.entries(bodies)) {
      const res = await post(body);
      assert.equal(res.status, 400, name);
      testData.expectError(res);
    }
  });
  it("refuses a query string or form instead of json", async () => {
    let res = await request(app)
      .post(`${match_api}?series_id=2&email=${encodeURIComponent(testData.email)}`)
      .set('Authorization', `Bearer ${token}`);
    assert.equal(res.status, 400);
    res = await request(app)
      .post(match_api)
      .set('Authorization', `Bearer ${token}`)
      .type('form')
      .send({ series_id: "2", email: testData.email });
    assert.equal(res.status, 400);
  });

  it("never logs or echoes the email", async () => {
    const email = "Never-Logged@Example.com";
    const spies = spyConsole();
    const responses = [
      await post({ series_id: "2", email }),
      await post({ series_id: "999", email }),
      await post({ series_id: "bad", email }),
      await post({ series_id: "2", email }, "Bearer wrong"),
      // json that fails to parse: node's error message quotes the text.
      await request(app)
        .post(match_api)
        .set('Authorization', `Bearer ${token}`)
        .set('Content-Type', 'application/json')
        .send(`{"series_id":"2","email":${email}}`),
      // the same, without a token.
      await request(app)
        .post(match_api)
        .set('Content-Type', 'application/json')
        .send(`{"series_id":"2","email":${email}}`),
    ];
    assert.deepEqual(responses.map(r => r.status), [ 200, 200, 400, 401, 400, 401 ]);
    for (const res of responses) {
      assert.ok(!res.text.toLowerCase().includes(email.toLowerCase()), "the response echoed the email");
    }
    assertNeverLogged(spies, email);
  });
});

describe("limiting requests per token", () => {
  let saved, clock;
  before(async () => {
    saved = { ...config.biiikesMatch };
    config.biiikesMatch.tokens = [ token, otherToken ];
    config.biiikesMatch.perHour = 3;
    match.resetLimits();
    await testdb.setupTestData("biiikes match limits");
  });
  after(() => {
    Object.assign(config.biiikesMatch, saved);
    match.resetLimits();
    return testdb.destroy();
  });
  beforeEach(() => {
    // only fake the date, so the database's timers keep working.
    clock = sinon.useFakeTimers({ now: Date.UTC(2002, 7, 5, 10, 15), toFake: ['Date'] });
  });
  afterEach(() => {
    sinon.restore();
  });

  it("answers 429 past the hourly limit, per token, until the hour turns", async () => {
    const body = { series_id: "2", email: testData.email };
    for (let i = 0; i < 3; i++) {
      await post(body).expect(200);
    }
    // every request counts, including ones that don't match
    let res = await post(body);
    assert.equal(res.status, 429);
    assert.equal(res.header['retry-after'], String(45 * 60));
    testData.expectError(res, null, 429);

    // another token has its own count.
    await post(body, `Bearer ${otherToken}`).expect(200);

    // the next hour starts fresh.
    clock.tick(45 * 60 * 1000);
    res = await post(body);
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { leads: true });
  });
  it("defaults to 100 an hour", () => {
    assert.equal(saved.perHour, 100);
  });
});

describe("without tokens configured", () => {
  let saved;
  before(async () => {
    saved = { ...config.biiikesMatch };
    config.biiikesMatch.tokens = [];
    await testdb.setupTestData("biiikes match off");
  });
  after(() => {
    Object.assign(config.biiikesMatch, saved);
    return testdb.destroy();
  });

  it("answers exactly like an unknown url", async () => {
    const res = await post({ series_id: "2", email: testData.email });
    assert.equal(res.status, 404);
    const unknown = await request(app)
      .post('/api/no_such_endpoint.php')
      .set('Authorization', `Bearer ${token}`)
      .send({ series_id: "2", email: testData.email });
    assert.equal(res.text, unknown.text.replace('no_such_endpoint', 'biiikes_match'));
    assert.equal(res.header['api-version'], undefined);
  });
  it("also hides itself for a body that fails to parse", async () => {
    const spies = spyConsole();
    const res = await request(app)
      .post(match_api)
      .set('Content-Type', 'application/json')
      .send('{"email": hidden@example.com}');
    sinon.restore();
    assert.equal(res.status, 404);
    assertNeverLogged(spies, "hidden@example.com");
  });
});

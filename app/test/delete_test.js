const assert = require('node:assert/strict');
const { describe, it, beforeEach, afterEach } = require('node:test');
const request = require('supertest');
//
const app = require('shift-docs/appEndpoints');
const testing = require('shift-docs/testing');

// delete using forms
describe("deleting using a form", () => {
   beforeEach(() => {
    testing.configure("json");
    return testing.setupTestData("deleting with forms");
  });
  afterEach(() => {
    return testing.reset();
  });
  handleDeleteWithForms(true);
});

// delete without forms
describe("deleting using json", () => {
  beforeEach(() => {
    testing.configure("json");
    return testing.setupTestData("deleting with json");
  });
  afterEach(() => {
    return testing.reset();
  });
  handleDeleteWithForms(false);
});

// ---------------------------------------
// support functions:
// ---------------------------------------

// run a series of deletion tests with or without forms
function handleDeleteWithForms(useForm) {
  it("fails on an invalid id", () => {
    return Promise.resolve()
      .then(_ => requestDelete({
        id: 999,
        secret: testing.user.secret,
        useForm
      }))
      .then(testing.expectError);
  });
  it("fails on an incorrect password", () => {
    // fix? maybe this should return "okay"
    // so that someone couldn't spam searching for the correct secret.
    return Promise.resolve()
      .then(_ => requestDelete({
        id: 2,
        secret: "invalid password",
        useForm
      }))
      .then(testing.expectError)
      .then(_ => verifyDataExists(2));
  });

  it("deletes published events", () => {
    return Promise.resolve()
      .then(_ => verifyDataExists(2))
      .then(_ => requestDelete({
        id: 2,
        secret: testing.user.secret,
        useForm
      }))
      .then(testing.expectOkay)
      .then(_ => verifyDataDeleted(2));
  });

  it("deletes unpublished events", () => {
    return Promise.resolve()
      .then(_ => verifyDataExists(3))
      .then(_ => requestDelete({
        id: 3,
        secret: testing.user.secret,
        useForm
      }))
      .then(testing.expectOkay)
      .then(_ => verifyDataDeleted(3));
  });
}

async function verifyDataExists(id) {
  // fix -- can this ve reverted here?
  const events = await testing.findSeries(id);
  if (id !== 2) {
    assert.ok(events.length > 0);
  } else {
    assert.equal(events.length, 2);
    const [d1, d2] = events;
    assert.equal(d1.hidden, 0);
    assert.equal(d1.eventstatus, 'A');
    assert.equal(d2.eventstatus, 'A');
  }
}

async function verifyDataDeleted(id) {
  const events = await testing.findSeries(id);
  assert.equal(events.length, 0);
}

// helper to send a delete request using forms or raw json post
function requestDelete({id, secret, useForm}) {
  const path = '/api/delete_event.php';
  const data = { id, secret };
  if (!useForm) {
    return request(app).post(path).send(data);
  } else {
    return request(app)
      .post(path)
      .type('form')
      .send({
         json: JSON.stringify(data)
      });
  }
}
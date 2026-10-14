/**
 * Delete Event: Removes an event from the calendar.
 * Expects a JSON post with an id and password.
 *
 *  You can use curl to post json for testing. For example:
 *    curl -k -H 'Content-Type: application/json' -X POST --data-binary \
 *    "@delete_event.json" https://localhost:4443/api/delete_event.php
 *  {
 *      "id": "6245",
 *      "secret": "example"
 *   }
 *
 * If there was an error ( for example, if the id was missing or the event wasn't found )
 * returns http 400 "Bad Request" and a json error response (see util/errors.js)
 *
 */
const express = require('express');
const reconcile = require('shift-docs/support/reconcile');
const { uploader } = require('shift-docs/uploader');
const { parseJson } = require('shift-docs/util/parse');
const { ErrBadRequest, ErrNotFound } = require('shift-docs/util/errors');
const handleCall = require('shift-docs/util/handleCall');
const db = require('shift-docs/db');

// the front end sends a multi-part form post
// so... we need to handle that.
exports.post = [ uploader.makeHandler(), handleCall(postDelete) ];

function postDelete(req) {
  const data = parseJson(req.body);
  if (!data.id) {
    throw new ErrBadRequest("Missing id");
  }
  return deleteEvent(data.id, data.secret);
}

function deleteEvent(id, secret) {
  return db.query.transaction((tx) => {
    // FIX? revoke hides the event from all queries
    // it's nice for testing/support to not delete the data entirely
    // tbd: maybe a chron job could delete revoked events older than a month?
    return reconcile.revokeEntireSeries(tx, id, secret);
    //return reconcile.deleteEntireSeries(tx, id, secret);
  })
  .then((count) => {
    if (!count) {
      throw new ErrNotFound("Event not found");
    }
    return { success: true };
  });
}
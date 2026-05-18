/**
 * Removes an event from the calendar.
 * Expects a JSON post with a valid id and secret.
 * Throws on error.
 */
const db = require("server/core/db");
const { parseJson } = require("server/util/parse");
const { TextError } = require("server/support/errors");
//
const Reconcile = require("../models/reconcile");

function deleteEvent(req) {
  const data = parseJson(req.body);
  if (!data) {
    throw new TextError('Bad request');
  }
  if (!data.id) {
    throw new TextError('Missing id');
  }
  if (!data.secret) {
    throw new TextError('Missing secret');
  }
  return db.query.transaction(tx => {
    const seriesId = '' + data.id; // normalizes int to a string
    const secret = data.secret;
    return Reconcile.removeEntireSeries(tx, seriesId, secret);
  }).then(count => {
    if (!count) {
      // if the secret was wrong; treats it as event not found.
      throw new TextError('Event not found');
    }
  });
}

module.exports = deleteEvent;
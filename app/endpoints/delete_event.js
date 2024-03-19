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
 * returns http 400 "Bad Request" and a json error response (see errors.php)
 *
 */
const express = require('express');
const textError = require("../util/errors");
const { CalEvent } = require("../models/calEvent");

exports.post = function(req, res, next) {
  let data = req.body;
  // fix? client uploads form data containing json...
  // probably to match manage_event where its currently required.
  if (data && data.json) {
    data = safeParse(data.json);
  }
  if (!data) {
    return res.textError('JSON could not be decoded');
  }
  if (!data.id) {
    return res.textError('Missing id');
  }
  // get the event: delete seems to send an int, where manage is a string.
  // normalize it to a string for consistency ( tbd: is that good, or even needed? )
  return CalEvent.getByID(''+data.id).then((evt) => {
    // verify the event exists.
    if (!evt) {
      return res.textError('Event not found');
    }

    // validate the password.
    if (!evt.isSecretValid(data.secret)) {
      return res.textError('Invalid secret, use link from email');
    }

    // if the event was never published, we can delete it completely;
    // otherwise, soft delete it.
    let q = !evt.isPublished() ? evt.eraseEvent() : evt.softDelete();
    q.then((_) => {
      res.json({"success": true})
    }).catch((e) => {
      console.error("error trying to cancel an event", e);
      return res.textError('Server error');
    });
  }).catch(next);
}

// read json into a javascript object.
// returns undefined for any error.
function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch (err) {
    console.error(err);
  }
}

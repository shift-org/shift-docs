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
const config = require("../config");
const db = require("../knex");
const express = require('express');
const textError = require("../util/errors");
const Reconcile = require("../models/reconcile")
const { uploader } = require("../uploader");

// the front end sends a multi-part form post
// so... we need to handle that.
exports.post = [ uploader.makeHandler(), handleRequest ];

function handleRequest(req, res, next) {
  let data = req.body;
  // fix? client uploads form data containing json...
  // probably to match manage_event where its currently required.
  if (data && data.json) {
    data = safeParse(data.json);
  }
  if (!data) {
    res.textError('Bad request');
  } else if (!data.id) {
    res.textError('Missing id');
  } else if (!data.secret) {
    res.textError('Missing secret');
  } else {
    const seriesId = '' + data.id; // normalize int into a string
    return db.query.transaction(tx => {
      return Reconcile.removeEntireSeries(tx, seriesId, data.secret)
    }).then(count => {
      if (!count) {
        res.textError('Event not found');
      } else {
        res.set(config.api.header, config.api.version);
        // note: the frontend currently doesn't use this json;
        // instead it looks for request success ( http 200 )
        res.json({
          success: true
        });
      }
    }).catch(next);
  }
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
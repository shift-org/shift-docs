/**
 * interface to local storage
 * can store up to ~5 megs.
 * https://developer.mozilla.org/en-US/docs/Web/API/Storage
 * https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist
 * 
 * each element is: {
 *   created: 1548381600, // time added to favorites
 *   modified: 1548381600 // last time updated from server
 *   data: evt            // subset of evt data.
 * }
 */
import dayjs from 'dayjs'
import dataPool from './dataPool';

export default {
  fetch: fetchFavorites,
  add: addFavorite,
  remove: removeFavorite,
  favored: hasFavorite, // evt
}

const storage = window.localStorage;

// an array of all favorites
async function fetchFavorites() {
  // first get keys ( to safely update storage when needed )
  const keys = [];
  for (let i = 0; i < storage.length; ++i) {
    const key = storage.key(i);
    keys.push(key);
  }
  const els = {};
  for (let i = 0; i < keys.length; ++i) {
    const key = keys[i];
    // get and unpack item
    const val = storage.getItem(key);
    let store = JSON.parse(val);
      
    // if we have retrieved this event recently; update it.
    // future: background request to update all ( or a page of ) favorite data.
    const [ series_id, single_id ] = key.split('-');
    const evt = await dataPool.getDaily(single_id, {fetch: false});
    if (evt) {
      store = updateStorage(key, evt, store.created);
    } 
    // poke in the ids so it looks more like what comes from the server.
    store.data.id = series_id;
    store.data.caldaily_id = single_id;
    els[key]= store;
  }
  return els;
}

// returns true or false
function hasFavorite(evt) {
  const key = getKeyForDaily(evt);
  return !!storage.getItem(key); 
}

// 
async function removeFavorite(evt) {
  const key = getKeyForDaily(evt);
  storage.removeItem(key);
}

// FIX: update (even in listing) can throw errors if out of spacwe.
async function addFavorite(evt) {
  const key = getKeyForDaily(evt);
  return updateStorage(key, evt);
}

// ------------------------------------------------------------
// internal helpers
// ------------------------------------------------------------

function getKeyForDaily(evt) {
  const series_id = evt.id;
  const single_id = evt.caldaily_id;
  return `${series_id}-${single_id}`;
}

function updateStorage(key, evt, created = false) {
  const timestamp = dayjs().unix();
  const store = {
    created: created || timestamp,
    modified: timestamp, // ex. 1548381600
    data: pick(evt),
  };
  storage.setItem(key, JSON.stringify(store)); 
  return store;
}

// only store a subset of fields
// ( for the sake of space, and the screen only shows so much anyway )
// doesn't store newsflash: there's no fast refresh; it might be stale.
function pick(evt) {
  let out = {};
  [
    'title', 
    'tinytitle', 
    'date',
    'time',
    'endtime',
    'address',
    'venue',
    'organizer',
    'area',
    'featured',
    'audience',
    'cancelled',
    'safety'
  ].forEach(k => {
    const v = evt[k];
    if (v) {
      // replace 'true' with '1' and save 5 chars.
      out[k] = (v === true) ? 1 : v;
    }  
  });
  return out;
} 

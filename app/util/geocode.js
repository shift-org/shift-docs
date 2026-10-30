/**
 * Geocode: looks up map coordinates for an event's starting location.
 *
 * Uses a Nominatim ( OpenStreetMap ) search server, configured by
 * SHIFT_GEOCODER_URL ( see config.js ). Lookups happen when an organizer
 * saves their event, and only when the location text has changed.
 *
 * https://nominatim.org/release-docs/develop/api/Search/
 * https://operations.osmfoundation.org/policies/nominatim/
 * ( the public server allows at most one request per second,
 *   and requires an identifying user agent. )
 */
const config = require("../config");
const { Area } = require("../models/calConst");

// how long to wait on the geocoder before giving up.
// ( the organizer is waiting on the save. )
const timeoutMs = 3000;

// city names to help the search; organizers often leave them out.
const cities = {
  [Area.Portland]: "Portland, OR",
  [Area.Vancouver]: "Vancouver, WA",
};

// returns the text to search for: the address, plus the city.
// the location name is used as a fallback.
// ex. "915 SE Hawthorne Blvd, Portland, OR"
function searchText(evt) {
  const city = cities[evt.area] || cities[Area.Portland];
  const place = (evt.address || "").trim() || (evt.locname || "").trim();
  return place ? `${place}, ${city}` : "";
}
exports.searchText = searchText;

// promises { lat, lng } for the passed text; or null if nothing matched.
// rejects on network or server errors.
async function lookup(text) {
  const geo = config.geocoder;
  const url = new URL(geo.url);
  url.searchParams.set('q', text);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '1');
  url.searchParams.set('countrycodes', 'us');
  // prefer places in the portland area, but don't exclude others.
  url.searchParams.set('viewbox', geo.viewbox);
  if (geo.email) {
    url.searchParams.set('email', geo.email);
  }
  const res = await fetch(url, {
    headers: { 'User-Agent': geo.userAgent },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) {
    throw new Error(`geocoder responded ${res.status}`);
  }
  const places = await res.json();
  const place = places[0];
  const lat = place && parseFloat(place.lat);
  const lng = place && parseFloat(place.lon);
  return (Number.isFinite(lat) && Number.isFinite(lng)) ? { lat, lng } : null;
}
exports.lookup = lookup;

// updates the latitude, longitude of the passed CalEvent
// if its location has changed since the last lookup.
// never rejects: a failed lookup shouldn't prevent saving the event.
// requires a call to storeChange() to save the results.
exports.updateEvent = async function(evt) {
  if (!config.geocoder) {
    return;
  }
  const text = searchText(evt);
  if (text === (evt.geoaddress || "")) {
    return;
  }
  try {
    const found = text ? await lookup(text) : null;
    evt.latitude = found ? found.lat : null;
    evt.longitude = found ? found.lng : null;
    // remember what was searched for, even if there wasn't a match;
    // so the same address isn't searched for again.
    evt.geoaddress = text;
  } catch (err) {
    // leave geoaddress alone, so the next save tries again.
    console.error("geocode failed for", text, err.message);
  }
};

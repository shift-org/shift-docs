/**
 * the intention of data pool is to provide a cache to avoid multiple browser requests
 * but maybe the browser can handle that well enough itself
 */
import dayjs from 'dayjs'

const API_VERSION = '3';
const API_BASE_URL = window.location.origin;
// const API_BASE_URL = "https://api.shift2bikes.org";
const API_EVENTS_URL = new URL(`/api/events.php`, API_BASE_URL);
const API_SEARCH_URL = new URL(`/api/search.php`, API_BASE_URL);

// cache the most recent range.
// useful for front-end development where browser caching is disable.
let _lastRange = {
  key: '',
  data: [],
};

// object containing daily id -> event data.
const caldaily_map = new Map();

function sortTimes() {
  `${date}T${time}`
}

const debugFormat = "dddd YYYY-MM-DD";

export default {
  // caldaily_id as a string
  // returns a single event blob
  // can throw an error.
  async getDaily(caldaily_id, options = null) {
    const cached = caldaily_map.get(caldaily_id);
    if (cached) {
      return cached;
    } else if (!options || options.fetch === false) {
      // grab one event:
      const url = buildUrl(API_EVENTS_URL, {id: caldaily_id});
      const resp = await fetch(url);  // fetch is built-in browser api
      const data = await resp.json();  // a list of one [ event ]
      if (data.error) {
        throw new Error(data.error.message || "unknown error");
      } 
      const oneEvent = (data && data.events?.length > 0) ? data.events[0] : null;
      if (oneEvent) {
        caldaily_map.set(caldaily_id, oneEvent);
      }
      return oneEvent;
    }
  },
  // expects two valid dayjs objects; returns json.
  // if its not json, this exceptions
  async getRange(start, end) {
    if (!start || !end || !start.isValid() || !end.isValid() || end.isBefore(start)) {
      throw new Error(`requesting invalid date range: ${start} to ${end}`);
    }
    let data;
    const startdate = start.format("YYYY-MM-DD");
    const enddate = end.format("YYYY-MM-DD");
    const key = startdate + enddate;
    if (_lastRange.key === key) {
      data = _lastRange.data;
    } else {
      const url = buildUrl(API_EVENTS_URL, { startdate, enddate });
      console.log(`fetching ${url}`);
      const resp = await fetch(url);  // fetch is built-in browser api
      data = await resp.json(); // data => { events: [], pagination: {} }
      mungeEvents(data.events);
     _lastRange = { key, data };
    }
    return data;
  },
  // searching
  async getSearch(q, offset) {
    const url = buildUrl(API_SEARCH_URL, { q, o: offset });
    console.log(`fetching ${url}`);
    const resp = await fetch(url); 
    const data = await resp.json(); // data => { events: [], pagination: {} }
    mungeEvents(data.events);
    return data;
  }
}

// change dates into dayjs; and sort.
function mungeEvents(events) {
  events.forEach((evt, i) => {
    events[i].datetime = dayjs(`${evt.date}T${evt.time}`);
    caldaily_map.set(evt.caldaily_id, evt);
  });
  events.sort((a, b) => 
    a.datetime.isBefore(b.datetime) ? -1 : 
    a.datetime.isAfter(b.datetime) ? 1 : 0); 
}

function buildUrl(endpoint, pairs) {
  const url = new URL(endpoint);
  for (const [key, value] of Object.entries(pairs)) {
    if (value) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}
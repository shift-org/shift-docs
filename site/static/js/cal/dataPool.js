/**
 * the intention of data pool is to provide a cache to avoid multiple browser requests
 * but maybe the browser can handle that well enough itself
 */
import siteConfig from './siteConfig.js'

// https://www.shift2bikes.org/api/events.php?start=2025-01-19
const endpoint = siteConfig.apiEndpoint + 'events.php';

// cache the most recent range.
// useful for front-end development where browser caching is disable.
let lastRange = {
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
  // expects two valid dayjs objects; returns json.
  // TODO: timeout?
  async getRange(start, end) {
    if (!start || !end || !start.isValid() || !end.isValid() || end.isBefore(start)) {
      throw new Error(`requesting invalid date range: ${start} to ${end}`);
    }
    let data;
    const startDate = start.format("YYYY-MM-DD");
    const endDate = end.format("YYYY-MM-DD");
    const key = startDate + endDate;
    if (lastRange.key === key) {
      data = lastRange.data;
    } else {
      const apiUrl = `${endpoint}?startdate=${startDate}&enddate=${endDate}`;
      // TODO: timeout?
      console.log(`fetching ${start.format(debugFormat)} to ${end.format(debugFormat)}`);
      const resp = await fetch(apiUrl);  // fetch is built-in browser api
      data = await resp.json(); // data => { events: [], pagination: {} }

      data.events.forEach((evt, i) => {
        data.events[i].datetime = dayjs(`${evt.date}T${evt.time}`);
        caldaily_map.set(evt.caldaily_id, evt);
      });
      // ( FIX: order the times on the server )
      data.events.sort((a, b) => 
          a.datetime.isBefore(b.datetime) ? -1 : 
          a.datetime.isAfter(b.datetime) ? 1 : 0); 
      lastRange = { key, data };
    }
    return data;
  },
  // caldaily_id as a string
  // returns a single event blob.
  async getDaily(caldaily_id) {
    const cached = caldaily_map.get(caldaily_id);
    if (cached) {
      return cached;
    } else {
      // grab one event:
      const url = endpoint + '?id=' + caldaily_id;
      const resp = await fetch(url);  // fetch is built-in browser api
      const data = await resp.json();  // a list of one [ event ]
      const oneEvent = (data && data.events.length > 0) ? data.events[0] : false;
      if (oneEvent) {
        caldaily_map.set(caldaily_id, oneEvent);
      }
      return oneEvent;
    }
  },
}

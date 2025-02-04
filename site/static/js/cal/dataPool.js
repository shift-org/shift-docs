/**
 * the intention of data pool is to provide a cache to avoid multiple browser requests
 * but maybe the browser can handle that well enough itself
 */
import siteConfig from './siteConfig.js'

// https://www.shift2bikes.org/api/events.php?startdate=2025-01-19&enddate=2025-01-28
const endpoint = siteConfig.apiEndpoint + 'events.php';

// cache the most recent range.
// useful for front-end development where browser caching is disable.
let lastRange = {
  key: '',
  data: [],
};

// object containing daily id -> event data.
const caldaily_map = new Map();

export default {
  // expects dayjs objects; returns json 
  async getRange(start, end) {
    let data;
    const startDate = start.format("YYYY-MM-DD");
    const endDate = end.format("YYYY-MM-DD");
    const key = startDate + endDate;
    if (lastRange.key === key) {
      data = lastRange.data;
    } else {
      const url = endpoint +
           '?startdate=' + startDate +
           '&enddate=' + endDate;
      const resp = await fetch(url);  // fetch is built-in browser api
      data = await  resp.json(); // data => { events: [], pagination: {} }
      data.events.forEach( evt => {
        // evt.date -- pretransform the date to dayjs?
        caldaily_map.set(evt.caldaily_id, evt);
      });
      lastRange = { key, data };
    }
    return data;
  },
  // caldaily_id as a string
  // returns a single event blob.
  // ( unlike getRange it doesn't have any pagination )
  async getDaily(caldaily_id) {
    const cached = caldaily_map.get(caldaily_id);
    if (false && cached) {
      return cached;
    } else {
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

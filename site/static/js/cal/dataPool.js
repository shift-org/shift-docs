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
}

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
      data = resp.json();
      // data = { events: [], pagination: {} }
      lastRange = { key, data };
    }
    return data;
  },
  // caldaily_id as a string
  async getDaily(caldaily_id) {
    const url = endpoint + '?id=' + caldaily_id;
    const resp = await fetch(url);  // fetch is built-in browser api
    // returns a list of one event
    const data = await resp.json();
    return (data && data.events.length > 0) ? data.events[0] : false;
  },
}

//  * dataPool.getDaily
//  * dataPool.getRange
//  * dataPool.loadMore( key? days? )
let dataPool = {};

// https://www.shift2bikes.org/api/events.php?startdate=2025-01-19&enddate=2025-01-28

// FIX -- use local ( where base is just the /api/ part )
const base = "https://www.shift2bikes.org/api/"
const endpoint = base + 'events.php';

export default {
  // expects dayjs
  // returns json 
  async getRange(start, end) {
    const url = endpoint +
         '?startdate=' + start.format("YYYY-MM-DD") +
         '&enddate=' + end.format("YYYY-MM-DD");
    const resp= await fetch(url);
    return resp.json();
  },
  async getDaily(caldaily_id) {
    const url = endpoint + '?id=' + caldaily_id;
    const resp= await fetch(url);
    // returns a list of one event
    const data = await resp.json();
    return (data && data.events.length > 0) ? data.events[0] : false;
  },
}

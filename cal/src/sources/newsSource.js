/**
 */
import dayjs from 'dayjs'
const newsData = fetch("/news/index.json").then((response) => response.json());

export default {
  name: "newsSource",
  // news records look like: {
  //  "name": "bridge-closure",
  //  "startdate": "2025-06-16",
  //  "title": "Bridge Closure!",
  //  "url": "/news/bridge-closure/"
  // }
  async getRange(start, end) {
    const news = await newsData;
    // the filter removes empty records
    return news.filter(n => !!n).map(n => {
      const d = dayjs(n.startdate).startOf('day');
      const inRange = !d.isBefore(start) && !d.isAfter(end);
      // returns an empty record if out of range
      // otherwise, returns the info needed for the news item
      return inRange && {
          uid:  n.name,
          type: 'news',
          moment: d,  
          nudge: Number.MIN_VALUE,
          title: n.title,
          url: n.url,
        }
      });
  }
}

const config = require('server/core/config');
const { EventStatus } = require('server/model/shorthands');
const dt = require('server/util/dateTime');

/**
 *  static helper functions for processing caldaily style table data.
 */
class DailyData {
  // return a url which provides a view of this particular occurrence.
  // ex. https://localhost:4443/calendar/event-13662
  static getShareable(at) {
    return config.site.url("calendar", `event-${at.pkid}`);
  }

  // return true if the occurrence has been cancelled
  static isCancelled(at) {
    return at.eventstatus !== EventStatus.Active.toString();
  }

  // return a complete summary of this occurrence.
  // (ex. for the events endpoint.)
  static getSummary(at) {
    return {
      // FIX? change the client to just use the 'date'
      // ex. instead of the permalink being: /calendar/event-34243
      // the permalink could become /calendar/events/<series>/YYYY-MM-DD
      // ( even the db doesn't truly need the pkid.... )
      caldaily_id: at.pkid.toString(),
      date: dt.toYMDString(at.eventdate),
      status: at.eventstatus,
      newsflash: at.newsflash,
      // FIX? the client could infer this from the other data.
      // but if we want it... maybe include in the other status blob too.
      shareable: DailyData.getShareable(at),
      // FIX? the client could determine this by looking at 'status'
      cancelled: DailyData.isCancelled(at)
    };
  }
};

// export!
module.exports = DailyData;
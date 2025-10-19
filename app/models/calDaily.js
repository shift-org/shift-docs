const config = require("../config");
const dt = require("../util/dateTime");
const { EventStatus } = require("./calConst");

const CalDaily = {
  // return a url which provides a view of this particular occurrence.
  // ex. https://localhost:4443/calendar/event-13662
  getShareable(at) {
    return config.site.url("calendar", `event-${at.pkid}`);
  },

  // return true if the occurrence has been removed from the calendar; false otherwise.
  // ( differentiates between explicitly canceled, and no longer scheduled. )
  isDelisted(at) {
    return at.eventstatus == EventStatus.Delisted;
  },

  // return true if the occurrence has been cancelled or delisted;
  // false if confirmed.
  // fix: an isConfirmed() would make more sense.
  isUnscheduled(at) {
    return (at.eventstatus == EventStatus.Cancelled) ||
           (at.eventstatus == EventStatus.Delisted);
  },

  // newflash contains text from the user; 
  // typically for canceled or rescheduled events.
  getSafeNews(at) {
    // don't send newsflash when delisted:
    // it's not scheduled and may be deleted
    // either way, its not info we want to show.
    // TBD: maybe clear the newsflash on delisting instead?
    return !CalDaily.isDelisted(at) ? at.newsflash : null;
  },
  
  // return a complete summary of this occurrence.
  // (ex. for the events endpoint.)
  getSummary(at) {
    return {
      // FIX? change the client to just use the 'date'
      // ex. instead of the permalink being: /calendar/event-34243
      // the permalink could become /calendar/events/<series>/YYYY-MM-DD
      // ( even the db doesn't truly need the pkid.... )
      caldaily_id: at.pkid.toString(),
      date: dt.toYMDString(at.eventdate),
      status: at.eventstatus,
      newsflash: CalDaily.getSafeNews(at),
      // FIX? the client could infer this from the other data.
      // but if we want it... maybe include in the other status blob too.
      shareable: CalDaily.getShareable(at),
      // FIX? the client could determine this by looking at 'status'
      cancelled: CalDaily.isUnscheduled(at), // better would have been "scheduled:true"
    };
  }
};

// export!
module.exports = CalDaily;
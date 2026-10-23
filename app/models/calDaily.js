const knex = require('shift-docs/db');
const config = require('shift-docs/config');
const dt = require('../util/dateTime');
const { EventStatus } = require('shift-docs/models/newConst');

// return an object containing: {
//   id:   CalDaily primary key.
//   date: YYYY-MM-DD ( ex. 2006-01-02 )
//   status: a single letter: 'A' for active, or 'C' for cancelled.
//   newsflash: a special bit of text from the user, typically for canceled or rescheduled events.
// }
function getStatus(at) {
  return {
    id : at.pkid.toString(),
    date : dt.toYMDString(at.eventdate),
    status : at.eventstatus,
    newsflash : at.newsflash
  };
}

// helper to add methods to a returned database object.
const methods =  {

  // return a url which provides a view of this particular occurrence.
  // ex. https://localhost:4443/calendar/event-13662
  getShareable() {
    return config.site.url("calendar", `event-${this.pkid}`);
  },

  // return a url which exports this particular occurrence to calendar apps
  // ex. https://localhost:4443/api/ics.php?event_id=13662
  getExportable() {
    return config.site.url("api", `ics.php?event_id=${this.pkid}`);
  },

  // return true if the occurrence has been cancelled or delisted;
  // false if confirmed.
  // fix: an isConfirmed() would make more sense.
  isUnscheduled() {
    return (this.eventstatus === EventStatus.Cancelled.toString());
  },

  getNewsFlash() {
    return this.newsflash;
  },

  // return a summary of this occurrence for the "events" endpoint.
  // backcompat: include the endtime if specified.
  getSchedule(endtime) {
    const data = {
      date: dt.toYMDString(this.eventdate),
      caldaily_id: this.pkid.toString(),
      shareable: this.getShareable(),
      exportable: this.getExportable(),
      cancelled: this.isUnscheduled(), // better would have been "scheduled:true"
      // don't send newsflash when delisted:
      // it's not scheduled and may be deleted
      // either way, its not info we want to show.
      newsflash: this.getNewsFlash(),
      status: this.eventstatus,
      fullcount: this.fullcount, // Full count of results for pagination
    };
    // see notes in CalEvent.getSummary()
    if (endtime !== undefined) {
      data.endtime = endtime;
    }
    return data;
  }
};

function addMethods(res) {
  return Object.assign(res, methods);
}

class CalDaily {

  // promises one CalDaily for published events.
  // yields null if not found or not published.
  static getByDailyID(pkid) {
    return knex
      .query('view_event_schedule')
      .where('pkid', pkid)
      .first()
      .then(function(at) {
        return at? addMethods(at): null;
      });
  }

  // promises an array of CalDaily(s) for published events.
  static getByEventID(id) {
    return knex
      .query('view_event_schedule')
      .where('id', id)
      .then(function(dailies) {
        return dailies.map(at => addMethods(at));
      });
  }

  // promise an array of cal daily statuses, including unpublished days.
  static getStatusesByEventId(id) {
    return knex
      .query('view_all_days')
      .where('id', id)
      .orderBy('eventdate')
      .then(dailies => dailies.map(getStatus));
  }

  // Promises all occurrences of any CalDaily within the specified date range....
  // including excluded and delisted ones. ( see also: getRangeVisible )
  // Days are datejs objects.
  static getFullRange(firstDay, lastDay) {
    return knex
      .query('view_event_schedule')
      .where('eventdate', '>=', dt.toYMDString(firstDay))
      .where('eventdate', '<=', dt.toYMDString(lastDay))
      .orderBy('eventdate')
      .then(function(dailies) {
        return dailies.map(at => addMethods(at));
      });
  }

  // Promises all occurrences of any scheduled CalDaily within the specified date range.
  // Days are datejs objects.
  static getRangeVisible(firstDay, lastDay) {
   const min = dt.toYMDString(firstDay);
   const max = dt.toYMDString(lastDay);
   return knex
      .query('view_event_schedule')
      .where('eventdate', '>=', min)
      .where('eventdate', '<=', max)
      .orderBy('eventdate')
      .then(function(dailies) {
        return dailies.map(at => addMethods(at));
      });
  }
  // Promises all occurrences of any scheduled CalDaily within the specified date range.
  // Days are datejs objects.
  static getEventsBySearch(firstDay, term, limit, offset, searchOldEvents=false) {
    const query = knex.query('view_event_schedule')
        .column(knex.query.raw('*, COUNT(*) OVER() AS fullcount'))  // COUNT OVER is our pagination hack
        .where(function(q) {
          q.where('title', 'LIKE', `%${term}%`)
              .orWhere('descr', 'LIKE', `%${term}%`)
              .orWhere('name', 'LIKE', `%${term}%`);
        })
        .where(function(q) {
          // If we're NOT searching for old events, aka future search, look today and greater.
          if (!searchOldEvents) {
            q.where('eventdate', '>=', dt.toYMDString(firstDay))
          }
        })
        .where(function(q) {
          // If we ARE searching for old events, only show old events, including today's events.  [#1004]
          // Decision stardate 2025-11-03 by JP; AK
          if (searchOldEvents) {
            q.where('eventdate', '<=', dt.toYMDString(firstDay))
          }
        })
        // If we are searching old events, eventdata claus never occurs and we add a desc to the ordering.
        .orderBy('eventdate', searchOldEvents? 'desc' : 'asc')
        .orderBy('eventtime', searchOldEvents? 'desc' : 'asc')
        .orderBy('title', 'asc')
        .limit(limit)              // Limit the query but
        .offset(offset);           // accept the offset from the client
    // console.log(query.toSQL().toNative());
    return query.then(function(rows) {
      return rows.map(at => addMethods(at));
    });
  }
  // Promises all occurrences of any scheduled CalDaily within the specified date range.
  // Days are datejs objects.
  static getEventsCount(startDate, endDate) {
    const currDate = dt.toYMDString();
    const query = knex.query('view_event_schedule')
        .column(knex.query.raw('COUNT(*) as total'))
        .column(knex.query.raw('COUNT(CASE WHEN eventdate < ? THEN 1 END) AS past', [currDate]))
        .column(knex.query.raw('COUNT(CASE WHEN eventdate >= ? THEN 1 END) AS upcoming', [currDate]))
        .where(function(q) {
          q.whereNot('eventstatus', EventStatus.Cancelled.toString())
        })
        .where(function(q) {
          q.where('eventdate', '>=', dt.toYMDString(startDate))
          q.where('eventdate', '<=', dt.toYMDString(endDate))
        }).first();
    // console.log(query.toSQL().toNative());
    return query;
  }

  // for testing:
  static wrap(res) {
    return addMethods(res);
  }
  static methods = methods;
};

// export!
module.exports = { CalDaily };

const knex = require('shift-docs/db');
const config = require('shift-docs/config');
const dt = require('../util/dateTime');
const { EventStatus } = require('shift-docs/models/newConst');


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

  isDelisted() {
    return this.eventstatus === EventStatus.Delisted.toString();
  },

  isCancelled() {
    return this.eventstatus === EventStatus.Cancelled.toString();
  },

  isUnscheduled() {
    return this.isDelisted() || this.isCancelled();
  },

  getNewsFlash() {
    return !this.isDelisted() ? this.newsflash : null;
  },

  // return a summary of this occurrence for the "events" endpoint.
  // backcompat: include the endtime if specified.
  getSchedule(deleted, endtime) {
    const data = {
      date: dt.toYMDString(this.eventdate),
      caldaily_id: this.pkid.toString(),
      shareable: this.getShareable(),
      exportable: this.getExportable(),
      // if deleted, report as cancelled.
      cancelled: !deleted ? this.isUnscheduled() : true,
      // if deleted, report without news
      newsflash: !deleted ? this.getNewsFlash() : null,
      // if deleted, report as delisted
      status: !deleted ? this.eventstatus : EventStatus.Delisted,
      // Full count of results for pagination
      fullcount: this.fullcount,
    };
    // see notes in CalEvent.getSummary()
    if (endtime !== undefined) {
      data.endtime = dt.to24HourString(endtime);
    }
    return data;
  }
};

function addMethods(res) {
  return Object.assign(res, methods);
}

class CalDaily {

  // promises one day of a published event
  // pkid is the id of the scheduled day
  // yields null if not found ( or not published. )
  static getByDailyID(pkid) {
    return knex
      .query('view_event_schedule')
      .where('pkid', pkid)
      .first()
      .then(function(at) {
        return at? addMethods(at): null;
      });
  }

  // promises an array of CalDaily(s) for a published event.
  // ex. the ical view of all days from an entire event series.
  static getByEventID(id) {
    return knex
      .query('view_event_schedule')
      .where('id', id)
      .then(function(dailies) {
        return dailies.map(at => addMethods(at));
      });
  }

  // promises an array of cal daily objects for editing events.
  // including events which haven't been published yet.
  // revoked events can't be edited: they shouldn't use this function.
  static getStatusesByEventId(id) {
    // return objects containing: {
    //   id:   CalDaily primary key.
    //   date: YYYY-MM-DD ( ex. 2006-01-02 )
    //   status: a single letter: 'A' for active, or 'C' for cancelled.
    //   newsflash: a special bit of text from the user, typically for canceled or rescheduled events.
    return knex
      .query('view_all_days')
      .where('id', id)
      .whereNot('eventstatus', 'D')
      .orderBy('eventdate')
      .then(dailies => dailies.map(at => {
        return {
          id: at.pkid.toString(),
          date: dt.toYMDString(at.eventdate),
          status: at.eventstatus,
          newsflash : at.newsflash
        };
      }));
  }

  // Promises CalDaily objects for all occurrences of
  // any published events within the specified date range.
  // The passed dates are datejs objects.
  static getDateRange(firstDay, lastDay, includeAllEvents = false) {
   const min = dt.toYMDString(firstDay);
   const max = dt.toYMDString(lastDay);
   return knex
      .query('view_published_series')
      // ie. using(id) -- but knex doesn't support that.
      .join('view_all_days', 'view_all_days.id', '=', 'view_published_series.id')
      .where(q => {
        if (!includeAllEvents) {
          // exclude deleted events delisted days
          q.whereNot('deleted', 1).whereNot('eventstatus', 'D');
        }
      })
      .where('eventdate', '>=', min)
      .where('eventdate', '<=', max)
      .orderBy('eventdate')
      .then(dailies => dailies.map(addMethods));
  }

  // Promises CalDaily objects for all occurrences of
  // any published events matching the passed search terms.
  static getEventsBySearch(firstDay, term, limit, offset, searchOldEvents = false) {
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

  // Promises an object containing the number of scheduled events within the specified date range.
  // The object contains { total, past, upcoming } where past and upcoming are relative to the current date and time.
  // The passed dates are datejs objects.
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

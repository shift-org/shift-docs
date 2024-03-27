const knex = require("../knex");
const config = require("../config");
const dt = require("../util/dateTime");
const { EventStatus, Review } = require("./calConst");

// helper to add methods to a returned database object.
const methods =  {
  // was this record read from the database?
  exists() {
    return !!this.pkid;
  },

  // store to the db if force is true.
  // promises this object when done.
  _store(force= true) {
    return force ? knex.store('caldaily', 'pkid', this) : Promise.resolve(this);
  },

  // Remove this record from the db.
  // promises this object when done.
  // WARNING: should really only call this for unpublished events
  // otherwise the ical clients might not see the change in the event.
  eraseOccurrence() {
    return knex.del('caldaily', 'pkid', this);
  },

  // Mark the day as having been removed from the calendar, and update the db.
  // Promises "this" after storing the change.
  delistOccurrence() {
    let changed = false;
    if (this.eventstatus !== EventStatus.Delisted) {
      this.eventstatus = EventStatus.Delisted;
      changed = true;
    }
    return this._store(changed).then(_ => this);
  },

  // store the status and newflash if they changed.
  // promises this after storing the change.
  // note: flourish stored empty strings as null; so we do the same.
  _updateStatus(dateStatus) {
    let changed = false;
    const newStatus = dateStatus.status || null;
    if (this.eventstatus !== newStatus) {
      this.eventstatus = newStatus;
      changed = true;
    }
    const newsFlash = dateStatus.newsflash || null;
    if (this.newsflash !== newsFlash) {
      this.newsflash = newsFlash;
      changed = true;
    }
    return this._store(changed).then(_ => this);
 },

  // returns a date in YYYY-MM-DD format ( ex. 2006-01-02 )
  getFormattedDate() {
    // note: dates are returned by the mysql2 driver as a json Date.
    return dt.toYMDString( this.eventdate );
  },

  // return an object containing: {
  //   id:   CalDaily primary key.
  //   date: YYYY-MM-DD ( ex. 2006-01-02 )
  //   status: a single letter: 'A' for active, or 'C' for cancelled.
  //   newsflash: a special bit of text from the user, typically for canceled or rescheduled events.
  // }
  // note: used by the "manage" and "retrieve" endpoints.
  getStatus() {
    return {
      id : this.pkid.toString(),
      date : this.getFormattedDate(),
      status : this.eventstatus,
      newsflash : this.newsflash
    };
  },

  // return a url which provides a view of this particular occurrence.
  // ex. https://localhost:4443/calendar/event-13662
  getShareable() {
    return config.site.url("calendar", `event-${this.pkid}`);
  },

  // return true if the occurrence has been removed from the calendar; false otherwise.
  // ( differentiates between explicitly canceled, and no longer scheduled. )
  isDelisted() {
    return this.eventstatus == EventStatus.Delisted;
  },

  // return true if the occurrence has been cancelled or delistd;
  // false if confirmed.
  // fix: an isConfirmed() would make more sense.
  isUnscheduled() {
    return (this.eventstatus == EventStatus.Cancelled) ||
           (this.eventstatus == EventStatus.Delisted);
  },

  // return a summary of this occurrence for the "events" endpoint.
  // backcompat: include the endtime if specified.
  getJSON(endtime) {
    let data = {
      date: this.getFormattedDate(),
      caldaily_id: this.pkid.toString(),
      shareable: this.getShareable(),
      cancelled: this.isUnscheduled(),
      newsflash: this.newsflash,
    };
    // see notes in CalEvent.getJSON()
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
  // promise a new occurrence of an existing event in the database.
  // dateStatus['date'] is YYYY-MM-DD
  static createNewEventDaily(evt, dateStatus) {
    if (!evt || !evt.id) {
      throw new Error("daily requires a valid event id");
    }
    const eventdate = dt.fromYMDString(dateStatus && dateStatus.date);
    if (!eventdate.isValid()) {
      throw new Error("daily requires a valid YMD string");
    }
    const at = addMethods({
      id: evt.id,
      // for the sake of the sqlite driver, convert to a javascript date manually
      // the mysql driver does this automatically.
      eventdate: eventdate.toDate(),
      // defaults here are mainly to simplify testing
      // in theory, the client always specifies them
      eventstatus: dateStatus.status || EventStatus.Active,
      newsflash: dateStatus.newsflash || null,
    });
    // store the new daily.
    return at._store();
  }

  // promises one CalDaily from the db only for tests.
  static getForTesting(pkid) {
    return knex
      .query('caldaily')
      .where('pkid', pkid)
      .first()
      .then(function(at) {
        return at? addMethods(at): null;
      });
  }

  // promises one CalDaily but only for published Events.
  // yields null if not found or not published.
  // ( this is the php EventTime::getByID )
  static getByDailyID(pkid) {
    return knex
      .query('caldaily')
      .join('calevent', 'caldaily.id', 'calevent.id') // join for hidden test.
      .where('pkid', pkid)
      .whereNot('hidden', 1) // calevent.hidden is 0 once published
      .whereNot('eventstatus', EventStatus.Delisted)
      .first()
      .then(function(at) {
        return at? addMethods(at): null;
      });
  }

  // promises an array of CalDaily(s).
  // aka. the php buildEventTime('id')
  static getByEventID(id) {
    return knex
      .query('caldaily')
      .where('id', id)
      .then(function(dailies) {
        return dailies.map(at => addMethods(at));
      });
  }

  // promise an array of cal daily statuses
  // ( similar to the php  getEventDateStatuses() )
  static getStatusesByEventId(id) {
    return CalDaily.getByEventID(id).then((dailies) => {
      // fix: rather than filtering here, add a filter to getByEventId
      // trying to keep it somewhat like the php right now.
      return dailies.filter(at=> !at.isDelisted()).map(at => at.getStatus());
    });
  }

  // Promises all occurrences of any CalDaily within the specified date range....
  // including excluded and delisted ones. ( see also: getRangeVisible )
  // Days are datejs objects.
  static getFullRange(firstDay, lastDay) {
    return knex
      .query('caldaily')
      .join('calevent', 'caldaily.id', 'calevent.id')
      .whereNot('hidden', 1)         // hidden is 0 once published
      .where('eventdate', '>=', firstDay.toDate())
      .where('eventdate', '<=', lastDay.toDate())
      .orderBy('eventdate')
      .then(function(dailies) {
        return dailies.map(at => addMethods(at));
      });
  }

  // Promises all occurrences of any scheduled CalDaily within the specified date range.
  // Days are datejs objects.
  static getRangeVisible(firstDay, lastDay) {
   return knex
      .query('caldaily')
      .join('calevent', 'caldaily.id', 'calevent.id')
      .whereNot('hidden', 1)                         // calevent: hidden is 0 once published
      .whereNot('review', Review.Excluded)           // calevent: a legacy status code.
      .whereNot('eventstatus', EventStatus.Skipped)  // caldaily: a legacy status code.
      .whereNot('eventstatus', EventStatus.Delisted) // caldaily: for soft deletion.
      .where('eventdate', '>=', firstDay.toDate())   // caldaily: instance of the event.
      .where('eventdate', '<=', lastDay.toDate())
      .orderBy('eventdate')
      .then(function(dailies) {
        return dailies.map(at => addMethods(at));
      });
  }
  /**
   * Add, cancel, and update occurrences of a particular event.
   *
   * @param  event the relevant event.
   * @param  statusMap a js Map containing {YYYY-MM-DD: dateStatus }
   * @return the promise of valid CalDaily(s)
   *
   * @see: DateStatus.php, manage_event.php
   */
  static reconcile(evt, statusMap, softDelete = true) {
    return CalDaily.getByEventID(evt.id).then((dailies) => {
      const promises = []; // our promised CalDaily(s)
      const skips = [];    // promises we wait on, but dont return.
      dailies.forEach((at)=> {
        // the map is keyed by date string:
        const date = at.getFormattedDate();
        const status = statusMap.get(date);
        // if our event time is still desired by the organizer:
        // update the status with whatever the organizer provided.
        // otherwise: the organizer wants to remove the occurrence.
        // so cancel or delete the time depending on whether the event is published.
        if (status) {
          const after = at._updateStatus(status);  // automatically calls store()
          promises.push( after );
          statusMap.delete( date );            // remove from map, so we dont create it (below)
        } else if (softDelete) {
          const after = at.delistOccurrence(); // automatically calls store()
          skips.push( after );                 // not in the map, so dont have to remove.
        } else {
          const after = at.eraseOccurrence();  // also not in the map, ...
          skips.push( after );
        }
      });
      // create any (new) days the organizer requested:
      statusMap.forEach((status)=> {
        const at = CalDaily.createNewEventDaily(evt, status);
        promises.push( at );
      });
      // wait till any removals are completed
      // then return the promised statuses
      return Promise.all(skips).then(() => {
        return Promise.all(promises);
      });
    });
  }

  // for testing:
  static wrap(res) {
    return addMethods(res);
  }
  static methods = methods;
};

// export!
module.exports = { CalDaily };

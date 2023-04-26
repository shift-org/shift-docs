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

  // delete this record from the db.
  // promises this object when done.
  // WARNING: should really only call this for unpublished events
  // otherwise the ical clients might not see the change in the event.
  deleteOccurrence() {
    return knex.del('caldaily', 'pkid', this);
  },

  // Mark this particular occurrence as cancelled, updating the db.
  // promises this after storing the change.
  cancelOccurrence() {
    let changed =  false;
    if (this.eventstatus !== EventStatus.Cancelled) {
      this.eventstatus = EventStatus.Cancelled;
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

  // return true if the event has been cancelled; false otherwise.
  getCancelled() {
    return this.eventstatus == EventStatus.Cancelled;
  },

  // return a summary of this occurrence for the "events" endpoint.
  // backcompat: include the endtime if specified.
  getJSON(endtime) {
    let data = {
      date: this.getFormattedDate(),
      caldaily_id: this.pkid.toString(),
      shareable: this.getShareable(),
      cancelled: this.getCancelled(),
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
  // promises one CalDaily but only for published Events.
  // ( null if not found or not published. )
  static getByDailyID(pkid) {
    return knex
      .query('caldaily')
      .join('calevent', 'caldaily.id', 'calevent.id')
      .where('pkid', pkid)
      .whereNot('hidden', 1) // hidden is 0 once published
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
  // Promises all occurrences of any CalDaily within the specified date range.
  // Days are datejs objects.
  static getRangeVisible(firstDay, lastDay) {
   return knex
      .query('caldaily')
      .join('calevent', 'caldaily.id', 'calevent.id')
      .whereNot('hidden', 1)         // hidden is 0 once published
      .whereNot('eventstatus', EventStatus.Skipped) // 'S', skipped, a legacy status code.
      .whereNot('review', Review.Excluded)      // 'E', excluded, a legacy status code.
      .where('eventdate', '>=', firstDay.toDate())
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
   * @return the promise of an array of CalDaily
   *
   * @see: DateStatus.php, manage_event.php
   */
  static reconcile(evt, statusMap, softDelete = true) {
    return CalDaily.getByEventID(evt.id).then((dailies) => {
      const promises = []; // promises CalDaily(s)
      dailies.forEach((at)=> {
        // the map is keyed by date string:
        const date = at.getFormattedDate();
        const status = statusMap.get(date);
        // if our event time is still desired by the organizer:
        // update the status with whatever the organizer provided.
        // otherwise: the organizer wants to remove the occurrence.
        // so cancel or delete the time depending on whether the event is published.
        if (status) {
          const after = at._updateStatus(status);  // calls store() if changed.
          promises.push( after );
          statusMap.delete(date);    // remove from the map so we dont create it (below)
        } else if (softDelete) {
          const after = at.cancelOccurrence();     // calls store() if changed.
          promises.push( after );
        } else {
          at.deleteOccurrence();
        }
      });

      // create any (new) days the organizer requested:
      statusMap.forEach((status)=> {
        const at = CalDaily.createNewEventDaily(evt, status);
        promises.push( at );
      });

      // return the promised statuses
      return Promise.all(promises);
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

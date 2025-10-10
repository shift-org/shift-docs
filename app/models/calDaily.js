const knex = require("../knex");
const config = require("../config");
const dt = require("../util/dateTime");
const { EventStatus, Review, EventSearch } = require("./calConst");

const CalDaily = {
  // store to the db if force is true.
  // promises this object when done.
  _store(at, force= true) {
    return force ? knex.store('caldaily', 'pkid', at) : Promise.resolve(at);
  },

  // Remove this record from the db.
  // promises this object when done.
  // WARNING: should really only call this for unpublished events
  // otherwise the ical clients might not see the change in the event.
  eraseOccurrence(at) {
    return knex.del('caldaily', 'pkid', at);
  },

  // Mark the day as having been removed from the calendar, and update the db.
  // Promises "this" after storing the change.
  delistOccurrence(at) {
    let changed = false;
    if (at.eventstatus !== EventStatus.Delisted) {
      at.eventstatus = EventStatus.Delisted;
      changed = true;
    }
    return CalDaily._store(at, changed).then(_ => at);
  },

  // store the status and newflash if they changed.
  // promises this after storing the change.
  // note: flourish stored empty strings as null; so we do the same.
  _updateStatus(at, dateStatus) {
    let changed = false;
    const newStatus = dateStatus.status || null;
    if (at.eventstatus !== newStatus) {
      at.eventstatus = newStatus;
      changed = true;
    }
    const newsFlash = dateStatus.newsflash || null;
    if (at.newsflash !== newsFlash) {
      at.newsflash = newsFlash;
      changed = true;
    }
    return CalDaily._store(at, changed).then(_ => at);
  },

  // return an object containing: {
  //   id:   CalDaily primary key.
  //   date: YYYY-MM-DD ( ex. 2006-01-02 )
  //   status: a single letter: 'A' for active, or 'C' for cancelled.
  //   newsflash: a special bit of text from the user, typically for canceled or rescheduled events.
  // }
  // note: used by the "manage" and "retrieve" endpoints.
  getStatus(at) {
    return {
      id : at.pkid.toString(),
      date : dt.toYMDString(at.eventdate),
      status : at.eventstatus,
      newsflash : at.newsflash
    };
  },

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

  // don't send newsflash when delisted:
  // it's not scheduled and may be deleted
  // either way, its not info we want to show.
  // TBD: maybe clear the newsflash on delisting instead?
  getSafeNews(at) {
    return !CalDaily.isDelisted(at) ? at.newsflash : null;
  },

  // return a summary of this occurrence for the "events" endpoint.
  // backcompat: include the endtime if specified.
  getSummary(at) {
    return {
      date: dt.toYMDString(at.eventdate),
      caldaily_id: at.pkid.toString(),
      shareable: CalDaily.getShareable(at),
      cancelled: CalDaily.isUnscheduled(at), // better would have been "scheduled:true"
      newsflash: CalDaily.getSafeNews(at),
      status: at.eventstatus,
      fullcount: at.fullcount, // for search: Full count of results for pagination
    };
  },

  // promise a new occurrence of an existing event in the database.
  // dateStatus['date'] is YYYY-MM-DD
  createNewEventDaily(evt, dateStatus) {
    if (!evt || !evt.id) {
      throw new Error("daily requires a valid event id");
    }
    const eventdate = dt.fromYMDString(dateStatus && dateStatus.date);
    if (!eventdate.isValid()) {
      throw new Error("daily requires a valid YMD string");
    }
    // store the new daily.
    return CalDaily._store({
      id: evt.id,
      // for the sake of the sqlite driver, convert to a javascript date manually
      // the mysql driver does this automatically.
      eventdate:  knex.toDate(eventdate),
      // defaults here are mainly to simplify testing
      // in theory, the client always specifies them
      eventstatus: dateStatus.status || EventStatus.Active,
      newsflash: dateStatus.newsflash || null,
    });
  },

  // promises one CalDaily from the db only for tests.
  getForTesting(pkid) {
    return knex
      .query('caldaily')
      .where('pkid', pkid)
      .first();
  },

  // promises an array of CalDaily(s).
  // aka. the php buildEventTime('id')
  getByEventID(id) {
    return knex
      .query('caldaily')
      .where('id', id);
  },

  // promise an array of cal daily statuses
  // ( similar to the php  getEventDateStatuses() )
  getStatusesByEventId(id) {
    return CalDaily.getByEventID(id).then((dailies) => {
      // fix: rather than filtering here, add a filter to getByEventId
      // trying to keep it somewhat like the php right now.
      return dailies.filter(at => !CalDaily.isDelisted(at)).map(CalDaily.getStatus);
    });
  },

  /**
   * Add, cancel, and update occurrences of a particular event.
   *
   * @param  event the relevant event.
   * @param  statusMap a js Map containing {YYYY-MM-DD: dateStatus }
   * @return the promise of valid CalDaily(s)
   *
   * @see: DateStatus.php, manage_event.php
   */
  reconcile(evt, statusMap, softDelete = true) {
    return CalDaily.getByEventID(evt.id).then((dailies) => {
      const promises = []; // our promised CalDaily(s)
      const skips = [];    // promises we wait on, but dont return.
      dailies.forEach((at)=> {
        // the map is keyed by date string:
        const date = dt.toYMDString(at.eventdate);
        const status = statusMap.get(date);
        // if our event time is still desired by the organizer:
        // update the status with whatever the organizer provided.
        // otherwise: the organizer wants to remove the occurrence.
        // so cancel or delete the time depending on whether the event is published.
        if (status) {
          const after = CalDaily._updateStatus(at, status);  // automatically calls store()
          promises.push( after );
          statusMap.delete( date );            // remove from map, so we dont create it (below)
        } else if (softDelete) {
          const after = CalDaily.delistOccurrence(at); // automatically calls store()
          skips.push( after );                 // not in the map, so dont have to remove.
        } else {
          const after = CalDaily.eraseOccurrence(at);  // also not in the map, ...
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
};

// export!
module.exports = { CalDaily };

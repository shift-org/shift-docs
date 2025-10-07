const crypto = require("crypto");
const knex = require("../knex");
const { CalDaily } = require("./calDaily");
const { Review } = require("./calConst");
const dt = require("../util/dateTime");
const config = require("../config");

class CalEvent {
  // store to the db if force is true.
  // promises this object when done.
  static _store(evt, force= true) {
    return force ? knex.store('calevent', 'id', evt) : Promise.resolve(evt);
  }

  // aka Event::toArray in php
  static getJSON(evt, {includePrivate}= {}) {
    let duration = evt.eventduration;
    if (duration <= 0) {
      duration = null;
    }
    return CalEvent.isDeleted(evt) ? {
      id        : evt.id.toString(),
      deleted   : true,
    } : {
      id        : evt.id.toString(),
      title     : evt.title,
      venue     : evt.locname,
      address   : evt.address,
      organizer : evt.name,
      details   : evt.descr,
      // note: the driver keeps 'time' as a string
      // ex. "19:00:00"
      // ( 'timestamp', 'datetime', 'date' are converted to js Date )
      time        : evt.eventtime,
      hideemail   : evt.hideemail != 0,       // true if never set
      hidephone   : evt.hidephone != 0,       // true if never set
      hidecontact : evt.hidecontact != 0,     // true if never set
      ridelength  : evt.ridelength,
      timedetails : evt.timedetails,
      locdetails  : evt.locdetails,
      loopride    : !!evt.loopride,    // false if never set ( null )
      locend      : evt.locend,
      eventduration : duration,
      weburl      : evt.weburl,
      webname     : evt.webname,
      // note: the php version *moves* the file here.
      // it feels wrong to do this on get --
      // and not doing it here can only affect legacy events
      // which havent been viewed in recent years...
      // and that seems okay.
      image       : config.image.url(evt.image),
      audience    : evt.audience,
      tinytitle   : evt.tinytitle,
      printdescr  : evt.printdescr,
      datestype   : evt.datestype,
      area        : evt.area,
      featured    : !!evt.highlight,    // false if never set ( null )
      printemail  : !!evt.printemail,   // false if never set ( null )
      printphone  : !!evt.printphone,   // false if never set ( null )
      printweburl : !!evt.printweburl,  // false if never set ( null )
      printcontact: !!evt.printcontact, // false if never set ( null )
      published   : CalEvent.isPublished(evt),
      safetyplan  : !!evt.safetyplan,   // false if never set ( null )
      // note: (null==0) is false, so this wont include email, etc. by default.
      email: (evt.hideemail == 0 || includePrivate) ? evt.email : null,
      phone: (evt.hidephone == 0 || includePrivate) ? evt.phone : null,
      contact: (evt.hidecontact == 0 || includePrivate) ? evt.contact : null,

      // note: the php code puts the end time after the daily status data
      // for now, therefore this is in CalDaily
      // endtime: getEndTime()
    };
  }

  // similar to "fromArray" in php
  static updateFromJSON(evt, data) {
    // ugly: assumes the data is validated and adjusted already.
    Object.assign(evt, data);

    // default highlight to zero; but if it's already set, leave as-is
    // fix: add a default to mysql? could there be db entries with null in there already
    // and why is this happening in "updateFromJSON"?
    evt.highlight = evt.highlight ?? 0;
  }

  // return the starting time as a dayjs object;
  // ( returns an !isValid object for an invalid time )
  // pass an optional dayjs day to compute the time relative to a specific date.
  static getStartTime(evt, fromDay = null) {
    const t = dt.from24HourString(evt.eventtime);
    return fromDay ? dt.combineDateAndTime(fromDay, t) : t;
  }

  // return the ending time as a dayjs object; or null.
  // pass an optional dayjs day to compute the time relative to a specific date.
  // FIX? just like the php version, if the duration is null the end time is null.
  // this seems wrong to me -- it should probably use the minimum 1 hour duration.
  static getEndTime(evt, fromDay = null) {
    let endTime = null;
    const len = evt.eventduration;
    if (len > 0) {
      const start = CalEvent.getStartTime(evt, fromDay);
      if (start.isValid()) {
        endTime = start.add(len, 'minute');
      }
    }
    return endTime;
  }

  // assumes start is a valid dayjs object.
  // generates a 1 hour duration if none was specified.
  static addDuration(evt, start) {
    const len = evt.eventduration;
    return (len > 0) ? start.add(len, 'minute') : start.add(1, 'hour');
  }

  // remove this record and any associated caldaily(s) from the database.
  // promises the total number of erased items when done.
  // NOTE: prefer softDelete() so ical subscribers can see that something has changed.
  static _eraseEvent(evt) {
    return knex.del('calevent', 'id', evt).then((acnt) => {
        return knex.del('caldaily', 'id', evt).then((bcnt) => {
          return acnt + bcnt;
        });
    });
  }

  // cancel all occurrences of this event, and make it inaccessible to the organizer.
  static _softDelete(evt) {
    return CalDaily.getByEventID(evt.id).then((dailies) => {
      return Promise.all( dailies.map(CalDaily.delistOccurrence) ).then(()=> {
        evt.review = Review.Excluded; // excludes from getRangeVisible
        evt.password = "";            // hides it from future editing
        return CalEvent.storeChange(evt);
      });
    });
  }

  // if the event was never published, we can delete it completely;
  // otherwise, soft delete it.  
  static removeEvent(evt) {
    return !CalEvent.isPublished(evt) ? CalEvent._eraseEvent(evt) : CalEvent._softDelete(evt);
  }

  // promise a summary of the CalEvent and all its CalDaily(s)
  // in the php version, the statuses are optional; it's cleaner here to require them.
  static getDetails(evt, statuses, {includePrivate} = {}) {
    // we either have actual times or promises of them:
    return Promise.resolve(statuses).then((statuses) => {
      const details = CalEvent.getJSON(evt, {includePrivate});
      details['datestatuses']= statuses;
      return details;
    });
  }

  // if the secret is valid and matches the password of this CalEvent.
   // ( the password of the event is set at creation time, and cleared when 'deleted' )
  static isSecretValid(evt, secret) {
    return secret && (secret === evt.password);
  }

  // can people looking for rides see this event?
 static isPublished(evt) {
    // note: legacy events have null for the hidden field
    // zero and null are considered published.
    return !evt.hidden;
  }

  // make this event visible to all
  // requires a call to storeChange()
  static setPublished(evt) {
    evt.hidden = 0;
  }

  // soft deleted events are marked as 'E'
  // that makes them inaccessible to the front-end
  // while still showing them on the ical feed ( as canceled. )
  static isDeleted(evt) {
    return evt.review == Review.Excluded;
  }

  // store to the db, updating the change counter.
  // the counter helps subscribers to the ical feed detect changes.
  // promises to return this record with a valid id.
  static storeChange(evt) {
    // update the change counter
    evt.changes = CalEvent.nextChange(evt);
    return CalEvent._store(evt);
  }

  // return the change counter of the next call to store()
  static nextChange(evt) { // watch out for if it never existed.
    return 1 + (evt.changes || 0);
  }
  
  // promises one CalEvent ( null if not found. )
  // tbd: could also fail on not found, but the code seems to read better this way.
  static getByID(id) {
    return knex.query('calevent').where('id', id).first();
  }
  
  // returns one event.
  static newEvent() {
    // uuid4 is 36 chars including hyphens 123e4567-e89b-12d3-a456-426614174000
    // the secret format has been 32 chars no hyphens.
    const password = crypto.randomUUID().replaceAll("-","")
    const hidden = 1; // fix: change sql default?
    return { password, hidden };
  }
};

// exports methods for testing
module.exports = { CalEvent };

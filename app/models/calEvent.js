const crypto = require("crypto");
const knex = require("../knex");
const { CalDaily } = require("./calDaily");
const { Review } = require("./calConst");
const dt = require("../util/dateTime");
const config = require("../config");

// helper to add methods to a returned database object.
const methods =  {

  // aka Event::toArray in php
  getJSON({includePrivate}= {}) {
    let duration = this.eventduration;
    if (duration <= 0) {
      duration = null;
    }

    let out = {
      id        : this.id.toString(),
      title     : this.title,
      venue     : this.locname,
      address   : this.address,
      organizer : this.name,
      details   : this.descr,
      // note: the driver keeps 'time' as a string
      // ex. "19:00:00"
      // ( 'timestamp', 'datetime', 'date' are converted to js Date )
      time        : this.eventtime,
      hideemail   : this.hideemail != 0,       // true if never set
      hidephone   : this.hidephone != 0,       // true if never set
      hidecontact : this.hidecontact != 0,     // true if never set
      length      : null,
      timedetails : this.timedetails,
      locdetails  : this.locdetails,
      loopride    : !!this.loopride,    // false if never set ( null )
      locend      : this.locend,
      eventduration : duration,
      weburl      : this.weburl,
      webname     : this.webname,
      // note: the php version *moves* the file here.
      // it feels wrong to do this on get --
      // and not doing it here can only affect legacy events
      // which havent been viewed in recent years...
      // and that seems okay.
      image       : config.image.url(this.image),
      audience    : this.audience,
      tinytitle   : this.tinytitle,
      printdescr  : this.printdescr,
      datestype   : this.datestype,
      area        : this.area,
      featured    : !!this.highlight,    // false if never set ( null )
      printemail  : !!this.printemail,   // false if never set ( null )
      printphone  : !!this.printphone,   // false if never set ( null )
      printweburl : !!this.printweburl,  // false if never set ( null )
      printcontact: !!this.printcontact, // false if never set ( null )
      published   : this.isPublished(),
      safetyplan  : !!this.safetyplan,   // false if never set ( null )
      // note: (null==0) is false, so this wont include email, etc. by default.
      email: (this.hideemail == 0 || includePrivate) ? this.email : null,
      phone: (this.hidephone == 0 || includePrivate) ? this.phone : null,
      contact: (this.hidecontact == 0 || includePrivate) ? this.contact : null,

      // note: the php code puts the end time after the daily status data
      // for now, therefore this is in CalDaily
      // endtime: getEndTime()
    };
    return out;
  },

  // similar to "fromArray" in php
  updateFromJSON(data) {
    // ugly: assumes the data is validated and adjusted already.
    Object.assign(this, data);

    // default highlight to zero; but if it's already set, leave as-is
    // fix: add a default to mysql? could there be db entries with null in there already
    // and why is this happening in "updateFromJSON"?
    this.highlight = this.highlight ?? 0;
  },

  // return the starting time as a dayjs object;
  // ( returns an !isValid object for an invalid time )
  // pass an optional dayjs day to compute the time relative to a specific date.
  getStartTime(fromDay = null) {
    const t = dt.from24HourString(this.eventtime);
    return fromDay ? dt.combineDateAndTime(fromDay, t) : t;
  },

  // return the ending time as a dayjs object; or null.
  // pass an optional dayjs day to compute the time relative to a specific date.
  // FIX? just like the php version, if the duration is null the end time is null.
  // this seems wrong to me -- it should probably use the minimum 1 hour duration.
  getEndTime(fromDay = null) {
    let endTime = null;
    const len = this.eventduration;
    if (len > 0) {
      const start = this.getStartTime(fromDay);
      if (start.isValid()) {
        endTime = start.add(len, 'minute');
      }
    }
    return endTime;
  },

  // assumes start is a valid dayjs object.
  // generates a 1 hour duration if none was specified.
  addDuration(start) {
    const len = this.eventduration;
    return endTime = (len > 0) ? start.add(len, 'minute') : start.add(1, 'hour');
  },

  // remove this record and any associated caldaily(s) from the database.
  // promises the total number of erased items when done.
  // NOTE: prefer softDelete() so ical subscribers can see that something has changed.
  eraseEvent() {
    return knex.del('calevent', 'id', this).then((acnt) => {
        return knex.del('caldaily', 'id', this).then((bcnt) => {
          return acnt + bcnt;
        });
    });
  },

  // cancel all occurrences of this event, and make it inaccessible to the organizer.
  softDelete() {
    return CalDaily.getByEventID(this.id).then((dailies) => {
      return Promise.all( dailies.map(at => at.delistOccurrence()) ).then(()=> {
        this.review = Review.Excluded; // excludes from getRangeVisible
        this.password = "";            // hides it from future editing
        return this.storeChange();
      });
    });
  },

  // promise a summary of the CalEvent and all its CalDaily(s)
  // in the php version, the statuses are optional; it's cleaner here to require them.
  getDetails(statuses, {includePrivate} = {}) {
    // we either have actual times or promises of them:
    return Promise.resolve(statuses).then((statuses) => {
      const details = this.getJSON({includePrivate});
      details['datestatuses']= statuses;
      return details;
    });
  },

  // was this record read from the database?
  exists() {
    return !!this.id;
  },

  // store to the db if force is true.
  // promises this object when done.
  _store(force= true) {
    return force ? knex.store('calevent', 'id', this) : Promise.resolve(this);
  },

  // if the secret is valid and matches the password of this CalEvent.
   // ( the password of the event is set at creation time, and cleared when 'deleted' )
  isSecretValid(secret) {
    return secret && (secret === this.password);
  },

  // can people looking for rides see this event?
  isPublished() {
    return this.hidden === 0;
  },

  // make this event visible to all
  // requires a call to storeChange()
  setPublished() {
    this.hidden = 0;
  },

  // soft deleted events are marked as 'E'
  // that makes them inaccessible to the front-end
  // while still showing them on the ical feed ( as canceled. )
  isDeleted() {
    return this.review == Review.Excluded;
  },

  // store to the db, updating the change counter.
  // the counter helps subscribers to the ical feed detect changes.
  // promises to return this record with a valid id.
  storeChange() {
    // update the change counter
    this.changes = this.nextChange();
    return this._store();
  },

  // return the change counter of the next call to store()
  nextChange() { // watch out for if it never existed.
    return 1 + (this.changes || 0);
  }
};

function addMethods(res) {
  return Object.assign(res, methods);
}

class CalEvent {
  // promises one CalEvent ( null if not found. )
  // tbd: could also fail on not found, but the code seems to read better this way.
  static getByID(id) {
    return knex.query('calevent').where('id', id).first().
      then(function(evt) {
        return evt ? addMethods(evt) : null;
      });
  }
  // returns one event.
  static newEvent() {
    // uuid4 is 36 chars including hyphens 123e4567-e89b-12d3-a456-426614174000
    // the secret format has been 32 chars no hyphens.
    const password = crypto.randomUUID().replaceAll("-","")
    const hidden = 1; // fix: change sql default?
    return addMethods({ password, hidden });
  }
  // for testing:
  static wrap(res) {
    return addMethods(res);
  }
  static methods = methods;
};

// exports methods for testing
module.exports = { CalEvent };

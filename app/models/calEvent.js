const crypto = require("crypto");
const knex = require("../knex");
const { CalDaily } = require("./calDaily");
const { Review } = require("./calConst");
const dt = require("../util/dateTime");
const config = require("../config");

class CalEvent {

  // aka Event::toArray in php
  static getJSON(self, {includePrivate}= {}) {
    let duration = self.eventduration;
    if (duration <= 0) {
      duration = null;
    }
    return isDeleted(self) ? {
      id        : self.id.toString(),
      deleted   : true,
    } : {
      id        : self.id.toString(),
      title     : self.title,
      venue     : self.locname,
      address   : self.address,
      organizer : self.name,
      details   : self.descr,
      // note: the driver keeps 'time' as a string
      // ex. "19:00:00"
      // ( 'timestamp', 'datetime', 'date' are converted to js Date )
      time        : self.eventtime,
      hideemail   : self.hideemail != 0,       // true if never set
      hidephone   : self.hidephone != 0,       // true if never set
      hidecontact : self.hidecontact != 0,     // true if never set
      length      : null,
      timedetails : self.timedetails,
      locdetails  : self.locdetails,
      loopride    : !!self.loopride,    // false if never set ( null )
      locend      : self.locend,
      eventduration : duration,
      weburl      : self.weburl,
      webname     : self.webname,
      // note: the php version *moves* the file here.
      // it feels wrong to do this on get --
      // and not doing it here can only affect legacy events
      // which havent been viewed in recent years...
      // and that seems okay.
      image       : config.image.url(self.image),
      audience    : self.audience,
      tinytitle   : self.tinytitle,
      printdescr  : self.printdescr,
      datestype   : self.datestype,
      area        : self.area,
      featured    : !!self.highlight,    // false if never set ( null )
      printemail  : !!self.printemail,   // false if never set ( null )
      printphone  : !!self.printphone,   // false if never set ( null )
      printweburl : !!self.printweburl,  // false if never set ( null )
      printcontact: !!self.printcontact, // false if never set ( null )
      published   : isPublished(self),
      safetyplan  : !!self.safetyplan,   // false if never set ( null )
      // note: (null==0) is false, so this wont include email, etc. by default.
      email: (self.hideemail == 0 || includePrivate) ? self.email : null,
      phone: (self.hidephone == 0 || includePrivate) ? self.phone : null,
      contact: (self.hidecontact == 0 || includePrivate) ? self.contact : null,

      // note: the php code puts the end time after the daily status data
      // for now, therefore this is in CalDaily
      // endtime: getEndTime()
    };
  },

  // similar to "fromArray" in php
  static updateFromJSON(self, data) {
    // ugly: assumes the data is validated and adjusted already.
    Object.assign(self, data);

    // default highlight to zero; but if it's already set, leave as-is
    // fix: add a default to mysql? could there be db entries with null in there already
    // and why is this happening in "updateFromJSON"?
    self.highlight = self.highlight ?? 0;
  }

  // return the starting time as a dayjs object;
  // ( returns an !isValid object for an invalid time )
  // pass an optional dayjs day to compute the time relative to a specific date.
  static getStartTime(self, fromDay = null) {
    const t = dt.from24HourString(self.eventtime);
    return fromDay ? dt.combineDateAndTime(fromDay, t) : t;
  }

  // return the ending time as a dayjs object; or null.
  // pass an optional dayjs day to compute the time relative to a specific date.
  // FIX? just like the php version, if the duration is null the end time is null.
  // this seems wrong to me -- it should probably use the minimum 1 hour duration.
  static getEndTime(self, fromDay = null) {
    let endTime = null;
    const len = self.eventduration;
    if (len > 0) {
      const start = getStartTime(self, fromDay);
      if (start.isValid()) {
        endTime = start.add(len, 'minute');
      }
    }
    return endTime;
  }

  // assumes start is a valid dayjs object.
  // generates a 1 hour duration if none was specified.
  static addDuration(self, start) {
    const len = self.eventduration;
    return endTime = (len > 0) ? start.add(len, 'minute') : start.add(1, 'hour');
  }

  // remove this record and any associated caldaily(s) from the database.
  // promises the total number of erased items when done.
  // NOTE: prefer softDelete() so ical subscribers can see that something has changed.
  static eraseEvent(self) {
    return knex.del('calevent', 'id', self).then((acnt) => {
        return knex.del('caldaily', 'id', self).then((bcnt) => {
          return acnt + bcnt;
        });
    });
  }

  // cancel all occurrences of this event, and make it inaccessible to the organizer.
  static softDelete(self) {
    return CalDaily.getByEventID(self.id).then((dailies) => {
      return Promise.all( dailies.map(at => at.delistOccurrence()) ).then(()=> {
        self.review = Review.Excluded; // excludes from getRangeVisible
        self.password = "";            // hides it from future editing
        return storeChange(self);
      });
    });
  }

  // promise a summary of the CalEvent and all its CalDaily(s)
  // in the php version, the statuses are optional; it's cleaner here to require them.
  static getDetails(self, statuses, {includePrivate} = {}) {
    // we either have actual times or promises of them:
    return Promise.resolve(statuses).then((statuses) => {
      const details = getJSON(self, {includePrivate});
      details['datestatuses']= statuses;
      return details;
    });
  }

  // was this record read from the database?
  static exists(self) {
    return !!self.id;
  }

  // store to the db if force is true.
  // promises this object when done.
  static _store(self, force= true) {
    return force ? knex.store('calevent', 'id', self) : Promise.resolve(self);
  }

  // if the secret is valid and matches the password of this CalEvent.
   // ( the password of the event is set at creation time, and cleared when 'deleted' )
  static isSecretValid(self, secret) {
    return secret && (secret === self.password);
  }

  // can people looking for rides see this event?
 static isPublished(self) {
    // note: legacy events have null for the hidden field
    // zero and null are considered published.
    return !self.hidden;
  }

  // make this event visible to all
  // requires a call to storeChange()
  static setPublished(self) {
    self.hidden = 0;
  }

  // soft deleted events are marked as 'E'
  // that makes them inaccessible to the front-end
  // while still showing them on the ical feed ( as canceled. )
  static isDeleted(self) {
    return self.review == Review.Excluded;
  }

  // store to the db, updating the change counter.
  // the counter helps subscribers to the ical feed detect changes.
  // promises to return this record with a valid id.
  static storeChange(self) {
    // update the change counter
    self.changes = nextChange(self);
    return _store(self);
  }

  // return the change counter of the next call to store()
  static nextChange() { // watch out for if it never existed.
    return 1 + (self.changes || 0);
  }
  // ----- 

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

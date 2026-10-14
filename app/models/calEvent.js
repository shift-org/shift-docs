const knex = require('shift-docs/db');
const dt = require("../util/dateTime");
const config = require('shift-docs/config');

// helper to add methods to a returned database object.
const methods =  {

  // aka Event::toArray in php
  getJSON({includePrivate}= {}) {
    let duration = this.eventduration;
    if (duration <= 0) {
      duration = null;
    }
    return {
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
      ridelength  : this.ridelength,
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

      // only exposes private info when hide is zero
      // ( or when private data is specifically requested )
      email: (this.hideemail == 0 || includePrivate) ? this.private_email : null,
      phone: (this.hidephone == 0 || includePrivate) ? this.private_phone : null,
      contact: (this.hidecontact == 0 || includePrivate) ? this.private_contact : null,

      // note: the php code puts the end time after the daily status data
      // for now, therefore this is in CalDaily
      // endtime: getEndTime()
    };
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

  // if the secret is valid and matches the password of this CalEvent.
   // ( the password of the event is set at creation time, and cleared when 'deleted' )
  isSecretValid(secret) {
    return secret && (secret === this.password);
  },

  // can people looking for rides see this event?
  isPublished() {
    // note: legacy events have null for the hidden field
    // zero and null are considered published.
    return !this.hidden;
  },

  // deleted events are never returned by queries
  // and "soft deleted" events are no longer a thing
  isDeleted() {
    return false;
  },
};

function addMethods(res) {
  return Object.assign(res, methods);
}

class CalEvent {
  // promises the *private* data of an event series
  // or null, if no such event was found.
  static getByID(id) {
    return knex.query('view_private_events')
      .where('id', id)
      .first()
      .then(function(evt) {
        return evt ? addMethods(evt) : null;
      });
  }
  // for testing:
  static wrap(res) {
    return addMethods(res);
  }
  static methods = methods;
};

// exports methods for testing
module.exports = { CalEvent };

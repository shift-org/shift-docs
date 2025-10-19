const config = require("../config");
const dt = require("../util/dateTime");
const { EventStatus, Review } = require("./calConst");

const CalEvent = {

  // aka Event::toArray in php
  // WARNING: if includePrivate is valid, assumes the secret is valid
  getOverview(evt, options = {includePrivate: false}) {
    let duration = evt.eventduration;
    if (duration <= 0) {
      duration = null;
    }
    const { includePrivate } = options;
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
      image       : CalEvent.getImageUrl(evt),
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
      published   : !evt.hidden,        // zero and null are considered published.
      safetyplan  : !!evt.safetyplan,   // false if never set ( null )
      // note: (null==0) is false, so this wont include email, etc. by default.
      email: (evt.hideemail == 0 || includePrivate) ? evt.email : null,
      phone: (evt.hidephone == 0 || includePrivate) ? evt.phone : null,
      contact: (evt.hidecontact == 0 || includePrivate) ? evt.contact : null,
    };
  },

  // returns null if there's no image set
  getImageUrl(evt) {
    // event.image is _usually_ "id.ext", but not always.
    // sometimes, it has a custom name. ex: "scienceFrictionRomanianBikeSmut.jpg"
    // it is never stored with a path.
    return evt.image ? config.image.url(evt.image) : null;
  },

  // return the starting time as a dayjs object;
  // ( returns an !isValid object for an invalid time )
  // pass an optional dayjs day to compute the time relative to a specific date.
  getStartTime(evt, fromDay = null) {
    const t = dt.from24HourString(evt.eventtime);
    return fromDay ? dt.combineDateAndTime(fromDay, t) : t;
  },

  // return the ending time as a dayjs object; or null.
  // pass an optional dayjs day to compute the time relative to a specific date.
  // FIX? just like the php version, if the duration is null the endTime is null.
  // this seems wrong to me -- it should probably use the minimum 1 hour duration.
  getEndTime(evt, fromDay = null) {
    let endTime = null;
    const len = evt.eventduration;
    if (len > 0) {
      const start = CalEvent.getStartTime(evt, fromDay);
      if (start.isValid()) {
        endTime = start.add(len, 'minute');
      }
    }
    return endTime;
  },

  // assumes start is a valid dayjs object.
  // generates a 1 hour duration if none was specified.
  addDuration(evt, start) {
    const len = evt.eventduration;
    return (len > 0) ? start.add(len, 'minute') : start.add(1, 'hour');
  },

  // soft deleted events are marked as 'E'
  // that makes them inaccessible to the front-end
  // while still showing them on the ical feed ( as canceled. )
  isDeleted(evt) {
    return evt.review == Review.Excluded;
  },
};

// export!
module.exports = CalEvent;
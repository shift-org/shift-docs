const config = require("../config");
const dt = require("../util/dateTime");

const CalEvent = {
  getSummary(evt) {
    return {
      id          : evt.id.toString(),
      title       : evt.title,
      venue       : evt.venue,
      address     : evt.address,
      organizer   : evt.name,
      details     : evt.descr,
      time        : evt.eventtime,
      ridelength  : evt.ridelength,
      timedetails : evt.timedetails,
      locdetails  : evt.locdetails,
      loopride    : evt.loopride,
      locend      : evt.locend,
      eventduration : (evt.eventduration <= 0) ? null : evt.eventduration,
      weburl      : evt.weburl,
      webname     : evt.webname,
      image       : CalEvent.getImageUrl(evt),
      audience    : evt.audience,
      tinytitle   : evt.tinytitle,
      area        : evt.area,
      featured    : evt.featured,
      published   : evt.published,
      safetyplan  : evt.safetyplan,
      email       : evt.email,
      phone       : evt.phone,
      contact     : evt.contact,
      hideemail   : !evt.email,
      hidephone   : !evt.phone,
      hidecontact : !evt.contact,
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
};

// export!
module.exports = CalEvent;
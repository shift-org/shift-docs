const config = require('server/core/config');
const dt = require('server/util/dateTime');

/**
 *  static helper functions for processing calevent style table data.
 */
class EventData {
  static getSummary(evt, options = {includePrivate: false}) {
    return {
      id            : evt.id.toString(),
      title         : evt.title,
      venue         : evt.locname,
      address       : evt.address,
      organizer     : evt.name,
      details       : evt.descr,
      time          : evt.eventtime,
      ridelength    : evt.ridelength,   // allowed to be null
      timedetails   : evt.timedetails,
      locdetails    : evt.locdetails,
      loopride      : !!evt.loopride,   // int to bool, and false if null
      locend        : evt.locend,
      eventduration : EventData.getDuration(evt),
      weburl        : evt.weburl,
      webname       : evt.webname,
      image         : EventData.getImageUrl(evt),
      audience      : evt.audience,
      tinytitle     : evt.tinytitle,    // used for short overviews
      printdescr    : evt.printdescr,   // used for opengraph tags
      area          : evt.area,
      featured      : !!evt.featured,   // int to bool, and false if null
      safetyplan    : !!evt.safetyplan, // int to bool, and false if null
      email         : EventData.getPrivateField(evt, 'email', options),
      phone         : EventData.getPrivateField(evt, 'phone', options),
      contact       : EventData.getPrivateField(evt, 'contact', options),

      // excludes the following fields from the summary:
      // - (hide|print)(email|phone|weburl|contact)
      // - published, datestype.
      // the first set are added by getEventSeries only if the secret matches.
      // the second set aren't used by the client.
    };
  }

  // return a private data field: ex. 'email'
  // works with both v1 and v2 queries:
  //  public v1 queries and private v2 queries include the data, plus a 'hide(field)' member.
  //  public v2 queries don't have the hide field, instead they report null for hidden data.
  // once the data is swapped over to v2, this can be replaced by directly returning the field.
  static getPrivateField(evt, field, options) {
    const hide = evt[`hide${field}`];
    const visible = options.includePrivate || (hide === 0) || (hide === undefined);
    return visible ? evt[field] : null;
  }

  // returns null for a missing or invalid event duration.
  static getDuration(evt) {
    // there are a bunch of older events with a zero duration
    // ( probably an alter table had set that as the default at one point )
    return (evt.eventduration <= 0) ? null : evt.eventduration;
  }

  // returns null if there's no image set
  static getImageUrl(evt) {
    // event.image is _usually_ "id.ext", but not always.
    // sometimes, it has a custom name. ex: "scienceFrictionRomanianBikeSmut.jpg"
    // it is never stored with a path.
    return evt.image ? config.image.url(evt.image) : null;
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
  // FIX? just like the php version, if the duration is null the endTime is null.
  // this seems wrong to me -- it should probably use the minimum 1 hour duration.
  static getEndTime(evt, fromDay = null) {
    let endTime = null;
    const len = evt.eventduration;
    if (len > 0) {
      const start = EventData.getStartTime(evt, fromDay);
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
};

// export!
module.exports = EventData;
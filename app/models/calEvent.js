const crypto = require("crypto");
const knex = require("../knex");
const { CalDaily } = require("./calDaily");
const { Area, DatesType, Review } = require("./calConst");
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
      id :  this.id.toString(),
      title :  this.title,
      venue :  this.locname,
      address :  this.address,
      organizer :  this.name,
      details :  this.descr,
      // note: the driver keeps 'time' as a string
      // ex. "19:00:00"
      // ( 'timestamp', 'datetime', 'date' are converted to js Date )
      time :  this.eventtime,
      // (null!=0) is true, so it hides if null.,
      hideemail :  this.hideemail != 0,
      hidephone :  this.hidephone != 0,
      hidecontact :  this.hidecontact != 0,
      length :  null,
      timedetails :  this.timedetails,
      locdetails :  this.locdetails,
      loopride :  this.loopride != 0,
      locend :  this.locend,
      eventduration :  duration,
      weburl :  this.weburl,
      webname :  this.webname,
      // the php version *moves* the file here.
      // it feels wrong to do this on get --
      // and not doing it here can only affect legacy events
      // which havent been viewed in recent years...
      // and that seems okay.
      image :  config.image.url(this.image),
      audience :  this.audience,
      tinytitle :  this.tinytitle,
      printdescr :  this.printdescr,
      datestype :  this.datestype,
      area :  this.area,
      featured :  this.highlight != 0,
      printemail :  this.printemail != 0,
      printphone :  this.printphone != 0,
      printweburl :  this.printweburl != 0,
      printcontact :  this.printcontact != 0,
      published :  this.isPublished(),
      safetyplan :  this.safetyplan != 0,
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

  // aka "fromArray" in php
  // assumes that the fields have been validated
  // and doesnt try to re-validate them.
  updateFromJSON(input) {
    // note: this is different from || ( also ?? ) because of null vs. undefined.
    // and, also, in floush -- an empty string is converted to null(!)
    // https://flourishlib.com/docs/fActiveRecord.html#ColumnOperations
    function get (field, def) {
      const val = (field in input) ? input[field] : def;
      return val === '' ? null : val;
    };
    // These are marked as required
    this.title = get('title', 'Title missing');
    this.locname = get('venue', 'Venue missing');
    this.address = get('address', 'Address missing');
    this.name = get('organizer', 'Organizer missing');
    this.email = get('email', 'Email missing');

    // these are optional
    this.hideemail = get('hideemail', 0);
    this.phone = get('phone', '');
    this.hidephone = get('hidephone', 0);
    this.contact = get('contact', '');
    this.hidecontact = get('hidecontact', 0);
    this.descr = get('details', '');
    // note: this node version considers this time required.
    // and manage_event.validateRequest() tries to ensure the time is good.
    this.eventtime = get('time', '');
    this.timedetails = get('timedetails', '');
    this.locdetails = get('locdetails', '');
    this.loopride = get('loopride', 0);
    this.locend = get('locend', '');
    this.eventduration = get('eventduration', 0);
    this.weburl = get('weburl', '');
    this.webname = get('webname', '');
    this.audience = get('audience', '');
    this.tinytitle = get('tinytitle', '');
    this.printdescr = get('printdescr', '');
    this.dates = get('datestring', ''); // string field 'dates' needed for legacy admin calendar
    this.datestype = get('datestype', DatesType.OneDay);
    this.area = get('area', Area.Portland);
    this.printemail = get('printemail', 0);
    this.printphone = get('printphone', 0);
    this.printweburl = get('printweburl', 0);
    this.printcontact = get('printcontact', 0);
    this.safetyplan = get('safetyplan', 0);

    // default highlight to off = (zero); but if it's already set, leave it as-is
    // fix: add a default to mysql? could there be db entries with null in there already
    // and why is this happening in "fromJSON"?
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

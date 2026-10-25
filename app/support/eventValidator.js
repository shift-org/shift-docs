const FormValidator = require('shift-docs/support/formValidator');
const {  ErrorStrings } = require('shift-docs/util/errors');
const { Shorthand } = require('shift-docs/util/shorthand');
const { Area, Audience, Distance, EventStatus, LocType, Showable, TagName, WebType } = require('shift-docs/models/newConst');
const dt = require('shift-docs/util/dateTime');

module.exports = newValidator;

class EventValidator extends FormValidator {
  // for validating from an object containing shorthand constants
  // ex. shorthands.Area
  // assumes default value is a shorthand instance: ex. Area.Portland
  shorthand(cls, fallback) {
    const str = this.nullString();     // an empty string returns null
    const enumEntry = cls.findShorthand(str); // looks up the specified value
    if (enumEntry !== undefined) {
      return enumEntry.value;                 // found it, perfect.
    } else if (str !== null) {
      this.addError(ErrorStrings.Invalid);
    } else if (fallback instanceof Shorthand) {
      return fallback.value;
    } else if (fallback === null) {
      return null; // ex. detects null for an unspecified distance.
    } else if (fallback === undefined) {
      this.addError(ErrorStrings.Missing);
    } else {
      // some coding error:
      throw new Error(`unexpected fallback ${fallback} for ${this.currentField}`);
    }
  }

  /**
   * combines a hide* and print* field into a "showable" enum
   * the fallback is expected to be one of the Showable enums or 'undefined'
   */
  printField(field, fallback) {
    // the rest endpoints use a single value; see if it exists
    const showable = 'show_' + field;
    if (showable in this.input) {
      return this.select(showable).shorthand(Showable, fallback);
    } else {
      // the php endpoints uses a pair of values
      const defaultPrint = (fallback === Showable.Public || fallback === Showable.Printable);
      const defaultVisible = (fallback === Showable.Public || fallback === Showable.Visible);
      const hide = this.select(`hide${field}`).simpleFlag(!defaultVisible);
      const print = this.select(`print${field}`).simpleFlag(defaultPrint);
      const show = Showable.combine(!hide, print);
      return show.value;
    }
  }
  // given the index being parsed, and a value containing a date
  // returns the date as a yyyy-mm-dd string;
  // or, undefined on error.
  requireDate() {
    const date = this.nullString();
    if (!dt.fromYMDString(date).isValid()) {
      this.addError("Dates requires the format YYYY-MM-DD");
    } else {
      return date;
    }
  }
  // returns the db value to store ( 0 or 1 )
  // checkboxes only send _affirmative_ state
  // so missing means cancelled.
  optionalStatus() {
    return this.shorthand(EventStatus, EventStatus.Cancelled);
  }
  // returns the validated string to store
  // or, undefined on error.
  optionalNews() {
    return this.nullString(1024);
  }
  // return 0 or 1
  // or, undefined on error.
  parseSelect() {
   const val = this.nullString();
   switch (val) {
    case '':
      return 0;
    case '1':
      return 1;
    case null:
       this.addError(ErrorStrings.Missing);
    default:
      this.addError(ErrorStrings.Unknown);
    };
  }
}

// report errors as "date-field"
// fallback to using the index of the element if the date is missing.
// note: v2 html uses the date-field format for its inputs
// so this prefixing directs errors to the right html display.
function selectDate(v, at, field) {
  const prefix = at.date || `index-${at}`;
  return v.setFieldValue(`${prefix}-${field}`, at[field]);
}

function readSchedule(v) {
  // an array of {date, status, newsflash}
  const dates = v.input.datestatuses;
  if (!dates) {
    // in v2 this is the date selector control
    v.errors.addError('datestatuses', "At least one day is required");
  } else {
    return dates.map((at, i) => {
      const date = selectDate(v, at, 'date').requireDate();
      const status = selectDate(v, at, 'status').optionalStatus();
      const newsflash = selectDate(v, at, 'newsflash').optionalNews();
      return {
        ymd: date, // string
        is_scheduled: status, // 0, 1
        news: newsflash, // string or null
      };
    });
  }
}


function newValidator(input, errors) {
  const v = new EventValidator(input, errors);
  return {
    // these required when trying to publish a ride.
    // ( they don't get stored into the db. )
    validateTerms() {
      v.select('code_of_conduct').requireTrue("You must agree to the Code of Conduct");
      v.select('read_comic').requireTrue("You must have read the Ride Leading Comic");
    },

    // validate the input, transforming from client field names into db column names.
    // returns a mapping of database table name to their column names and values
    // the third parameters are the options and fallbacks
    // if a fallback is undefined, the value is required.
    validateInput({
        defaultArea = undefined,     // can be one of the Area shorthands: ex. Area.Portland
        defaultAudience = undefined, // an Audience shorthand
        defaultDistance = undefined, // a Distance shorthand, or null for unspecified
        defaultLoop = undefined,     // true, false, or undefined for required.
        defaultSaftey = undefined,   // true, false, or undefined for required.
        defaultShow = {              // these all default to hidden expect for the website
          email: Showable.Private,
          phone: Showable.Private,
          contact: Showable.Private,
          website: Showable.Visible, // by default: seen online but not printed
        }
      }) {
      return {
        schedule: readSchedule(v),
        event: {
          // image: ... image data is handled separately (via multi-part form data)
          series: {
            title: v.select('title').requireString(256),
            organizer: v.select('organizer').requireString(),
            start_time: v.select('time').requiredTime(), // can return something falsy on error.
            scheduled_duration: v.select('eventduration').zeroInt() || null,  // client defaults this to "" if not specified.
            tiny_title: v.select('tinytitle').nullString(48), // client caps to 24, but some are longer already
            summary: v.select('printdescr').nullString(1024),
            details: v.select('details').requireString(16*1024),
            modified: dt.toTimestamp(), // for the sake of sqlite, set this manually.
          },
          location: [{
            // start should be listed in the location array first.
            loc_type: LocType.Start,
            place_name: v.select('venue').requireString(),
            address: v.select('address').requireString(),
            place_info: v.select('locdetails').nullString(),
            time_info: v.select('timedetails').nullString(),
          }, {
            // finish should in the location list somewhere after start
            loc_type: LocType.Finish,
            place_name: v.select('locend').nullString(),
          }],
          private: {
            // fix? only allow email to set on create; never update.
            private_email: v.select('email').requireEmail(),
            private_phone: v.select('phone').nullString(),
            private_contact: v.select('contact').nullString(),
            //
            show_email: v.printField('email', defaultShow.email),
            show_phone: v.printField('phone', defaultShow.phone),
            show_contact: v.printField('contact', defaultShow.contact),
          },
          tag: [
            tag(TagName.Area, v.select('area').shorthand(Area, defaultArea)),
            tag(TagName.Audience, v.select('audience').shorthand(Audience, defaultAudience)),
            tag(TagName.Distance, v.select('ridelength').shorthand(Distance, defaultDistance)),
            tag(TagName.LoopRide, v.select('loopride').simpleBool(defaultLoop)),
            tag(TagName.SafetyPlan, v.select('safetyplan').simpleBool(defaultSaftey)),
          ].filter(t => !!t.tag_value),
          web: [{
            web_type: WebType.Url,
            web_link: v.select('weburl').nullString(512),
            web_text: v.select('webname').nullString(),
            // to support the php endpoint, this one defaults to show true if not specified
            show_weburl: v.printField('weburl', defaultShow.website),
          }],
        }
      };
    }
  };
}

// note: tags with falsey values get filtered on insertion and update
function tag(a, b) {
  if (!!b) {
    const t = typeof(b);
    if (t === 'boolean') {
      // true gets stored as 'true'
      b = String(b);
    } else if (t !== 'string') {
      // these are supposed to be validated values
      // so an error here is likely a server coding error
      throw new Error(`unexpected tag value ${typeof(b)}(${b})`);
    }
  }
  return {
    tag_type: a,
    tag_value: b,
  }
}


const config = require("server/core/config");
const { Area, Audience, Distance, EventStatus, LocType, Showable, TagName, WebType } = require("server/model/shorthands");
const FormValidator = require('server/support/formValidator');
const { ErrorCollector, FormError, TextError } = require("server/support/errors");
const dt = require('server/util/dateTime');
const { parseJson } = require("server/util/parse");

/**
 * shared code useful for creating and updating events.
 */
module.exports = readEvent;

// helper to parse data sent by the client.
class Schedule {
  // vals: the original values from the client
  constructor(vals) {
    // stores these for generating the error message
    this.vals = vals;
    // these store any invalid indices
    this.invalid = {
      dates: [],
      news: [],
      status: [],
    };
  }
  // if any of the parsed entries had errors,
  // summarize those errors into a single string.
  generateErrorMessage() {
    let msg = "";
    ['dates', 'news', 'status'].forEach(n => {
      const a = this.invalid[n];
      if (a.length) {
        const text = a.map(i => `${i}=${this.vals[i][n]}`);
        msg += `Invalid ${n}: ` + text.join(', ');
      }
    });
    return msg;
  }
  // given the index being parsed, and a value containing a date
  // returns the date as a yyyy-mm-dd string;
  // or, undefined on error.
  parseDate(i, v) {
    const date = FormValidator.asString(v);
    if (!dt.fromYMDString(date).isValid()) {
      this.invalid.dates.push(i);
    } else {
      return date;
    }
  }
  // given the index being parsed, and a value containing a news string
  // returns the string
  // or, undefined on error.
  parseNews(i, v) {
    const news = FormValidator.asString(v) || null;
    if (news && !FormValidator.smallerThan(news, 1024)) {
      this.invalid.news.push(i);
    } else {
      return news;
    }
  }
  // given the index being parsed, and an EventStatus value
  // returns the db value to store ( 0 or 1 )
  // or, undefined on error.
  parseStatus(i, v) {
   const status = FormValidator.asString(v);
    const is_scheduled = EventStatus.keyToValue(status);
    if (is_scheduled === undefined) {
      this.invalid.status.push(i);
    } else {
      return is_scheduled;
    }
  }
}

class ExtendedFormValidator extends FormValidator {
  /**
   * Ensures that the 'datestatuses' in 'data' (if any) are valid.
   * Allows an empty list ( which cancels all existing occurrences. )
   */
  validateStatus() {
    const statusList = this.currentValue || [];
    if (!Array.isArray(statusList)) {
      this.errors.addError('dates', "expected an array");
      return;
    }
    const sched = new Schedule(statusList);
    const validStatus = statusList.map((day, i) => {
      const ymd = sched.parseDate(i, day.date);
      const news = sched.parseNews(i, day.newsflash);
      const is_scheduled = sched.parseStatus(i, day.status);
      if (ymd !== undefined && news !== undefined && is_scheduled !== undefined) {
        return {
          ymd,
          is_scheduled, // 0, 1
          news, // string or null
        };
      }
    });
    // write all invalid dates as an error of the "dates" field.
    const msg = sched.generateErrorMessage();
    if (msg) {
      this.errors.addError('dates', msg);
    }
    return validStatus;
  }

  simpleTag() {
    const v = this.optionalFlag();
    if (v === 1) {
      return true;
    } else if (v === 0) {
      return false;
    }
  }

  // for validating from an object containing shorthand constants
  // ex. shorthands.Area
  shorthand(cls, required) {
    const { currentField: field, currentValue: str } = this;
    const value = cls.keyToValue(str);
    if (value !== undefined) {
      return value;
    } else if (required) {
      this.addError("unknown key");
    }
  }

  /**
   * combines a hide* and print* field into a "showable" enum
   * returns a shorthands.Showable
   */
  printField(field) {
    const visible = this.select(`hide${field}`).optionalFlag(false); // validate and reverse the flag
    const printable = this.select(`print${field}`).optionalFlag(true);
    const show = Showable.combine(visible, printable);
    return show.value;
  }
}

// parse data from the client into db ready values
// returns: { id, secret, event, schedule }
// values contains the db ready values
// throws on error.
function readEvent(req, options = {allowImages: false}) {
  // fix? the client uploads form data containing json
  // ( rather than raw json ) because multi-part forms require that.
  // a more rest-like api might use a separate put at some event/image url.
  const body = parseJson(req.body);
  if (!body) {
    throw new TextError("invalid request");
  }
  const { input, errors } = parseIntoV2Format(body);
  // organizers are not allowed to upload images for new events
  if (req.file && !options.allowImages) {
    errors.addError("image", "Images can only be added to existing events.");
  }
  if (errors.count) {
    throw new FormError(errors.getErrors());
  }
  return input;
}

// validate the input, transforming from client field names into db column names.
function parseIntoV2Format(input) {
  const errors = new ErrorCollector();
  const v = new ExtendedFormValidator(input, errors);
  // these don't get stored; but are still required on initial submission for a new event
  if (!input.id) {
    v.select('code_of_conduct').requireTrue("You must agree to the Code of Conduct");
    v.select('read_comic').requireTrue("You must have read the Ride Leading Comic");
  }
  return {
    errors,
    // input: a mapping of table name to column names and values
    input: {
      id: v.select('id').zeroInt(),
      secret: v.select('secret').nullString(),
      schedule: v.raw('datestatuses').validateStatus(),
      event: {
        // image: ... image data is handled separately (via multi-part form data)
        series: {
          title: v.select('title').requireString('Title missing', 256),
          organizer: v.select('organizer').requireString('Organizer missing'),
          start_time: v.select('time').requiredTime(), // can return something falsy on error.
          ride_duration: v.select('eventduration').zeroInt() || null,  // client defaults this to "" if not specified.
          tiny_title: v.select('tinytitle').nullString(48), // client caps to 24, but some are longer already
          summary: v.select('printdescr').nullString(1024),
          details: v.select('details').requireString('Details missing', 16*1024),
          modified: dt.toTimestamp(), // for the sake of sqlite, set this manually.
        },
        location: [{
          // start should be listed in the location array first.
          loc_type: LocType.Start,
          place_name: v.select('venue').requireString('Venue missing'),
          address: v.select('address').requireString('Address missing'),
          place_info: v.select('locdetails').nullString(),
          time_info: v.select('timedetails').nullString(),
        }, {
          // finish should in the location list somewhere after start
          loc_type: LocType.Finish,
          place_name: v.select('locend').nullString(),
        }],
        private: {
          // fix: should only allow to set on create; never update.
          private_email: v.select('email').requireEmail(),
          private_phone: v.select('phone').nullString(),
          private_contact: v.select('contact').nullString(),
          show_email: v.printField('email'),
          show_phone: v.printField('phone'),
          show_contact: v.printField('contact'),
        },
        tag: [
          tag(TagName.Area, v.select('area').shorthand(Area, true)),
          tag(TagName.Audience, v.select('audience').shorthand(Audience, true)),
          tag(TagName.Distance, v.select('ridelength').shorthand(Distance, false)),
          tag(TagName.LoopRide, v.select('loopride').simpleTag()),
          tag(TagName.SafetyPlan, v.select('safetyplan').simpleTag()),
        ],
        web: [{
          web_type: WebType.Url,
          web_link: v.select('weburl').nullString(512),
          web_text: v.select('webname').nullString(),
          printable: v.select('printweburl').optionalFlag(),
        }],
      }
    },
  };
}

function tag(a, b) {
  switch (typeof(b)) {
  case "undefined":
    break;
  case "string":
    break;
  case 'boolean': // boolean tags get stored as 'true'
    b = b ? 'true' : false;
    break;
  default:
    // these are supposed to be validated values
    // so an error here is likely a server coding error
    throw new Error(`unexpected tag value ${b}`);
  }
  return {
    tag_type: a,
    tag_value: b,
  }
}
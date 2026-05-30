const validator = require("validator");
const { Area, Audience, DatesType, RideLength } = require("./calConst");
const FormValidator = require("server/support/formValidator");
const { ErrorCollector } = require("server/support/errors");
const dt = require("server/util/dateTime");

module.exports = validateEvent;

class EventValidator extends FormValidator {
  // munge print title:
  // if print title (aka tinytitle) isn't set,
  // use the first 24 chars of the regular title
  mungeTinyTitle(title) {
    const str = this.currentValue;
    // fix? cut at words? ( could use the wordwrapjs )
    return (!str && title) ? title.substring(0, 24) : str;
  }

  /**
   * Ensures that the 'datestatuses' in 'data' (if any) are valid.
   * Allows an empty list ( which cancels all existing occurrences. )
   *
   * @param statusList: A list of data status objects sent by the organizer.
   *        [{ id, date, status, newsflash }, ...]
   * @out an array of validated [{ date, state, news }]
   *
   * dates in and out are : YYYY-MM-DD format
   */
  validateStatus() {
    const statusList = this.currentValue;
    const invalidDateStrings = [];
    const validStatus = [];
    if (statusList) {
      if (!Array.isArray(statusList)) {
        invalidDateStrings.push("expected an array");
      } else {
        statusList.forEach(status => {
          const validDate = status.date && dt.fromYMDString(status.date).isValid();
          if (!validDate) {
            invalidDateStrings.push(status.date);
          } else {
            validStatus.push(status);
          }
        });
      }
    }
    // write all invalid dates as an error of the "dates" field.
    if (invalidDateStrings.length) {
      const msg = "Invalid dates: " + invalidDateStrings.join(', ');
      this.errors.addError('dates', msg);
    }
    return validStatus;
  }

  // ensure the current value is one of the predefined ride length constants.
  // if not, uses a null value.
  validateRideLength() {
    const value = this.currentValue;
    return (value in RideLength) ? value : null;
  }
}
// fix? required only from March to June, during Pedalpalooza
// tinytitle', 'printdescr'
function validateEvent(input) {
  const errors = new ErrorCollector();
  const v = new EventValidator(input, errors);
  // these don't get stored; but are still required on initial submission for a new event
  if (!input.id) {
    v.select('code_of_conduct').requireTrue("You must agree to the Code of Conduct");
    v.select('read_comic').requireTrue("You must have read the Ride Leading Comic");
  }
  const title = v.select('title').requireString('Title missing');
  let values = {
    title: title,
    locname: v.select('venue').requireString('Venue missing'),
    address: v.select('address').requireString('Address missing'),
    name: v.select('organizer').requireString('Organizer missing'),
    email: v.select('email').requireEmail(),
    hideemail: v.select('hideemail').optionalFlag(),
    phone: v.select('phone').nullString(),
    hidephone: v.select('hidephone').optionalFlag(),
    contact: v.select('contact').nullString(),
    hidecontact: v.select('hidecontact').optionalFlag(),
    descr: v.select('details').requireString('Details missing', 16*1024),
    eventtime: v.select('time').requiredTime(),
    timedetails: v.select('timedetails').nullString(),
    locdetails: v.select('locdetails').nullString(),
    loopride: v.select('loopride').optionalFlag(),
    locend: v.select('locend').nullString(),
    ridelength: v.select('ridelength').validateRideLength(),
    eventduration: v.select('eventduration').zeroInt(),
    weburl: v.select('weburl').nullString(512), // fix? validate this is url-like?
    webname: v.select('webname').nullString(),
    audience: v.select('audience').optionalChar(Audience.General),
    tinytitle: v.select('tinytitle').mungeTinyTitle(title),
    printdescr: v.select('printdescr').nullString(1024),
    dates: v.select('datestring').nullString(), // string field 'dates' needed for legacy admin calendar
    datestype: v.select('datestype').optionalChar(DatesType.OneDay),
    area: v.select('area').optionalChar(Area.Portland),
    printemail: v.select('printemail').optionalFlag(),
    printphone: v.select('printphone').optionalFlag(),
    printweburl: v.select('printweburl').optionalFlag(),
    printcontact: v.select('printcontact').optionalFlag(),
    safetyplan: v.select('safetyplan').optionalFlag(),
  };
  const statusList = v.raw('datestatuses').validateStatus();
  return {
    id: input.id,
    secret: input.secret,
    values,
    statusList,
    errors,
  };
}

const validator = require("validator");
const { Area, Audience, DatesType, RideLength } = require("./calConst");
const makeValidator = require("server/support/formValidator");
const { ErrorCollector } = require("server/support/errors");
const dt = require("server/util/dateTime");

module.exports = validateEvent;


// munge print title:
// if print title (aka tinytitle) isn't set,
// use the first 24 chars of the regular title
function mungeTinyTitle(v, title) {
  const str = v.getString('tinytitle');
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
function validateStatus(v, statusList) {
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

  if (invalidDateStrings.length) {
    const msg = "Invalid dates: " + invalidDateStrings.join(', ');
    v.addError('dates', msg);
  }
  return validStatus;
}

function validateRideLength(v, rideLength) {
  const value = v.getString(rideLength);
  return (value in RideLength) ? value : null;
}

// fix? required only from March to June, during Pedalpalooza
// tinytitle', 'printdescr'
function validateEvent(input) {
  const errors = new ErrorCollector();
  const v = makeValidator(input, errors);
  // these don't get stored; but are still required on initial submission for a new event
  if (!input.id) {
    v.requireTrue('code_of_conduct', "You must agree to the Code of Conduct");
    v.requireTrue('read_comic', "You must have read the Ride Leading Comic");
  }
  const title = v.requireString('title', 'Title missing');
  let values = {
    title: title,
    locname: v.requireString('venue', 'Venue missing'),
    address: v.requireString('address', 'Address missing'),
    name: v.requireString('organizer', 'Organizer missing'),
    email: v.requireEmail('email'),
    hideemail: v.optionalFlag('hideemail'),
    phone: v.nullString('phone'),
    hidephone: v.optionalFlag('hidephone'),
    contact: v.nullString('contact'),
    hidecontact: v.optionalFlag('hidecontact'),
    descr: v.requireString('details', 'Details missing', 16*1024),
    eventtime: v.requiredTime('time'),
    timedetails: v.nullString('timedetails'),
    locdetails: v.nullString('locdetails'),
    loopride: v.optionalFlag('loopride'),
    locend: v.nullString('locend'),
    ridelength: validateRideLength(v, 'ridelength'),
    eventduration: v.zeroInt('eventduration'),
    weburl: v.nullString('weburl', 512), // fix? validate this is url-like?
    webname: v.nullString('webname'),
    audience: v.optionalChar('audience', Audience.General),
    tinytitle: mungeTinyTitle(v, title),
    printdescr: v.nullString('printdescr', 1024),
    dates: v.nullString('datestring'), // string field 'dates' needed for legacy admin calendar
    datestype: v.optionalChar('datestype', DatesType.OneDay),
    area: v.optionalChar('area', Area.Portland),
    printemail: v.optionalFlag('printemail'),
    printphone: v.optionalFlag('printphone'),
    printweburl: v.optionalFlag('printweburl'),
    printcontact: v.optionalFlag('printcontact'),
    safetyplan: v.optionalFlag('safetyplan'),
  };
  const statusList = validateStatus(v, input.datestatuses);
  return {
    id: input.id,
    secret: input.secret,
    values,
    statusList,
    errors,
  };
}

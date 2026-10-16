// CalEvent.review enum.
// see helpers.js for the authoritative version.
// fix: how can we share? symlink? some sort of copy by hugo build? remote fetch and make the api server authoritative??
const Area = Object.freeze({
  Portland  : 'P',
  Vancouver : 'V',
  //
  Westside : 'W',
  Eastside : 'E',
  Clackamas: 'C',
});

const Audience = Object.freeze({
  General : 'G',
  Family  : 'F',
  Adult   : 'A',
});

// legacy CalEvent.datestype enum.
// all dates are now "one day"
const DatesType = Object.freeze({
  OneDay      : 'O',
  Scattered   : 'S',
  Consecutive : 'C',
});

// CalDaily.eventstatus enum.
// the status of a single instance of an event on a given day.
const EventStatus = Object.freeze({
  Active    : 'A',
  Cancelled : 'C', // explicitly marked as canceled by the owner.
  Delisted  : 'D', // the day has been removed without being explicitly canceled.
  Skipped   : 'S', // legacy value.
});

// CalEvent.review enum.
const Review = Object.freeze({
  Inspect   : 'I',
  Excluded  : 'E', // legacy; reused for "soft deleting" already published events.
  Approved  : 'A',
  SentEmail : 'S',
  Revised   : 'R',
});

const RideLength = Object.freeze({
    '0-3'  : '0-3 miles',
    '3-8'  : '3-8 miles',
    '8-15' : '8-15 miles',
    '15+'  : '15+ miles',
});

const EventsRange = Object.freeze({
  MaxDays : 100,
});

const EventSearch = Object.freeze({
  Limit : 25,
});

//
module.exports = { Area, Audience, DatesType, EventStatus, Review, RideLength, EventsRange, EventSearch};

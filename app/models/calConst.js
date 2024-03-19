// CalEvent.review enum.
const Area = Object.freeze({
  Portland  : 'P',
  Vancouver : 'V',
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

//
module.exports = { Area, Audience, DatesType, EventStatus, Review };

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
const EventStatus = Object.freeze({
  Active    : 'A',
  Cancelled : 'C',
  Skipped   : 'S' // legacy value
});

// legacy CalEvent.review enum.
const Review = Object.freeze({
  Inspect   : 'I',
  Excluded  : 'E',
  Approved  : 'A',
  SentEmail : 'S',
  Revised   : 'R',
});

//
module.exports = { Area, Audience, DatesType, EventStatus, Review };


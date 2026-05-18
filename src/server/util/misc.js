// misc helpers
const crypto = require("crypto");

// uuid4 is 36 chars including hyphens 123e4567-e89b-12d3-a456-426614174000
// the secret format has been 32 chars no hyphens.
function newSecret()  {
  return crypto.randomUUID().replaceAll("-" , "");
}

module.exports = {
  newSecret,
  getPaginatedRange,
}

// expects days are dayjs objects
// and count is the number of events between the two
function getPaginatedRange(firstDay, lastDay) {
  // add 1 so days in range is inclusive
  const range = lastDay.diff(firstDay, 'day') + 1;
  //
  const prevRangeStart = firstDay.subtract(range, 'day');
  const prevRangeEnd = lastDay.subtract(range, 'day');
  //
  const nextRangeStart = firstDay.add(range, 'day');
  const nextRangeEnd = lastDay.add(range, 'day');
  //
  return {
    prev: [prevRangeStart, prevRangeEnd],
    next: [nextRangeStart, nextRangeEnd],
    // tbd: can client determine from start, end instead
    range
  };
}
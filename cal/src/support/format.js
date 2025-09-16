import dayjs from 'dayjs'

export default { 
  longDate(date) {
    let format;
    const now = dayjs();
    if (date.year() !== now.year()) {
      // Wed, January 22, 2025
      format = 'MMMM D, YYYY (ddd)';
    } else if (!date.isSame(now, 'month')) {
      // Wed, January 22
      format  = 'dddd, MMMM Do';
    } else if (!date.isSame(now, 'day')) {
      // Wed, Jan 22
      format  = 'dddd, MMM Do';
    } else {
      format = '[Today] — ddd, MMM Do'
    }
    return date.format(format);
  }
}
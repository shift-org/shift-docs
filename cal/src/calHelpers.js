/**
 * code used on one or more pages
 * ported from the jquery helpers.js
 */
import dayjs from 'dayjs'

// a <= b
function sameOrBefore(a, b) {
  return a.isSame(b) || a.isBefore(b);
}
// a >= b
function sameOrAfter(a, b) {
  return a.isSame(b) || a.isAfter(b);
}
// start <= a <= end
function within(a, start, end) {
  return sameOrAfter(a, start) && sameOrBefore(a, end);
}

const urlPattern = /^https*:\/\//;
const emailPattern = /.+@.+[.].+/;

function friendlyTime(time) {
  return dayjs(time, 'hh:mm:ss').format('h:mm A');
}

export default {
  sameOrBefore,
  sameOrAfter,
  within,

  // format an event '.weburl'
  // if url already starts with http/s, return it as-is
  // otherwise prepend http.
  getWebLink(url) {
    return url.match(urlPattern) ? url : ('http://' + url);
  },
  // format an event '.contact'
  getContactLink(contact) {
      if (contact && contact.match(urlPattern)) {
          // if add'l contact info is an http/s link, return it as-is
          return contact;
      } else if (contact&& contact.match(emailPattern)) {
          // if add'l contact info is an email address, return a mailto link
          return 'mailto:' + contact;
      } 
      // if it's not a link, return nothing
  },

  //7:00 AM to 9:00 AM
  getTimeRange(evt) {
    const {endtime, time} = evt;
    const suffix = !endtime ? "" : ` to ${friendlyTime(endtime)}`;
    return friendlyTime(time) + suffix;
  },

  // duplicated from calendars helpers
  getAddToGoogleLink(event) {
      const googleCalUrl = new URL('https://calendar.google.com/calendar/render');

      const startDate = dayjs(`${event.date} ${event.time}`);
      const duration = event.eventduration ?? 60; // Google requires a duration
      const endDate = dayjs(startDate).add(dayjs.duration({ 'minute': duration }));
      
      const googleFormat = 'YYYYMMDDTHHmmss[Z]'; // on simon's phone, millsecs creates an all day event
      const startString = startDate.format(googleFormat);
      const endString = endDate.format(googleFormat);
      const calendarDates = `${startString}/${endString}`;

      googleCalUrl.search = new URLSearchParams({
        action: "TEMPLATE",
        text: `shift2Bikes: ${event.title}`,
        location: event.address,
        details: `${event.details}\n\n${event.shareable}`,
        dates: calendarDates,
        // FIX: this seems better than timezoneless but probably should be configurable.
        ctz: `America/Los_Angeles`
      });

      return googleCalUrl.toString();
  },

  // https://jasonwatmore.com/vanilla-js-slugify-a-string-in-javascript
  // might want the server to do this; but fine for now.
  slugify(evt) {
    const str = evt.tinytitle;
    // make lower case and trim whitespace
    return str.toLowerCase()
      // remove accents from characters
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      // replace invalid chars with spaces
      .replace(/[^a-z0-9\s-]/g, ' ')
      // replace multiple spaces or hyphens with a single hyphen
      .replace(/[\s-]+/g, '-')
      // Remove hyphens from the beginning or end
      .replace(/^-+|-+$/g, ''); 
  }, 
}

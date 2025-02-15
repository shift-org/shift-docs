// converted from the jquery helpers.js
// TBD: how to share? do we need to?
import dayjs from 'dayjs'

const AREA = Object.freeze({
    'P' : 'Portland',
    'V' : 'Vancouver',
    'W' : 'Westside',
    'E' : 'East Portland',
    'C' : 'Clackamas',
});

const AUDIENCE = Object.freeze({
    'G' : 'General Audience',
    'F' : 'Family Friendly',
    'A' : '21+ Only',
});

const AUDIENCE_DESCRIPTION = Object.freeze({
    'G' : 'General — For adults, but kids welcome',
    'F' : 'Family Friendly — Adults bring children',
    'A' : '21+ Only — Adults only',
});

const LENGTH = Object.freeze({
    '--'   : '--',
    '0-3'  : '0-3 miles',
    '3-8'  : '3-8 miles',
    '8-15' : '8-15 miles',
    '15+'  : '15+ miles',
});

const DEFAULT_TIME = '17:00:00';
const DEFAULT_AREA = 'P';
const DEFAULT_AUDIENCE = 'G';

// only for add event:
//const DEFAULT_LENGTH = '--';

// TODO: add to queries
const API_VERSION = '3';

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

export default {
  sameOrBefore,
  sameOrAfter,
  within,
  // turn a dayjs date into words
  // todo: turn into a template.
  longDate(when) {
    const date = dayjs(when);
    const now = dayjs();
    let format;
    if (date.year() !== now.year()) {
      // Wed, January 22, 2025
      format = 'ddd, MMMM D, YYYY';
    } else if (!date.isSame(now, 'week'))
      // Wed, January 22
      format  = 'ddd, MMMM D';
    else if (!date.isSame(now, 'day')) {
      // Thursday  — Jan 22
      format = 'dddd — MMM D'
    } else {
      format = '[Today] — ddd, MMM D'
    }
    return date.format(format);
  },
  // used by calTags
  getAudienceTag(audience) {
      return (audience || DEFAULT_AUDIENCE).toLowerCase();
  },
  // used by calTags
  getAudienceLabel(audience) {
      return AUDIENCE[audience || DEFAULT_AUDIENCE];
  },
  // used by calTags
  getAreaTag(area) {
      return (area || DEFAULT_AREA).toLowerCase();
  },
  // used by calTags
  getAreaLabel(area) {
      return AREA[area || DEFAULT_AREA];
  },

  // used on the calList page.
  // format an event '.address'
  getMapLink(address) {
      if (!address || address == 'TBA' || address == 'TBD') {
          // if address is null or not available yet, don't try to map it
          return null;
      }
      if (address.match(urlPattern)) {
          // if address is a URL rather than a street address, return it as-is
          return address;
      } else {
          // otherwise, map it with Google Maps
          return 'https://maps.google.com/' +
              '?bounds=45.389771,-122.829208|45.659647,-122.404175&q=' +
              encodeURIComponent(address);
      }
  },
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
}

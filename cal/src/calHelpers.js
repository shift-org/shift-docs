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

  buildEventTags(evt) {
    return evt.cancelled ?
      [{
        id: 'cancelled',
        short: 'cancelled',
        text: 'Cancelled',
      }] :
      [{
        id: 'audience',
        short: (evt.audience || DEFAULT_AUDIENCE).toLowerCase(), // ex. 'g'      
        text: AUDIENCE[evt.audience || DEFAULT_AUDIENCE] // ex. General
      }, { 
        id: 'area',
        short: (evt.area || DEFAULT_AREA).toLowerCase(), // ex. 'p'
        text: AREA[evt.area || DEFAULT_AREA] // ex. Portland
      }, {
        id: 'safety',
        short: evt.safetyplan ? "yes" : "no",
        text: evt.safetyplan ? "COVID Safety plan" : "No COVID plan",
        hide: !!evt.safetyplan
      }];
  }
}

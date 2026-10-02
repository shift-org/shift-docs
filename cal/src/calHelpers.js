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

// domains we trust enough to auto-link inside free-text event
// descriptions. keeps the description field from becoming an open
// invitation for spam links while still letting people share their
// ridewithgps.com routes. mirrors the legacy calendar's config.js. see #1072.
const LINKABLE_DOMAINS = ['ridewithgps.com'];

const linkableHostPattern = LINKABLE_DOMAINS.map(
  (domain) => '(?:[a-z0-9-]+\\.)*' + domain.replace(/\./g, '\\.')
).join('|');

// an optional scheme/www, one of the allow-listed hosts, then an optional path.
// the negative lookbehind keeps it from matching as a suffix of a longer
// word/domain (eg. "evilridewithgps.com") or an email's domain part.
const linkableUrlPattern = new RegExp(
  '(?<![\\w.@-])(?:https?:\\/\\/)?(?:' + linkableHostPattern + ')(?:\\/[^\\s<>"\']*)?',
  'gi'
);

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// drop trailing sentence punctuation so it doesn't get swallowed into a link
function trimUrl(url) {
  return url.replace(/[.,!?;:'")\]}]+$/, '');
}

function normalizeHref(url) {
  return /^https?:\/\//i.test(url) ? url : ('https://' + url);
}

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

  // turns plain-text event details into safe html, hyperlinking any
  // allow-listed links (eg. ridewithgps.com routes). the rest of the text is
  // html-escaped, not left as raw html, since this is free text from event
  // organizers. mirrors the legacy calendar's getLinkedDetails (helpers.js).
  getLinkedDetails(details) {
    if (!details) {
      return details;
    }

    let html = '';
    let lastIndex = 0;
    let match;
    linkableUrlPattern.lastIndex = 0;

    while ((match = linkableUrlPattern.exec(details)) !== null) {
      const url = trimUrl(match[0]);
      const start = match.index;
      const end = start + url.length;

      html += escapeHtml(details.slice(lastIndex, start));
      const href = normalizeHref(url);
      html += `<a href="${escapeHtml(href)}" target="_blank" rel="noopener nofollow external" title="Opens in a new window">${escapeHtml(url)}</a>`;

      lastIndex = end;
      linkableUrlPattern.lastIndex = end;
    }
    html += escapeHtml(details.slice(lastIndex));
    return html;
  },

  // the first allow-listed url in the details (normalized with a scheme),
  // or undefined. used to fetch an oEmbed card. first link wins.
  getUnfurlUrl(details) {
    if (!details) {
      return undefined;
    }
    linkableUrlPattern.lastIndex = 0;
    const match = linkableUrlPattern.exec(details);
    return match ? normalizeHref(trimUrl(match[0])) : undefined;
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
      
      const googleFormat = 'YYYYMMDDTHHmmss'; // on simon's phone, millsecs creates an all day event
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

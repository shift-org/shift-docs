import calConst from "./calConst.js";

const urlPattern = /^https*:\/\//;
const emailPattern = /.+@.+[.].+/;

export default {
    getAudienceLabel(audience) {
        if (!audience || audience == calConst.STARTING.AUDIENCE) {
            return null; // no label if unspecified, or for default value
        } else {
            return calConst.AUDIENCE[audience];
        }
    },

    getAreaLabel(area) {
        if (!area || area == calConst.STARTING.AREA) {
            return null; // no label if unspecified, or for default value
        } else {
            return calConst.AREA[area];
        }
    },

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
        if (!url) {
            // if url is not set, return nothing
            return null;
        }
        if (url.match(urlPattern)) {
            // if url already starts with http/s, return it as-is
            return url;
        } else {
            // if it doesn't start with http/s, prepend http
            return 'http://' + url;
        }
    },

    getContactLink(contact) {
        if (contact && contact.match(urlPattern)) {
            // if add'l contact info is an http/s link, return it as-is
            return contact;
        } else if (contact && contact.match(emailPattern)) {
            // if add'l contact info is an email address, return a mailto link
            return 'mailto:' + contact;
        } 
        // if it's not a link, return nothing
    },

    getAddToGoogleLink(event) {
        const googleCalUrl = new URL('https://www.google.com/calendar/render');

        const startDate = dayjs(`${event.date} ${event.time}`).toISOString();
        const duration = event.duration ?? 60; // Google requires a duration and defaults to 60 minutes anyway
        const endDate = dayjs(startDate).add(dayjs.duration({ 'minute': duration })).toISOString();
        /**
         * Matches anything that is not a word or whitespace
         * @example
         * "2025-05-21T16:30:00.000Z".replace(regex, '') // 20250521T163000000Z
        */
        const regex = /[^\w\s]/gi;

        // Remove colons and periods for Google Calendar URL (2025-05-21T16:30:00.000Z => 20250521T163000000Z)
        const calendarDates = `${startDate.replace(regex, '')}/${endDate.replace(regex, '')}`;

        googleCalUrl.search = new URLSearchParams({
          action: "TEMPLATE",
          text: `shift2Bikes: ${event.title}`,
          location: event.address,
          details: `${event.details}\n\n${event.shareable}`,
          dates: calendarDates,
          sf: true, // ??
          output: 'xml'
        });

        return googleCalUrl.toString();
    },

    // compare two pieces of event json returned from the server
    // times are strings, ex. "18:00:00"
    compareTimes(event1, event2) {
        if ( event1.time < event2.time ) {
            return -1;
        }
        if ( event1.time > event2.time ) {
            return 1;
        }
        return 0;
    },

    // window.location.pathname
    parseURL(pathname) {
      const urlParams = {};
      const path = pathname.split('/');
      const lastPart = path[path.length-1];

      const singleEventRe = /event-([0-9]+)/g;
      const singleEvent = singleEventRe.exec(lastPart);
      if (singleEvent && singleEvent.length === 2) {
        urlParams['eventId'] = parseInt(singleEvent[1]);
      }

      const editEventRe = /edit-([0-9]+)-([0-9a-zA-Z]*)/g;
      const editEvent = editEventRe.exec(lastPart);
      if (editEvent && editEvent.length === 3) {
        urlParams['editId'] = parseInt(editEvent[1]);
        urlParams['editSecret'] = editEvent[2];
      }

      // IE doesn't support URLSearchParams, so IE will
      // skip this block and ignore all URL params
      if (typeof URLSearchParams === "function") {
        const query = new URLSearchParams(location.search);

        if (query.has('startdate')) {
          urlParams['startdate'] = query.get('startdate');
        }
        if (query.has('enddate')) {
          urlParams['enddate'] = query.get('enddate');
        }
        if (query.has('show_details')) {
          urlParams['show_details'] = true;
        }
        if (query.has('view')) {
          if (['day', 'week', 'month'].includes(query.get('view'))) {
            urlParams['view'] = query.get('view');
          }
        }
      }

      return urlParams;
    },

    // lightly adapted from
    // https://developers.google.com/web/fundamentals/performance/lazy-loading-guidance/images-and-video/
    lazyLoadEventImages() {
      const lazyImages = [].slice.call(document.querySelectorAll("img.lazy"));

      if ("IntersectionObserver" in window) {
        const lazyImageObserver = new IntersectionObserver(function(entries, observer) {
          entries.forEach(function(entry) {
            if (entry.isIntersecting) {
              const lazyImage = entry.target;
              lazyImage.src = lazyImage.dataset.src;
              lazyImage.classList.remove("lazy");
              lazyImageObserver.unobserve(lazyImage);
            }
          });
        });

        lazyImages.forEach(function(lazyImage) {
          lazyImageObserver.observe(lazyImage);
        });
      }
    }
}
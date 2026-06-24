(function($) {

    $.fn.getAudienceLabel = function(audience) {
        if (!audience || audience == DEFAULT_AUDIENCE) {
            return null; // no label if unspecified, or for default value
        } else {
            return AUDIENCE[audience];
        }
    };

    $.fn.getAreaLabel = function(area) {
        if (!area || area == DEFAULT_AREA) {
            return null; // no label if unspecified, or for default value
        } else {
            return AREA[area];
        }
    };

    $.fn.getMapLink = function(address) {
        if (!address || /^(tba|tbd)\b/i.test(address)) {
            // if address is null or not available yet, don't try to map it
            return null;
        }

        var urlPattern = /^https*:\/\//;
        if (address.match(urlPattern)) {
            // if address is a URL rather than a street address, return it as-is
            return address;
        } else {
            // otherwise, map it with Google Maps
            return 'https://maps.google.com/' +
                '?bounds=45.389771,-122.829208|45.659647,-122.404175&q=' +
                encodeURIComponent(address);
        }
    };

    $.fn.getWebLink = function(url) {
        if (!url) {
            // if url is not set, return nothing
            return null;
        }

        var urlPattern = /^https*:\/\//;
        if (url.match(urlPattern)) {
            // if url already starts with http/s, return it as-is
            return url;
        } else {
            // if it doesn't start with http/s, prepend http
            return 'http://' + url;
        }
    };

    $.fn.getContactLink = function(contactInfo) {
        if (!contactInfo) {
            // if no add'l contact info is set, return nothing
            return null;
        }

        var urlPattern = /^https*:\/\//;
        var emailPattern = /.+@.+[.].+/;

        if (contactInfo.match(urlPattern)) {
            // if add'l contact info is an http/s link, return it as-is
            return contactInfo;
        } else if (contactInfo.match(emailPattern)) {
            // if add'l contact info is an email address, return a mailto link
            return 'mailto:' + contactInfo;
        } else {
            // if it's not a link, return nothing
            return;
        }
    };

    // ex. https://calendarlinkgenerator.com/google-calendar-link-generator
    // duplicated in calHelpers.js
    $.fn.getAddToGoogleLink = function(event) {
        const googleCalUrl = new URL('https://calendar.google.com/calendar/render');

        const startDate = dayjs(`${event.date} ${event.time}`);
        const duration = event.eventduration ?? 60; // Google requires a duration
        const endDate = dayjs(startDate).add(dayjs.duration({ 'minute': duration }));
        
        const googleFormat = 'YYYYMMDDTHHmmss'; // on simon's phone, millsecs creates an all day event
        const startString = startDate.format(googleFormat);
        const endString = endDate.format(googleFormat);
        const calendarDates = `${startString}/${endString}`;

        const descr = $.fn.truncateString(event.details, 500) + `\n\n${event.shareable}`;

        googleCalUrl.search = new URLSearchParams({
          action: "TEMPLATE",
          text: `shift2Bikes: ${event.title}`,
          location: event.address,
          details: descr,
          dates: calendarDates,
          // FIX: this seems better than timezoneless but probably should be configurable.
          ctz: `America/Los_Angeles`
        });

        return googleCalUrl.toString();
    };

    // domains we trust enough to auto-link inside free-text event
    // descriptions. keeps the description field from becoming an open
    // invitation for spam links while still letting people share their
    // ridewithgps.com routes. see issue #1072.
    var LINKABLE_DOMAINS = ['ridewithgps.com'];

    var linkableHostPattern = LINKABLE_DOMAINS.map(function(domain) {
        return '(?:[a-z0-9-]+\\.)*' + domain.replace(/\./g, '\\.');
    }).join('|');

    // an optional scheme/www, one of the allow-listed hosts, then an optional path.
    // the negative lookbehind keeps it from matching as a suffix of a longer
    // word/domain (eg. "evilridewithgps.com") or an email's domain part.
    var linkableUrlPattern = new RegExp(
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

    // turns plain-text event details into safe html, hyperlinking any
    // ridewithgps.com links (the rest of the text is html-escaped, not
    // left as raw html, since this is free text from event organizers).
    $.fn.getLinkedDetails = function(details) {
        if (!details) {
            return details;
        }

        var html = '';
        var lastIndex = 0;
        var match;
        linkableUrlPattern.lastIndex = 0;

        while ((match = linkableUrlPattern.exec(details)) !== null) {
            // don't swallow trailing sentence punctuation into the link
            var url = match[0].replace(/[.,!?;:'")\]}]+$/, '');
            var start = match.index;
            var end = start + url.length;

            html += escapeHtml(details.slice(lastIndex, start));
            var href = /^https?:\/\//i.test(url) ? url : ('https://' + url);
            html += '<a href="' + escapeHtml(href) + '" target="_blank" rel="noopener nofollow external" title="Opens in a new window">' +
                escapeHtml(url) + '</a>';

            lastIndex = end;
            linkableUrlPattern.lastIndex = end;
        }
        html += escapeHtml(details.slice(lastIndex));
        return html;
    };

    $.fn.truncateString = function ( str, maxLength=250 ) {
        let text = str.substring(0,maxLength);
        if (str.length > maxLength) {
          // replace the last character with an ellipsis
          text = text.slice(0, -1) + "…";
        }
        return text;
    };

    $.fn.compareTimes = function ( event1, event2 ) {
        if ( event1.time < event2.time ) {
            return -1;
        }
        if ( event1.time > event2.time ) {
            return 1;
        }
        return 0;
    };

} (jQuery));

// converted from the jquery helpers.js
// TBD: how to share? do we need to?

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
const DEFAULT_LENGTH = '--';

// total number of days to fetch, inclusive of start and end dates;
// minimum of 1, maximum set by server
const DEFAULT_DAYS_TO_FETCH = 10;

const SITE_TITLE = "Shift";

const API_VERSION = '3';

export default {

    getAudienceTag(audience) {
        return (audience || DEFAULT_AUDIENCE).toLowerCase();
    },

    getAudienceLabel(audience) {
        return AUDIENCE[audience || DEFAULT_AUDIENCE];
    },

    getAreaTag(area) {
        return (area || DEFAULT_AREA).toLowerCase();
    },

    getAreaLabel(area) {
        return AREA[area || DEFAULT_AREA];
    },

    getMapLink(address) {
        if (!address || address == 'TBA' || address == 'TBD') {
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
    },

    getWebLink(url) {
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
    },

    getContactLink(contactInfo) {
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
    },

    compareTimes ( event1, event2 ) {
        if ( event1.time < event2.time ) {
            return -1;
        }
        if ( event1.time > event2.time ) {
            return 1;
        }
        return 0;
    }
}

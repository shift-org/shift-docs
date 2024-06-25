const AREA = Object.freeze({
    'P' : 'Portland',
    'V' : 'Vancouver',
    'W' : 'Westside',
    'E' : 'East Portland',
    'C' : 'Clackamas',
});

const AUDIENCE = Object.freeze({
    'G' : 'General',
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

const SITE_TITLE = "Shift";

const API_VERSION = '3';

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

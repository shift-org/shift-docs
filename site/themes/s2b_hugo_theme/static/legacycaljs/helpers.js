(function($) {

    $.fn.getAudienceLabel = function(audience) {
         if (audience == null) {
             return null;
         }

         if (audience == "A") {
             return "21+ Only";
         } else if (audience == "F") {
             return "Family Friendly";
         } else {
           //no label needed for general (G) or any other value
           return null;
        }
    };

    $.fn.getMapLink = function(address) {
        if (!address || address == 'TBA' || address == 'TBD') {
            // if address is null or not available yet, don't try to map it
            return;
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
            return;
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
            return;
        }

        var urlPattern = /^https*:\/\//;
        if (contactInfo.match(urlPattern)) {
            // if add'l contact info is an http/s link, return it as-is
            return contactInfo;
        } else {
            // if it's not a link, return nothing
            return;
        }
    };

    $.fn.formatDate = function(dateString, abbreviated) {
        var parts = dateString.split('-'),
            date = new Date(parts[0], parseInt(parts[1]) - 1, parts[2]);

        var dateStringType = 'long';
        if (abbreviated) {
            dateStringType = 'short';
        }

        return date.toLocaleDateString(
            navigator.language,
            {
                weekday: dateStringType,
                month: dateStringType,
                day: 'numeric',
                year: 'numeric'
            }
        );
    };

    $.fn.formatTime = function(time) {
        var timeParts = time.split(':');
        var hour = parseInt(timeParts[0]);
        var meridian = 'AM';
        if ( hour === 0 ) {
            hour = 12;
        } else if ( hour >= 12 ) {
            meridian = 'PM';
            if ( hour > 12 ) {
                hour = hour - 12;
            }
        }
        return hour + ':' + timeParts[1] + ' ' + meridian;
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

    $.fn.compareDates = function ( date1, date2 ) {
        if ( date1 < date2 ) {
            return -1;
        }
        if ( date1 > date2 ) {
            return 1;
        }
        return 0;
    };

} (jQuery));

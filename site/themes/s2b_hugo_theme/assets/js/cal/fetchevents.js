// uses CONSTANTS from config.js

// fullcalendar's own feed can't send headers, so its event sources fetch
// through this instead. info.startStr/endStr match what the feed sent. re: #750
function fetchCalendarEvents(info, onSuccess, onFailure) {
    const url = new URL(API_EVENTS_URL);
    url.searchParams.set('startdate', info.startStr);
    url.searchParams.set('enddate', info.endStr);
    fetch(url, { headers: API_HEADERS })
        .then(function(resp) { return resp.json(); })
        // our API returns { "events": [ ] }; fullcalendar wants the inner array
        .then(function(data) { onSuccess(data.events); })
        .catch(onFailure);
}

const SITE_TITLE = "Shift";

const API_VERSION = '3';

const API_BASE_URL = window.location.origin;
const API_EVENTS_URL = new URL('/api/events.php', API_BASE_URL);
const API_ICS_URL = new URL('/api/ics.php', API_BASE_URL);
const API_MANAGE_URL = new URL('/api/manage_event.php', API_BASE_URL);
const API_RETRIEVE_URL = new URL('/api/retrieve_event.php', API_BASE_URL);
const API_DELETE_URL = new URL('/api/delete_event.php', API_BASE_URL);

const API_HEADERS = {
  'Accept': 'application/json',
  'Api-Version': API_VERSION
};

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

// total number of days to fetch, inclusive of start and end dates;
// minimum of 1, maximum set by server
const DEFAULT_DAYS_TO_FETCH = 10;

const SITE_TITLE = "Shift";

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

const STARTING = {
  TIME: '17:00:00',
  AREA: 'P',
  AUDIENCE: 'G',
  LENGTH: '--',
  // total number of days to fetch, inclusive of start and end dates;
  // minimum of 1, maximum set by server
  DAYS_TO_FETCH: 10,
}

export default { 
  SITE_TITLE,
  AREA,
  AUDIENCE,
  AUDIENCE_DESCRIPTION, 
  LENGTH,
  STARTING,
};
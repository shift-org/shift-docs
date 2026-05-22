/* ---------------------------------------------------------------------- 
 * the views in this file transform the raw db data
 *  into the formats needed by the various endpoints.
 * ---------------------------------------------------------------------- */

// for v1 backwards compat, combine all data as is.
// relies on the application code correctly filtering private data
// ( v2 relies on the application code making the appropriate queries )
const v1Events = `select * from calevent left join caldaily using(id)`;

const v1Reverse = `
select id, pkid, eventdate
from v1_events
where not coalesce(hidden, 0)
and eventstatus in ('A', 'C')
`;

const reverseLookup = `
select id, pkid, ymd as eventdate
from series
join schedule using(id)
where published is not null
and is_scheduled is not null
`;

// individual event instances
// tbd if the bike fun app needs the pkids at all.
const dailyEvents = `
select 
  id,
  pkid, 
  ymd as eventdate,
  case is_scheduled
    when 1 then 'A'
    when 0 then 'C'
  end as eventstatus,
  news as newsflash
from schedule
where is_scheduled is not null;
`;

const seriesEvents = `
select 
  id, 
  title, 
  tiny_title as tinytitle,
  organizer as name,
  details as descr,
  summary as printdescr,
  created,
  modified,
  published as changes,
  not published as hidden
from series
where published is not null;
`;

// the limited set of data needed for the ics feed
const icalFeed = `
select *
from daily_events
left join series_events using (id)
left join loc_events using (id)
where changes > 0;
`;

// the pairing of id and image cache ( or image override ) filename.
// the *real* filename is the cache name without the trailing dash.
// the image override is used for images manually assigned by the calendar crew.
// example returned data:
//  123, 123-1.png
//  738, some_override.png
const imageEvents = `
select 
    image.id,
    coalesce(
      img_override, 
      -- this won't be evaluated if img_override is true.
      concat_ws( '.', concat_ws('-', image.id, img_version), img_ext ))  
    as image
from image;
`;

// the combined starting and ending location data for every series
const locEvents = `
select 
  series.id as id,
  star.place_name as locname,
  star.address as address,
  series.start_time as eventtime,
  star.time_info as timedetails,
  star.place_info as locdetails,
  fini.place_name as locend,
  series.ride_duration as eventduration
from 
  series
  left join location as star on (series.id = star.id and star.loc_type='start')
  left join location as fini on (series.id = fini.id and fini.loc_type='finish');
`;

// a summary of all events regardless of publication status
// NOTE: includes all private data as part of its results.
// ( ex. for the retrieve event endpoint )
// contains the secret so it can be be matched/validated.
const privateEvents = `
select 
  *,
  secret as password,

  -- data fields
  private_email as email,
  private_phone as phone,
  private_contact as contact,

  -- visibility settings
  show_email not in ('public', 'visible') as hideemail,
  show_phone not in ('public', 'visible') as hidephone,
  show_contact not in ('public', 'visible') as hidecontact,

  -- printing settings
  show_email in ('public', 'printable') as printemail,
  show_phone in ('public', 'printable') as printphone,
  show_contact in ('public', 'printable') as printcontact

from 
  series_events
  join private using(id) 
  join loc_events using(id)
  join tag_events using(id) 
  left join daily_events using(id)
  left join image_events using(id)
  left join web_events using(id);
`;

// a summary of published events 
// ex. for the event listing endpoint.
// only includes email, phone, and contact info when "public" or "visible"
// ( those fields are null when "private" or only "printable" )
const publicEvents = `
select *,
  case when show_email in ('public', 'visible') then private_email end as email,
  case when show_phone in ('public', 'visible') then private_phone end as phone,
  case when show_contact in ('public', 'visible') then private_contact end as contact

from 
  series_events
  join private using(id)  
  join loc_events using(id)
  join tag_events using(id)
  left join daily_events using(id)
  left join image_events using(id)
  left join web_events using(id)
where not hidden;
`;

// all data in one big flat view
// ex. for unit tests.
const rawEvents = `
select * from series
  left join image using(id)
  left join location using(id)
  left join private using(id)
  left join schedule using(id)
  left join tag using(id)
  left join web using(id);
`;

// certain tags are provided as fields for the existing event endpoints.
// tag_value can be null if the tag doesn't exist in the db.
// the "is" expressions turn boolean tests to 0 or 1, and handle null values automatically
// substring(str,y,z) chops str at char y, for z characters, where y=1 is the first character;
// if str is empty, it returns empty. if str is null, it returns null. ( so coalesce is needed. )
const tagEvents = `
 select  
  series.id,
  coalesce( substring(audience.tag_value, 1, 1), 'G' ) as audience,
  coalesce( substring(area.tag_value, 1, 1), 'P' ) as area,
  distance.tag_value as ridelength,
  loopride.tag_value is 'true' as loopride,
  featured.tag_value is 'true' as featured,
  safety.tag_value is 'true' as safetyplan
from series
  left join tag as audience on(audience.id = series.id and audience.tag_type = 'audience')
  left join tag as distance on(distance.id = series.id and distance.tag_type = 'distance')
  left join tag as loopride on(loopride.id = series.id and loopride.tag_type = 'loopride')
  left join tag as area on(area.id = series.id and area.tag_type = 'area')
  left join tag as featured on(featured.id = series.id and featured.tag_type = 'featured')
  left join tag as safety on(safety.id = series.id and safety.tag_type = 'safety');
 `;

// used for update event to grab the small bit of data it needs to validate its event.
// setting published to null revokes the event; and it cannot be seen for updates.
const updateCheck = `
select id, secret, published
from private
join series using(id)
where published is not null
`;

// the event endpoints currently only look for web urls.
// note: reduces empty strings to null
const webEvents = `
 select id,
  nullif(web_link, '') as weburl,  
  nullif(web_text, '') as webname,
  printable as printweburl
from web
where web_type = 'url';
`;

// export:
module.exports = {
  v1_events: v1Events,
  v1_reverse: v1Reverse,
  reverse_lookup: reverseLookup,
  daily_events: dailyEvents,
  series_events: seriesEvents,
  loc_events: locEvents,
  ical_feed: icalFeed,
  image_events: imageEvents,
  tag_events: tagEvents,
  raw_events: rawEvents,
  update_check: updateCheck,
  web_events: webEvents,
  // order matter
  // these depend on the above views.
  private_events: privateEvents,
  public_events: publicEvents,
}

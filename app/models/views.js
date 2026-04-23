/* ---------------------------------------------------------------------- 
 * the views in this file transform the raw db data
 *  into the formats needed by the various endpoints.
 * ---------------------------------------------------------------------- */

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
where is_scheduled is not null
`;

const seriesEvents = `
select 
  id, 
  title, 
  tinytitle,
  organizer as name,
  details as descr,
  created,
  modified,
  published as changes,
  not published as hidden
from series
where published is not null
`;

// the limited set of data needed for the ics feed
const icalFeed = `
select *
from daily_events
left join series_events using (id)
left join loc_events using (id)
where changes > 0
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
from image
`;

// the combined starting and ending location data for every series
const locEvents = `
select 
  series.id as id,
  star.place_name as venue,
  star.address as address,
  series.start_time as eventtime,
  star.time_info as timedetails,
  star.place_info as locdetails,
  fini.place_name as locend,
  series.ride_duration as eventduration
from 
  series
  left join location as star on (series.id = star.id and star.loc_type='start')
  left join location as fini on (series.id = fini.id and fini.loc_type='finish')
`;

const printEvents = `
select 
  id, 
  printed_summary as printdescr,
  coalesce(add_email, 0) as printemail,
  coalesce(add_phone, 0) as printphone,
  coalesce(add_link, 0) as printweburl,
  coalesce(add_contact, 0) as printcontact
from print 
`;

// a summary of all events regardless of publication status
// includes all private info
// ex. for the retrieve event endpoint
const privateEvents = `
select 
  *,
  secret as password,
  private_email as email,
  private_phone as phone,
  private_contact as contact,
  not show_email as hideemail,
  not show_phone as hidephone,
  not show_contact as hidecontact

from 
  series_events
  join private using(id) 
  join loc_events using(id)
  join tag_events using(id) 
  left join daily_events using(id)
  left join image_events using(id)
  left join print_events using(id)
  left join web_events using(id)
`;

// a summary of published events 
// including the public contact info
// ex. for the event listing endpoint
const publicEvents = `
select *,
  case when show_email then private_email end as email,
  case when show_phone then private_phone end as phone,
  case when show_contact then private_contact end as contact

from 
  series_events
  join private using(id)  
  join loc_events using(id)
  join tag_events using(id)
  left join daily_events using(id)
  left join image_events using(id)
  left join web_events using(id)
where not hidden
`;

// all data in one big flat view
// ex. for unit tests.
const rawEvents = `
select * from series
  left join image using(id)
  left join location using(id)
  left join print using(id)
  left join private using(id)
  left join schedule using(id)
  left join tag using(id)
  left join web using(id)
`;

// certain tags are provided as fields for the existing event endpoints.
const tagEvents = `
 select  
  series.id,
  distance.tag_value as ridelength,
  coalesce( loopride.tag_value, 0 ) as loopride,
  coalesce( substring(audience.tag_value,1,1), 'G' ) as audience, 
  coalesce( substring(area.tag_value,1,1), 'P' ) as area, 
  coalesce( featured.tag_value, 0 ) as featured,
  coalesce( safety.tag_value, 0 ) as safetyplan
from series
  left join tag as audience on(audience.id = series.id and audience.tag_type = 'audience')
  left join tag as distance on(distance.id = series.id and distance.tag_type = 'distance')
  left join tag as loopride on(loopride.id = series.id and loopride.tag_type = 'loopride')
  left join tag as area on(area.id = series.id and area.tag_type = 'area')
  left join tag as featured on(featured.id = series.id and featured.tag_type = 'featured')
  left join tag as safety on(safety.id = series.id and safety.tag_type = 'safety')
 `;

// the event endpoints currently only look for web urls.
// note: reduces empty strings to null
const webEvents = `
 select id,
  nullif(web_link, '') as weburl,  
  nullif(web_text, '') as webname 
from web
where web_type = 'url'
`;

// export:
module.exports = {
  daily_events: dailyEvents,
  series_events: seriesEvents,
  loc_events: locEvents,
  ical_feed: icalFeed,
  image_events: imageEvents,
  print_events: printEvents,
  tag_events: tagEvents,
  raw_events: rawEvents,
  web_events: webEvents,
  // order matter
  // these depend on the above views.
  private_events: privateEvents,
  public_events: publicEvents,
}

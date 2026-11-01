/* ----------------------------------------------------------------------
 * the views in this file transform the raw db data
 *  into the formats needed by the various endpoints.
 * ---------------------------------------------------------------------- */

// the order matters here as earlier entries build on later entries.
// "view_" names are used for endpoint queries;
// "in_" names are internal, partial views: helpers to build other view(s).
const allViews = {

  // provides a summary of events for editing them.
  // includes rides with no days
  // includes unpublished rides ( they can be edited )
  // excludes revoked rides ( they cannot be edited )
  view_private_events: `
select
  *,
  secret as password,

  -- private fields are left as "private_email", etc.
  -- the intent was to prevent accidental leakage
  -- tbd if that's really useful or not.

  -- legacy visibility settings
  show_email not in ('public', 'visible') as hideemail,
  show_phone not in ('public', 'visible') as hidephone,
  show_contact not in ('public', 'visible') as hidecontact,
  show_weburl not in ('public', 'visible') as hideweburl,

  -- legacy printing settings
  show_email in ('public', 'printable') as printemail,
  show_phone in ('public', 'printable') as printphone,
  show_contact in ('public', 'printable') as printcontact,
  show_weburl in ('public', 'printable') as printweburl

from
  in_event_series
  join in_event_place using(id) -- always generates rows; left and inner join are the same
  join in_event_tags using(id)  -- same.
  left join cal_private using(id)
  left join view_all_days using(id)
  left join in_event_images using(id)
  left join in_private_web using(id)
where not deleted;
`,

  // produces a summary of published events and their days.
  // excludes: revoked events, events with no days.
  // implicitly excludes: events which havent been published.
  view_event_schedule: `
select *
  from view_published_series
  join view_all_days using(id)
where not deleted;
`,

  // approximately the calevent data from the original db:
  // returns public data about published series even if revoked.
  view_published_series: `
select *
  from in_event_series
  join in_event_place using(id)
  join in_event_tags using(id)
  left join in_permitted using(id)
  left join in_event_images using(id)
  left join in_public_web using(id)
where not hidden;
`,

  // the caldaily equivalent:
  // returns *all* known days
  // ( ex. whether published, revoked, or delisted. )
  view_all_days: `
select
  id,
  pkid,
  ymd as eventdate,
  case is_scheduled
    when 1 then 'A'
    when 0 then 'C'
    when null then 'D'
  end as eventstatus,
  news as newsflash
from cal_schedule;
`,

  // used to validate events for event edting.
  // revoked rides can't be edited, so they are excluded.
  view_private_checks: `
select id, secret, published
  from cal_series
  join cal_private using(id)
where revoked is null;
`,

  // series data with legacy field names
  // excludes revoked rides ( those with null published data )
  in_event_series: `
select
  id,
  title,
  tiny_title as tinytitle,
  organizer as name,
  start_time as eventtime,
  scheduled_duration as eventduration,
  details as descr,
  summary as printdescr,
  created,
  modified,
  published as changes,
  not published as hidden,
  revoked is not null as deleted
from cal_series;
`,

  // generate public web contact info.
  // the event endpoints currently only look for web urls.
  // note: reduces empty strings to null
  in_public_web: `
select id,
  case when show_weburl in ('public', 'visible') and web_link != '' then web_link end as weburl,
  case when show_weburl in ('public', 'visible') and web_link != '' then web_text end as webname
from cal_web
where web_type = 'url';
`,

  // generate private web contact info.
  // produces the 'printweburl' field to match the old code
  in_private_web: `
 select id,
  -- share settings
  show_weburl,

  -- legacy data names
  web_text as webname,
  web_link as weburl

from cal_web
where web_type = 'url';
`,

  // generates a table of event tag data.
  // certain tags are provided as fields for the existing event endpoints.
  // tag_value can be null if the tag doesn't exist in the db.
  // the "is" expressions turn boolean tests to 0 or 1, and handle null values automatically
  // substring(str,y,z) chops str at char y, for z characters, where y=1 is the first character;
  // if str is empty, it returns empty. if str is null, it returns null. ( so coalesce is needed. )
  in_event_tags: `
select
  cal_series.id,
  coalesce( substring(tag_audience.tag_value, 1, 1), 'G' ) as audience,
  coalesce( substring(tag_area.tag_value, 1, 1), 'P' ) as area,
  tag_distance.tag_value as ridelength,
  tag_loopride.tag_value = 'true' as loopride,
  tag_featured.tag_value = 'true' as highlight,
  tag_safety.tag_value = 'true' as safetyplan
from cal_series
  left join cal_tag as tag_audience on(tag_audience.id = cal_series.id and tag_audience.tag_type = 'audience')
  left join cal_tag as tag_distance on(tag_distance.id = cal_series.id and tag_distance.tag_type = 'distance')
  left join cal_tag as tag_loopride on(tag_loopride.id = cal_series.id and tag_loopride.tag_type = 'loopride')
  left join cal_tag as tag_area on(tag_area.id = cal_series.id and tag_area.tag_type = 'area')
  left join cal_tag as tag_featured on(tag_featured.id = cal_series.id and tag_featured.tag_type = 'featured')
  left join cal_tag as tag_safety on(tag_safety.id = cal_series.id and tag_safety.tag_type = 'safety');
 `,

  // the public view of private contact info.
  // only includes email, phone, and contact when allowed.
  // never includes the secret.
  in_permitted: `
select
  id,
  case when show_email in ('public', 'visible') then private_email end as email,
  case when show_phone in ('public', 'visible') then private_phone end as phone,
  case when show_contact in ('public', 'visible') then private_contact end as contact
from cal_private
`,

  // the combined starting and ending location data for every series
  in_event_place: `
select
  cal_series.id as id,
  loc_start.place_name as locname,
  loc_start.address as address,
  loc_start.time_info as timedetails,
  loc_start.place_info as locdetails,
  loc_end.place_name as locend
from cal_series
  left join cal_location as loc_start on (cal_series.id = loc_start.id and loc_start.loc_type='start')
  left join cal_location as loc_end on (cal_series.id = loc_end.id and loc_end.loc_type='finish');
`,

  // the pairing of id and image cache ( or image override ) filename.
  // the *real* filename is the cache name without the trailing dash.
  // the image override is used for images manually assigned by the calendar crew.
  // example returned data:
  //  123, 123-1.png
  //  738, some_override.png
  in_event_images: `
select
  cal_image.id,
  coalesce(
    img_override,
    -- this won't be evaluated if img_override is true.
    concat_ws( '.', concat_ws('-', cal_image.id, img_version), img_ext ))
  as image
from cal_image;
`,
};

module.exports = {
  // drop all known views
  // returns an array of promises
  dropViews(db) {
    db.config.debug && console.log("dropViews...");
    // walks views in top-to-bottom order ( reverse of creation )
    const reverseNames = Object.keys(allViews);
    return reverseNames.map((n) => db.query.schema.dropViewIfExists(n));
  },

  // return the views as raw sql statements
  // ( for migration generation )
  listViews(db) {
    db.config.debug && console.log("listViews...");
    // the names of the views from bottom to top.
    const viewNames = Object.keys(allViews).reverse();
    return viewNames.map((n) => db.query.schema.createView(n, (view) => {
      const statement = allViews[n];
      return view.as(db.raw(statement));
    }));
  },

  // create all known views.
  // since views can depend on each other,
  // this creates them all -- one at a time -- before returning
  createViews(db) {
    db.config.debug && console.log("createViews...");
    async function _createViews() {
      // the names of the views from bottom to top.
      const viewNames = Object.keys(allViews).reverse();
      for (const name of viewNames) {
        await db.query.schema.createView(name, (view) => {
          const statement = allViews[name];
          return view.as(db.raw(statement));
        });
      }
    }
    // ugh. all the other setup functions return an array containing one or more promises
    // so this does the same: converting the async call into that.
    return [Promise.resolve().then(_createViews)];
  },
};

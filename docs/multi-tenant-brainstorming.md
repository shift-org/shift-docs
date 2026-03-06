# Brainstorming multi-tenant bike/community event hosting 

## MVP

Hardcode a filter for a single region into a backend and frontend /calendar page view with its own URL
- add location query param handling to event.js... (see https://github.com/shift-org/shift-docs/blob/area-query/app/endpoints/events.js#L40)
- ...so that getRangeVisible can handle default/other areas correctly (without changing other behavior of that call) .  Dumb hacky way here: https://github.com/shift-org/shift-docs/blob/area-query/app/models/calDaily.js#L256-L287 but would want to instead parameterize the getRangeVisible call to do even a real MVP.
- change config.js in the hugo theme to include the new region (https://github.com/shift-org/shift-docs/blob/area-query/site/themes/s2b_hugo_theme/assets/js/cal/config.js#L23)
- create new frontend page that uses the new getRangeVisible call correctly (`region="S"` or whatever)
- create new addevent page that is region locked to new region (but, for now _don't do even bother with addevent until we have a PoC with Salem events_, to share and ask them about their usage and whether it suits!)

Notes:

API call working after my hack! (grabbed from network tools, shell escaped):
        `curl -vk https://localhost:4443/api/events.php\?startdate\=2026-02-26T00%3A00%3A00-08%3A00\&enddate\=2026-02-28T00%3A00%3A00-08%3A00\&area\=S`

call for the calendar page via id & category in `calendar.md` is routed to:
        `site/themes/s2b_hugo_theme/layouts/partials/cal/fullcal.html`

from Simon:

this is the plugin we use for displaying the calendar : https://fullcalendar.io/ , more specifically https://fullcalendar.io/docs/events-json-feed
fullcalendar.ioevents (as a json feed); apparently there's an `extraParams` that can be set / sent along

## v1.0

### Goals to meet for actually having anyone use this at any volume:
1. not giving ourselves extra tech debt or making major improvements a challenge ("might break their site").
2. allowing self-admin for them (different DB tables or separate docker containers as in below "And then" section?)
3. perhaps as a corollary they should have a tech person who we can meet with and train them and hopefully cross-pollinate.  Or require $$ contribution to support our hosting?

- consider copying pp page to filter to salem?  it has the list/grid...
- could we maybe allow embed of cal listing/grid into some external page?  ...where it might take some magic to inject the query param into the call
- perhaps we can make a copy of the calendar page that ends up with the query param hardwired and also change the title?  Not sure how terrible that would be.
- or perhaps we could have it do something different based on hostname (w/ or w/o netlify helping with a redirect)
- can we move it to the existing beta frontend easily?

## And then... (aka the dream)

- do we clean up the "shift-centric" DB layout, and maybe the [weird PHP routing](https://github.com/shift-org/shift-docs/blob/area-query/services/nginx/conf.d/shift.conf#L46) before we *really* offer this as a service?
- separate DB tables for "their events" means we could scope mysql access to keep them from accidentally editing our events but letting them admin their own.  
- Separate mail list for event creation logs would be a nice feature too.
- separate docker containers would also be pretty cheap - AND allows separate restarts even on just the one machine

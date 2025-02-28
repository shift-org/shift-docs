Cal Single Page App Status 
============

## Issues:

* missing the "how to ical subscribe", where to add it? maybe to menu?

* TBD: add a pedalp button to the toolbar when pedalp is near?
* try to NOT load the shift image if there's going to be an event image; that will save some good amount of data when hitting an event page. (* bug: there's a flash of the shift image when reloading an event page   http://localhost:3080/events/59/rock-with-you )
* test the full event `contact` field. todo: find some real events that use it ( makeFake never sets it. )
* include this change: https://github.com/shift-org/shift-docs/pull/866
* hook up search test

## Style Tasks
* TODO: style search, jump, hamburger menu
* too much space at top in chrome. http://localhost:3080/events/20691/breakfast-on-the-bridges
* should have a max width or something for desktop on details page
* "All Events" button doesnt look great
* TBD: should whole summary be clickable ( safety would only be clickable on details then )
* setup aria tags and info
* tooltips or labels for the lower nav buttons?
* TBD: where should the 'shift' logo link to?

## Future Tasks:
* event details context: show "TODAY" above time if its today; 
  some sort of "this event has passed" if its more than an hour ago
  "starting soon" if its near, or  "X days from now"

* implement favorites: button on list page shows your favorites; button on item page adds/removes to favorites. ( maybe you could use local storage for both queries and favorites )

* review josh's url / query parameter ideas, and see if they can be used here.
* add "reoccur" links for each event ( might need server data for this )
* consider: a "featured events" page that shows the time / date / extra info that can include the menu's text, but also show when those events are.
* reuse the app somehow for preview event?
* consider redirecting existing urls to the single page app and trimming the old views.
* timeout/error for data fetches?
* consider blocking quick nav (left/right), etc. while loading.
* improve loading animation ( maybe don't hide the previous data while loading )
* server: consider linked lists for single events?
* server: consider a more focused "overview" endpoint; maybe with days grouped already.
* better communication if there is no next/prev event ( this would be a very rare edge case issue )
* todo: improve event details next/prev return point.
    currently you always return to the original week you came from
    shiftEvent could be smart, knowing when you've swapped weeks; updating calStart.
    ( noting that the 'start' can be any day of the week; so week is not always sunday )
    [ if return point is "now" shouldn't need to add start to it 
* todo: read https://vuejs.org/guide/best-practices/accessibility#semantic-forms for the toolbar.

* bikefun: lets you browse rides at a location
* bikefun: resources page with links to external sites 
* bikefun: cal reminders 

* hand it around for beta testing?
* add API_VERSION to data queries

Benefits:
----
* Modern javascript, no more jquery.
* Fewer production dependencies ( only: dayjs, vuejs, vue-router ), uses npm to manage versions, vite packs all dependencies into a single bundle.
* Separated from hugo, and easier to understand.
* More tailored to mobile displays; more app like; a defined place for "search" and "favorites"

Size Comparison
---
vue:
* events: 8 requests, 298 kB transferred, 296 kB resources
* details: 10 requests, 372 kB transferred, 369 kB resources
 (  30kb is the shift logo; 88kb is new ride image header )

calendar on site:
* calendar: 28 requests, 301 kB transferred, 679 kB resources
* details: 25 requests; 272 kB transferred; 617 kB resources

Changes to main:
-----
* netlify build: changed to using npm for netlify build because it simplifies managing both hugo and vite; plus it means we can control the hugo version in package.json.
* netlify.toml: adds the /events/ path to the netlify redirects 
* node backend: adds the /events/ path for 'npm run dev'
* hugo: adds a shortcode to `_index.md` to generate a json summary of the menus and pedalp archives.

Meta Issues:
-------
* missing a place for news/ special info.
* missing a clear list of sponsors ( add to the "donate" page? )
* missing the owl carousel -- but it makes me kind of dizzy, so maybe that's okay.
* missing `<del>` for cancelled events, but i think that's okay.
* no query end date; query only has "start"; the events page always shows one complete week starting with today; and shifts forward/backwards to show the next week. ( i like this simplification, but it is different. )

Overview 
--------

* CalMain:
  * Banner: switches if detailed event or pedalp 
  * Toolbar: always the same
  * Menu: always the same 

  * Content: router switches on query and params
    * CalList: if start or no query
    * EventDetail: if caldaily set
    * Search: if query=q
    * Favorites: tab

  * QuickNav: switches on contents.
  

Font Awesome 
------
font awesome icons use svg and javascript to render. they have an adapter so they can be used as vue components.  https://docs.fontawesome.com/web/use-with/vue

npm i --save @fortawesome/vue-fontawesome@latest-3
npm i --save @fortawesome/free-solid-svg-icons
npm i --save @fortawesome/free-regular-svg-icons
npm i --save @fortawesome/free-brands-svg-icons

https://fontawesome.com/search?o=r&ic=free&s=solid&ip=classic

Cal Single Page App Status 
============

## Needed for feature complete:

* show canceled ride status ( on both list and individual events )
  - communicate cancelled events using plain text on the page, plus styles.

* show featured event/s info and styles

* single event time context: should show "TODAY" above time if its today; 
  some sort of "this event has passed" if its more than an hour ago
  "starting soon" if its near, or  "X days from now"

* where does ride distance go???

## Needed for parity:
* individual ride pages should have the trailing info and discalimer
* compare and contrast to existing site! ( set data source to real site; maybe via commandline/env var)
* need to test the event `contact` field. todo: find some real events that use it ( makeFake never sets it. )
* svg icons: i'd like to use font-awesome via styles unless the svg is necessary.
* setup aria
* setup styles; note: bug: The flex box ( margins? ) on the single event page isn't quite right. Expanding the menu cuts off the event rather than pushing it down. ( It seems to work properly on the cal list page. )
* icons/css to hide/ replace ride tags (ex. General, Portland ); but maybe keep the text for screen readers?
* currently missing the "how to ical subscribe", where to add it? maybe to menu?

## Misc Issues:

* include this change: https://github.com/shift-org/shift-docs/pull/866
* review html tags ( article, section, etc. ) what's a good setup?
* compare and contrast layout/styles/functionality to bikefun app! 
* hand it around for beta testing?
* review josh's url / query parameter ideas, and see if they can be used here.
* add API_VERSION to data queries
* TBD: where should the 'shift' logo link to?
* TBD: add a pedalp button to the toolbar when pedalp is near?
* todo: read https://vuejs.org/guide/best-practices/accessibility#semantic-forms for the toolbar.
* re-measure download size after adding styles and icons

## Future Issues:

* hook up search
* implement favorites: button on list page shows your favorites; button on item page adds/removes to favorites. ( maybe you could use local storage for both queries and favorites )
* reuse the app somehow for preview event?
* consider redirecting existing urls to the single page app and trimming the old views.
* timeout/error for data fetches?
* improve loading animation ( maybe don't hide the previous data while loading )
* show loading indicator for singleEvent next/prev
* server: linked lists for single events?
* consider merging the "chrome" of calpage and single event, so just the center swaps out.
* consider a smaller server "overview" endpoint; maybe with days grouped already.
* move day sorting to server
* instead of helpers.js, what about components? [ ex. longDate as <LongDate>? )
* better communication if there is no next/prev event ( this would be a very rare edge case issue )
* update the site menu layout? (ex. donate/sponsors/about)
* minor: tooltips or labels for the lower nav buttons?
* todo: improve event details next/prev return point.
    currently you always return to the original week you came from
    shiftEvent could be smart, knowing when you've swapped weeks; updating calStart.
    ( noting that the 'start' can be any day of the week; so week is not always sunday )
    [ if return point is "now" shouldn't need to add start to it 

Benefits:
----
* Modern javascript, no more jquery.
* Fewer production dependencies ( only: dayjs, vuejs, vue-router ), uses npm to manage versions, vite packs all dependencies into a single bundle.
* Separated from hugo, and easier to understand.
* Possibly smaller download size; definitely fewer requests. ( Will need to measure after adding font awesome. Currently it's 77 fewer kb transferred, and 454 kb smaller in memory; and that's about the size of font awesome. Vite combines things down to ~7 requests vs 26. )
* More tailored to mobile displays; more app like; a defined place for "search" and "favorites"

Changes to main:
-----
* netlify build: changed to using npm for netlify build because it simplifies managing both hugo and vite; plus it means we can control the hugo version in package.json.
* netlify.toml: adds the /events/ path to the netlify redirects 
* node backend: adds the /events/ path for 'npm run dev'
* hugo: adds a shortcode to `_index.md` to generate a json summary of the menus and pedalp archives.

Macro Issues:
-------
* missing a place for news/ special info; i can imagine many people using this as their starting page; so how to announce important things?
* missing a clear list of sponsors ( could be on the "donate" page maybe? )
* missing the owl carousel -- but it makes me kind of dizzy, so maybe that's okay.
* missing `<del>` for cancelled events. ( tbd: i imagine we're using del as opposed to just styles for the sake of screen readers. but, at least according to mdn: many people with screen readers turn off notifications of ins/del; so we maybe we could communicate cancelled events using plain text on the page, plus styles. )
* no query end date; query only has "start"; the events page always shows one complete week starting with today; and shifts forward/backwards to show the next week. ( i like this simplification, but it is different. )

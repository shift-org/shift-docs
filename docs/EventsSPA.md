Events Single Page App Status 
============

Changes to main:
-----

* netlify.toml: adds the /events/ path to the netlify redirects 
* node backend: adds the /events/ path for 'npm run dev'
* hugo: splits the html header ( for all pages ) into two parts:
  1. style sheets: ( the theme, bootstrap, font awesome, etc. )
  2. page meta information, incl facicons, etc. ( the app is using the page meta but not the style sheets )

Issues:
-------

* missing a place for news/ special info; i can imagine many people using this as their starting page; so how to announce important things?
* missing a clear list of sponsors ( could be on the "donate" page maybe? )
* missing the owl carousel -- but it makes me kind of dizzy, so maybe that's okay.
* missing `<del>` for cancelled events. ( tbd: i imagine we're using del as opposed to just styles for the sake of screen readers. but, at least according to mdn: many people with screen readers turn off notifications of ins/del; so we maybe we could communicate cancelled events using plain text on the page, plus styles. )
* no query end date; query only has "start"; the events page always shows one complete week starting with today; and shifts forward/backwards to show the next week. ( i like this simplification, but it is different. )

TODOs:
----

Needed for feature complete:
* single event time context: should show "TODAY" above time if its today; 
  some sort of "this event has passed" if its more than an hour ago
  "starting soon" if its near, or  "X days from now"
* set window page description: setAttribute("content", desc); event.printdesc in main.js
* show canceled ride status ( on both list and individual events )
* show featured event/s info and styles
* where does ride distance go???
* compare and contrast to existing site! ( set data source to real site; maybe via commandline/env var)
* need to test the event `contact` field. todo: find some real events that use it ( makeFake never sets it. )

Needed for parity:
* measure download size(!)
* review html tags ( article, section, etc. ) what's a good setup?
* svg icons: i'd like to use font-awesome via styles unless the svg is necessary.
* setup aria
* setup styles
* icons/css to hide/ replace ride tags (ex. General, Portland ); but maybe keep the text for screen readers?
* compare and contrast layout/styles/functionality to bikefun app! 
* add API_VERSION to data queries
* currently missing the "how to ical subscribe", where to add it? maybe to menu?
* hand it around for beta testing?

Misc:
* review josh's url / query parameter ideas, and see if they can be used here.
* TBD: where should the 'shift' logo link to?
* TBD: self host vue?
* TBD: add a pedalp button to the toolbar when pedalp is near?
* TBD: tooltips or labels for the lower nav buttons?
* todo: read https://vuejs.org/guide/best-practices/accessibility#semantic-forms for the toolbar.

Future:
* hook up search
* implement favorites: button on list page shows your favorites; button on item page adds/removes to favorites. ( maybe you could use local storage for both queries and favorites )
* reuse the app somehow for preview event?
* consider redirecting existing urls to the single page app and trimming the old views.
* timeout/error for data fetches?
* improve loading animation ( maybe don't hide the previous data while loading )
* show loading indicator for singleEvent next/prev
* consider friendly urls:  /events/event-23/my-super-cool-ride [ or something like that ]
* server: linked lists for single events ( to improve next/prev buttons )
* use `vite` to compile and compress ( hugo events page would be just a placeholder for building the menu and pedalp json )
* consider merging the "chrome" of calpage and single event, so just the center swaps out.
* consider a smaller server "overview" endpoint; maybe with days grouped already.
* move day sorting to server
* instead of helpers.js, what about components? [ ex. longDate as <LongDate>? )
* better communication if there is no next/prev event ( this would be a very rare edge case issue )
* update the site menu layout? (ex. donate/sponsors/about)
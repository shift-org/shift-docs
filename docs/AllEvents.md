Events Feed 
--------------

**Goal**:  Provide an "all events" feed that stays up to date and address any outstanding iCalendar github issues.

Currently, there's two different ical endpoints. One for the 2022 Pedalpalooza [legacy feed](https://www.shift2bikes.org/cal/icalpp.php) using `legacy/cal/new-icalpp.php`, and one for individual [event export](https://www.shift2bikes.org/api/ics.php?id=8727) using `www/ics.php`.
    
 
## Status:

I've created a new handler: `backend/www/ical.php` to replace both the legacy and single event export. 

It returns an "all events" feed when used with no query parameters, a single event when using `?id=`, and a range of events for `?startdate=&enddate=`. The "all events" has a range of three months in the future and three months in the past. `**is that enough? too much?**` The explicit range is smaller, limited to 100 days.

I've been able to import single events ( and update them ) into MacOS Calendar.app, google, and thunderbird. Need to test as a feed, but need to host off of local for that.

## Questions and Todos:

1. **New endpoints**

    It's intended to be able to support `/cal/icalpp.php`, `/cal/shift-calendar.php`,  and `/api/ics.php` -- might want to reroute old paths to the new ones? but that's maybe some ngnix configuration work i'm not entirely sure about.
    
    Alt: could have the php files in those locations include and call the new php code?

1. **"Branding"**

    Should the calendar title read "shift" or "pedalpalooza"? ( Maybe there could be two endpoints which provide the same data just with different calendar titles?  ) 

1. **Calendar Caching**

    see [CalendarCaching]; also,  **TBD**: good Cache-Control headers? ( currently set to 3 hours. )

1. **TBD: What information to include**

    i've left it out for the moment, but the existing existing calendar exports do include some organizer info like contact email, phone number, etc. and the feeds have different levels of description ( ex. print vs. full )
    
    google doesn't handle the "url" field, so i left it as part of hte "description" even though its redundant for apple calendar, thunderbird, etc.

1. **webcal://**

    apparently, using addresses starting with `webcal://` will invoke the user's system calendar ( at least on mac; need to try on widows). 
    
    Might be worth trying for "Export to calendar" and even the all events feed.
    Currently it errors out during the process for me; maybe because its from a local host?
    ( Not sure if nginx has to be setup specially as well or not )    

1. **Manage cancel events?**

    Because event times are only cancelled, and not truly deleted: when an organizer edits their events days that they removed are now shown as "canceled" ( rather than, as before, not appearing at all. ) Should cancelled days be hidden from the organizer?

Changes
---

1. **Export to Calendar**

    Changed main.js "Export to Calendar" link to point to `ical.php` ( was `ics.php` ).
    `https://localhost:4443/api/ical.php?id=9718` The file it generates has the name `shift-calendar-9718.ics`.

1. **Canceling events**

    In order for client calendars to properly remove events, published events can never be deleted; only canceled.
    
    That requires changes to two endpoints: `delete_event.php`, and `manage_event.php`. 
        
    Instead of deleting a published event, `delete_event.php` calls `cancelEvent()`, a new function which cancels all of its `caldaily` event times (  `eventstatus = C` ) and -- to simulate the old style deletion -- sets the password `secret` to `""` so that its no longer accessible to the organizer.
    
    If an event _wasn't_ published ( `hidden = 1` ), then delete_event deletes it ( and the times ) from the database like it had been doing.
    
    For `manage_event`, when a user changes the day of an event: the original behavior was to delete the `caldaily` EventTime. Instead, now there's an `EventTime::reconcile()` which cancels the individual occurrences of published events ( or deletes unpublished ones. )

1. **Sequence** 

    When an event changes ( ex. caldaily cancelled or newsflash ) ical requires to calendars to increment a "SEQUENCE" number so clients can detect the change. 
    
    Originally, i intended this for 'caldaily' -- but since changes to the time or description alter 'calevent', and since there's no code path which can update 'caldaily' right now without updating 'calevent' -- putting it in the event makes the most sense.
    
    I've updated `setup.sql`, and added a migration to `shift-docs/services/db/migrations/0003_ical_fields.sql` with a `changes` field.
    
    There's a new function in EventTime: "storeChange()" which updates the counter. Its called when event (times) are cancelled or updated.
    
1. **Created**

    Along with `changes` i've also added a calevent `created` time to support the "CREATED" ical field. It uses "CURRENT_TIMESTAMP" so it should populate automatically.
    


Existing Support
--

### Single event export

For lack of a better name, calling this "single event export" but actually this also supports ranges. ( And note that even a single event can export multiple days: one per event recurrence. )

The event export validates with warnings, but no errors.  It has some issues but provides a good baseline of code for generating a feed.

**calendar fields:**

* Version: 2.0
* Prod Id: `-//shift2bikes.org//NONSGML shiftcal v2.0//EN`

**events fields:**

* UID: `**generated ids need to be *universally* unique.**`
* Sequence:  `**missing sequence.**`
* DT Stamp: this is correctly set to the modified time
* DT Start: from `caldaily.eventdate` + `calevent.time`
* DT end: dtstart + (`calevent.eventduration`, or 1 hour long if not specified.)
* STATUS: `**missing status, seems to show cancelled events as active events.**`
* Summary: `calevent.title`
* Location: `venue`, `address`, `locdetails`
* Description: `timedetails`, `locdetails`, shareable link.   
     `**locdetails in two places?**`
 
 note: the lines produced are maybe a little longer than they should be, and commas ( possibly other characters ) aren't escaped.
 
**html envelope:**
    
* header( 'Content-type: text/calendar; charset=utf-8' );   
    https://www.iana.org/assignments/media-types/text/calendar
    
* header( 'Content-Disposition: inline; filename=calendar.ics' );  
    https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Disposition  
     `**think this maybe should be like the legacy feed? 'attachment' not 'inline', with filename quoted.**`

### legacy 2002 feed:

The legacy feed doesn't [validate](https://icalendar.org/validator.html#results) ( has 840 errors ), and i can't load its output in thunderbird.  ( There are some newline issues among other things. )


**calendar fields:**

generally, uses a more complex form of the text value than needed. seems to be wrapping with "\n" rather than "\r\n" as required.

* Version: 2.0,  `**seems to be missing a newline here.**` not sure why, the php looks basically okay. maybe a full blank line is needed after the closing tag?
* Prod Id: `-//Shift Calendar//Pedalpalooza//EN`
* Cal Scale: `GREGORIAN`, can be omitted.
* Method: `PUBLISH`
* X-WR-CALNAME: `;VALUE=TEXT:Pedalpalooza` .
* X-WR-TIMEZONE  `;VALUE=TEXT:US/Pacific`  --  `**seems potentially wrong. maybe its using the server's timezone? i believe this isnt needed if the times are utc. need to verify...**`

**event fields:**

* UID:  universally unique. ex `20220601.15343@shift2bikes.org` `**think this needs to be based on event id instead of time so that it never changes.**`
* Sequence:  `**currently its a sequential number per item in the feed; needs to be tracked over time.**`
* DT Stamp:  `**seems to use time "now" rather than the last modified time of the event.**`
* DT Start: `;TZID=US/Pacific:20220601T073000`
* Duration:  `**has no minimum time.**`
* Summary: `calevent.title`
* Description:  `**uses `printdescr` instead of full description.**`
* Organizer:  adds the organizer's name, email, phone, weburl, and contact;  `**i think this would be okay in the `contact` field, but `organizer` in ical seems intended for email only? **`
* Location: uses `address`, `locname` (aka venue), `locdetails`.  `**maybe put venue first?**`
* Attach: ex. `https://www.shift2bikes.org/calendar/event-15343`   `**seems potentially wrong. i think this is meant for document attach. ( "URL" might be the right field ) **`

 **html envelope:** 

* header("Content-type: text/calendar");
* header("Content-Disposition: attachment; filename=\"pedalpalooza.ics\"");
* header("Cache-control: private");  
    [indicates](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control) that the response can be stored only in a private cache (e.g. local caches in browsers).  
    seems like a good starting place, and then add in etags and server caching.
    

Existing Github Issues
---

* [duplicate calendar events](https://github.com/shift-org/shift-docs/issues/420)

* [ride link missing on google](https://github.com/shift-org/shift-docs/issues/116#issuecomment-1172475905)
    
    mitigation: add the link to the description.

* A desire for [more ride details for the feed](https://github.com/shift-org/shift-docs/issues/339). 

    * default duration of 1 hour
    * a link to the listing
    * time details (e.g. “Meet 6:00pm, ride at 6:30pm)
    * location details (e.g. “Meet at the picnic tables”)
    
   
* [incorrect date format](https://github.com/shift-org/shift-docs/issues/432).
    I think this is re: the errors i see in the validator and with thunderbird.


* TBD: [include full description or print description?](https://github.com/shift-org/shift-docs/issues/116#issuecomment-1146861417)

* TBD: [possibly incorrect calendar name?](https://github.com/shift-org/shift-docs/issues/116#issuecomment-1101534820)
    
    In Thunderbird, the name was "icalpp"; in Google, "PedalpaloozaVERSION:2.0". It was fixed for thunderbird by changing the filename, but it might be google still has the wrong name.


Useful Calendar Fields
-----

* Cal Scale: can be omitted. its optional, and defaults to what's needed.  
    https://datatracker.ietf.org/doc/html/rfc5545#section-3.7.1

* Version: required. version of the calendar spec. `2.0` means rfc5545.  
    https://datatracker.ietf.org/doc/html/rfc5545#section-3.7.4

* Prod Id: universally unique id for the calendar software.  
    `-//shift2bikes.org//NONSGML shiftcal v2.0//EN`  
    `** current version is specified as 2.0... would want to update 2.1**` ( or something )
    https://datatracker.ietf.org/doc/html/rfc5545#section-3.7.3  

* Method: indicates the intended usage of the calendar.   
    `PUBLISH` seems the right option. oto, the values arent actually part of the standard, but of the proposed changes.
    * https://datatracker.ietf.org/doc/html/rfc5546#section-3.2.1
    * https://datatracker.ietf.org/doc/html/rfc5545#section-3.7.2

* X-WR-CALNAME: the name of the calendar.   
* X-WR-CALDESC: text description of the calendar.
* X-WR-RELCALID: A globally unique identifier for the calendar.

    `** branding of these for pedalpalooza specific events? (ex. at a separate endpoint)  **`   
    `Shift Bike Calendar`  
    `Find fun bike events and make new friends!`  
    `shift@shift2bikes.org`  
    https://en.wikipedia.org/wiki/ICalendar


Useful Event Fields
-----

i don't think the order matters here.

* UID: required. a **universally** unique id in an email like format.  
    ex. `event-4928492374@shift2bikes.org`

* Summary: short email like subject, aka. the title.  
    https://datatracker.ietf.org/doc/html/rfc5545#section-3.8.1.12
    
* Contact: supports generic text.   
    `** how much to share here. legacy and export are different **`  
    ex. the ical example includes phone number; ex. Jim Dolittle\, ABC Industries\, +1-919-555-1234  
    https://datatracker.ietf.org/doc/html/rfc5545#section-3.8.4.2

* Description: description of the event.  
    https://www.kanzaki.com/docs/ical/description.html

* Location: text describing the location.  
    https://datatracker.ietf.org/doc/html/rfc5545#section-3.8.1.7

* Status: should be `CONFIRMED`, or `CANCELLED` ( `TENTATIVE` is another option. )  
     https://datatracker.ietf.org/doc/html/rfc5545#section-3.8.1.11
    
* DT Start: start of the event; required when "method" is used.  
    https://datatracker.ietf.org/doc/html/rfc5545#section-3.8.2.4

* DT End, or Duration: end of the event.  
    its not clear to me if one is better than the other.
    using dtend.

    * https://datatracker.ietf.org/doc/html/rfc5545#section-3.8.2.2  
    * https://datatracker.ietf.org/doc/html/rfc5545#section-3.8.2.5

* Created: creation date/time of the event. `**feels like this would be nice to support.  **`    
    would need to add a "created" field to 'cal_event' and use "modified" as a fallback.  
    https://datatracker.ietf.org/doc/html/rfc5545#section-3.8.7.1

* DT Stamp: required. date/time of when the specific version of this event was created; so, approximately last modified time.  

    * https://stackoverflow.com/questions/11594921  
    * https://datatracker.ietf.org/doc/html/rfc5545#section-3.8.7.2
    
* Sequence: monotonically increasing revision number.  
    https://datatracker.ietf.org/doc/html/rfc5545#section-3.8.7.4

* Url: of the individual calendar item.  
    https://datatracker.ietf.org/doc/html/rfc5545#section-3.8.4.6

Misc other fields
-----

**Interesting calendar extensions**

* X-RECURRENCE-ID: in general, it'd be interesting to use recurrence fields to handle multiple times from the same event... but requires a bit more research to figure out how to properly consolidate the multiple event time records.

* X-PUBLISHED-TTL: Recommended update interval for subscription to the calendar

* ...?

**Interesting event fields**

* Geo: specifies lat/long. could be cool if that could be figured out somehow.  
    https://datatracker.ietf.org/doc/html/rfc5545#section-3.8.1.6
    
* Last Modified: approximately, when was the ical object imported ( vs. when was the data for it created.)    
    its not clear to me if this is needed when DT Stamp is specified.
    https://datatracker.ietf.org/doc/html/rfc5545#section-3.8.7.3
    
* Categories: arbitrary categorization. `**maybe user defined tags? or "Bike Fun"?**`
    https://datatracker.ietf.org/doc/html/rfc5545#section-3.8.1.2

* Organizer: Seems to be a more specifically formatted than contact.  
    ex. can be the user's email: `ORGANIZER;CN=John Smith:mailto:jsmith@example.com`  
    in theory this is required if method is, but it's rarely shown in examples.
    https://datatracker.ietf.org/doc/html/rfc5545#section-3.8.4.3

**Other event fields**

* Class: part of access control. defaults to what i think shift needs. PUBLIC\*, PRIVATE, CONFIDENTIAL. 
    https://datatracker.ietf.org/doc/html/rfc5545#section-3.8.1.3 

* Transp: controls busy/free time. defaults to what i think shift needs. OPAQUE\*, or TRANSPARENT.
    https://datatracker.ietf.org/doc/html/rfc5545#section-3.8.2.7

* Priority 
    https://datatracker.ietf.org/doc/html/rfc5545#section-3.8.1.9

* recurid
 
* Attach: looks meant for a document attachment. could maybe investigate if images are supported by anyone?
    https://datatracker.ietf.org/doc/html/rfc5545#section-3.8.1.1
    
* attendee
    
* comment: https://datatracker.ietf.org/doc/html/rfc5545#section-3.8.1.4

* exdate: https://datatracker.ietf.org/doc/html/rfc5545#section-3.8.5.1 
* exrule: https://datatracker.ietf.org/doc/html/rfc2445#section-4.8.5.2

* rstatus 
* related: https://datatracker.ietf.org/doc/html/rfc5545#section-3.8.4.5 
* resources 
* rdate: https://datatracker.ietf.org/doc/html/rfc5545#section-3.8.5.2
* rrule 
* x-prop

ICal References
---

* https://en.wikipedia.org/wiki/ICalendar
* https://en.wikipedia.org/wiki/HTTP_ETag
* https://www.kanzaki.com/docs/ical/
* https://datatracker.ietf.org/doc/html/rfc5545
* https://github.com/zcontent/icalendar - a php ical helper lib


ICal Examples
----
* https://support.google.com/appsheet/answer/11575077?hl=en
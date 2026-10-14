# Tables schema ( version 2 )

##  SERIES:

The core event data.

`cal_series`:
* `id` auto assigned integer: The event and all of its related info binds to this id. ( duplicates the existing `calevent.id` )
* `created` : Timestamp of when the series was first added to the db.
* `modified`: Timestamp of the most recent change to the series data.
* `published` integer or null. A positive integer value means published and visible to the world. Zero means not yet published by the organizer. Increments every time the series is saved ( for the sake of ical feeds ). `null` means "revoked" -- they are skipped by all queries.
* `title` string: human readable name of the event.
* `organizer` string: Public visible name of the person or group who authored the event.
* `start_time` string: *local* time as HH:DD:00. **IMPORTANT**: this isn't a mysql timestamp! if an organizer on the east coast says "ride starts at 8AM" we can look in the db expect to see "08:00:00" regardless of their time zone, our time zone, or the server's timezone.
* `scheduled_duration` integer: time in minutes of any given instance of the event.
* `details`: A large text string containing a description of the event. ( replaces `descr ) `
* `tiny_title`  string: optional shorter version of the title.
* `summary` small text: optional shorter version of details ( was printdescr )

## SCHEDULE:

A specific instance of a given series on a particular day. These are uniquely identified by the combination of its series and day ( the `id` and `ymd` fields, respectively. )

`cal_schedule`:
* `id` ref: The series id.
* `ymd`: Day that the event takes place as a YYYY-MM-DD string. Multiple days can exist for a single series. Individual days are unique within each series.
* `is_scheduled`: 0 or 1, implying cancelled or active respectively.
* `news`: When an organizer reschedules or cancels a given day, this string allows them to explain why.
* `added`: timestamp of when this entry was created.
* `changed`: timestamp of when this entry was last modified.
* `pkid` auto assigned integer: deprecated. exists for backwards compatibility.

## PRIVATE:

Holds potentially sensitive data that requires explicit permission to display. Rationale: we can easily anonymized data by dropping this table.

`cal_private`:
* `id` ref: Exactly one private row exists for every event series.
* `secret` string: user password.
* `show_email` showable enum: Whether the organizer wants to share their private_email address.
* `show_phone` showable enum: Whether the organizer want to share their private_phone number.
* `show_contact` showable enum: Whether the organizer want to share their private_contact info.
* `private_email` string: The organizer's email.
* `private_phone` string: The organizer's phone number.
* `private_contact` string: Any arbitrary information the organizer would like to share about themselves.

The `showable` enum values are: "private", "public", "visible", "printable". where visible means showable online, printable means showable on the printed calendar, public means both, and private means neither. While printable in the calendar (but not visible online) seems like an odd combination to me, there are rides marked this way.

## LOCATION:

Provides extended data about the start and end of an event.

`cal_location`:
* `id` ref: The event series. Multiple locations can exist for a given series.
* `loc_type`: a string containing either 'start' or 'finish'.
* `place_name`: arbitrary string name for the location.
* `address`: a string containing a "mappable" location, a url ( ex. google maps ), or some placeholder like "TBD, or "TBA".
* `place_info`: a string containing extra info provided by the organizer. ( replaces `locdetails` )
* `time_info`: a string containing extra info provided by the organizer. ( replaces `timedetails` )

## WEB:

Off-site links to websites and social accounts for an event.

`cal_web`:
* `id` ref: The event series. An arbitrary number of web entries can exist for a given series so long as they each have a unique web_type. The application code only supports the web_type "url".
* `web_type` string: ex. "url", could be "bluesky", or whatever.
* `web_text` string: A description of the link provided by the organizer.
* `web_link` string: ex. "https://example.come"
* `show_weburl` a `showable` enum

## TAG:

Extra data associated with an event. The *values* for a given tag are pulled from a set of predefined choices particular to its name. One could imagine these are "app" specific values. For example hiking might need different information than bike riding.

`cal_tag`:
* `id` ref: The event series. An arbitrary number of tags can exist for a given series so long as their tag_names are unique.
* `tag_name` string: some examples below.
* `tag_value` string, ex. the string "true".

Maybe someday tags could be added directly by users. For now, the application supports these specific tag types and values:

* audience: "General", "Family", "Adult".
* area: ex. "Portland", "Vancouver", etc.
* safety: the string "true", or doesn't exist and isn't covid friendly.
* featured: the string "true" ( or potentially some extra details about why the event is featured: ex. "bikesummer" ).
* loop: the string "true", or doesn't exist and isn't a loop.
* distance: one of a set of predetermined strings indicating a length in miles: "0-3",  ..., "15+"

Maybe:
* pace ex. easy, steady, strenuous, etc. `no drop`?
* protest: ex. "true", or doesn't exist and isn't a protest ride.

## IMAGE:

For events with images. Stored as its own table because not all event series have images ( and perhaps we might want to allow multiple images someday. )

`cal_image`:
* `id` ref: At most one image can exist per series.
* `img_version` int: Exists for cache-busting. Incremented whenever a new image is uploaded.
* `img_ext` short string: The original file extension, lowercased.
* `img_override` string: For images that we maintainers have manually set to a specific file; used very rarely. Typically the image filename is the `id.ext` and this override string is blank.

# Time Handling

The SERIES start_time and the SCHEDULE days are stored as **strings**, `HH:MM:00` and `YYYY-MM-DD` respectively. They match the values specified by the organizer and are not shifted into any particular time-zone. For Shift, that means they are essentially Pacific Time relative to the scheduled day ( so that daylight-savings or standard-time depends on the day in question. ) Client code is required to understand that representation and display the times accordingly ( ex. by labeling the time, or by shifting to the user's timezone. )

Database created and modified times are stored as TIMESTAMP(s) ( ex. `2023-02-27 18:59:39` ) and are from the perspective of the server.

---
# Views

The two most important views provide backwards compatibility with the original table format:

## calevent:

`view_public_series`:
* `id`: series id
* `password`: string generated by the server, sent to the organizer in email.
* `created`: timestamp of when this series was created
* `modified`: timestamp of when this series was last modified
* `changes` int: sequential counter indicated the number of time the organizer has changed the event. used primarily for the calendar feed so that ical clients will notice when changes to the event have occurred. also used for event image cache busting.
* `name` string: the organizer's provided name
* `email` string, `hideemail` bool, `printemail` bool: the organizer's email address
* `phone` string, `hidephone` bool, `printphone` bool: the organizer's phone number ( optional )
* `weburl` string, `webname` string, `hideweburl` `printweburl` bool: optional event web site provided by the organizer.
* `contact` string, `hidecontact` bool, `printcontact` bool: any additional contact info provided by the organizer.
* `title` string: event title.
* `tinytitle` string: event string used for the printed calendar and other small summaries.
* `audience` char: one of 'G", "F", or "A" for general, family friendly, or Adult (21+).
* `descr` text, `printdescr` text: event description for website and print calendar.
* `image` string: name and extension of ride image ( if any )
* `eventtime` string ( 24 hour time: 19:00:00 ). there is one time for all events even if they occur on multiple days.
* `eventduration` int: length of ride as a number of minutes
* `timedetails` string: extra details about the event time.
* `locname` string: arbitrary name provided by the organizer
* `address` string: a "mappable" description. ex. "TBD, "TBA", or a url ( ex. google maps )
* `locdetails` string: extra details about the location.
* `locend` string: specifics about the end of the ride.
* `loopride` bool: does the ride end where it starts.
* `area` char: ex. `P` for Portland, or `V` for  Vancouver
* `highlight` bool: featured events. this bool is set by the shift team, not the organizer. it provides special styling on the front end.
* `hidden` bool: has the event been published? ( ie. has the person read their email and clicked the password link? )
* `safetyplan` bool: true if the organizer checked the "covid safety plan" checkbox.

## caldaily:

Represents a single occurrence on a particular day of a **calevent**.

Although the table has its own auto incrementing primary key (pkid),
the application keeps the (cal event id, event date) pairing unique.
That pairing is its true identity.

`view_public_schedule`:

* `id`: series id.
* `pkid`: deprecated unique id for a scheduled entry.
* `added`: timestamp of when this entry was created
* `changed`: timestamp of when this entry was last modified
* `eventdate`: YYYY-MM-DD string
* `newsflash`: organizer provided string.
* `eventstatus` either `A` ( active ) or `C` ( cancelled )

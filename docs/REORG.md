

##  SERIES:

The core ride data. ( similar to calevent; but many fewer columns. )

* `id` auto assigned integer: The ride and all of its related info binds to this id. ( duplicates the existing `calevent.id` )
* `created` time: The date and time the ride was first added to the db. ( TODO: verify migrated data has a decent creation/modified time.
* `modified` time: The date and time of the most recent change to the ride data. ( TODO: verify this is working as expected )
* `published` integer: Non-zero when visible to the world, `null` means revoked/unpublished. Increments every time the ride data gets updated. ( basically, merges 'hidden' and 'change_counter'. If the current data has a null or blank `password`, then published would be null; otherwise it'd be the opposite of hidden )
* `title` string: human readable name of the ride.
* `organizer` string: Name of the person or group who authored the ride ( replaces `name` )
* `start_time` string: *local* time as HH:DD. **IMPORTANT**: this isn't a mysql timestamp!  if an organizer on the east coast says "ride starts at 8AM" we can look in the db expect to see "08:00" regardless of their time zone, our time zone, or the server's timezone. ( replaces eventtime )
* `ride_duration` integer: time in minutes. ( replaces eventduration )
* `tiny_title`  string: optional shorter title.
* `summary` small text:  ( was printdescr )
* `details` large text: contains a complete description of the ride. ( replaces `descr ) `

## SCHEDULE:

A specific outing of a specific ride series. These are uniquely identified by the combination of its series and day ( the `id` and `ymd` fields, respectively. )

* `id` ref: Multiple scheduled days can exist for a single ride series.
* `ymd` string: Day that the ride takes place in YYYY-MM-DD format.
* `news` string, replaces `newsflash`
* `status` small integer: can be 1, 0, or null. 1 is active, 0 is cancelled, null is delisted. ( replaces `eventstatus`. )
* `pkid` auto assigned integer: deprecated. exists for backwards compatibility.

## PRIVATE:

Holds any and all data that requires explicit permission to display. Rationale: by putting all private data in its own table, we can easily export anonymized data ( by simply excluding this table. )

* `id` ref: Exactly one private row exists for every ride series.
* `secret` string: user password.
* `show_email` showable enum: Whether the organizer wants to share their private_email address.
* `show_phone` showable enum: Whether the organizer want to share their private_phone number.
* `show_contact` showable enum: Whether the organizer want to share their private_contact info.
* `private_email` string: The organizer's email.
* `private_phone` string: The organizer's phone number.
* `private_contact` string: Any arbitrary information the organizer would like to share about themselves.

The `showable` enum values are: "private", "public", "visible", "printable". ( while printable but not visible seems like an odd combination to me, there are rides marked this way. )

## LOCATION:

Provides extended data about the start and end of a ride.

* `id` ref: One or more locations exist for a given ride. For example, all rides have a start, and many have an end. )
* `loc_type` string: 'start' or 'finish' ( replaces `eventtime` )
* `place_name` string: arbitrary name for the location.
* `address` string: human readable address of the location.
* `place_info` string: extra info provided by the organizer. ( replaces `locdetails` )
* `time_info` string:  extra info provided by the organizer. ( replaces `timedetails` )

## WEB:

Includes any off site links to websites or social accounts. ( Replaces 'weburl' and 'webname' )

* `id` ref: An arbitrary number of web entries can exist for a given ride series; although, currently we only support one. ( for website "url" )
* `web_type` string: ex. "url", could be "bluesky", or whatever.
* `web_text` string: A description of the link provided by the organizer.
* `web_link` string: ex. "https://example.come"
* `printable` bool: should this be printed in the print calendar.

## TAG:

* `id` ref: An arbitrary number of tags can exist for a given ride series.
* `tag_name` string: some examples below.
* `tag_value` string, or the string "true".

Maybe someday tags could be added directly by users. For now, these would be our built-in tags:

* audience: "General", "Family", "Adult"
* area: ex. "Portland", "Vancouver", etc.
* safety: the string "true", or doesn't exist and isn't covid friendly.
* featured: the string "true", some extra details, or doesn't exist and isn't featured.
* loop: the string "true", or doesn't exist and isn't a loop.
* distance: one of the exiting strings: "0-3",  ..., "15+"

Maybe:
* pace ex. easy, steady, strenuous, etc. `no drop`?
* protest: "true", or doesn't exist and isn't a protest ride.

## IMAGE:
for any rides with images;  rationale: not all rides have images;

* `id` ref: At most one image can exist per ride series.
* `img_version` int: Exists for cache-busting. Incremented whenever a new image is uploaded.
* `img_ext` short string: The original file extension, lowercased.
* `img_override` string: For images that we maintainers have manually set to a specific file; used very rarely. Typically the image filename is the `id.ext` and this override string is blank.
* `img_alt` string:  future idea. Organizer specified alt text for the image.

----
# Time Handling

The SERIES start_time and the SCHEDULE days are stored as **strings**, `HH:DD` and `YYYY-MM-DD` respectively. They are measured relative to organizer's time zone, not the server's time zone, nor utc. This is intended to avoid questions around the SCHEDULE(d) day of an east coast ride starting at 11:59 PM when stored on a west coast server.

Database created and modified times, however, are stored as TIMESTAMP(s) and are from the perspective of the server.

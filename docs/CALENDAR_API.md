# Calendar API

**Work in progress**

----

## General

Base URL:
* production: `https://www.shift2bikes.org/api/`
* local development: `https://localhost:4443/api/`

Most responses are in JSON format, except for:
* event export returns vCalendar format
* event crawl returns HTML

## Viewing events

### Retrieving public event data

Endpoint:
* GET `events`

Example requests:
* `/events.php?startdate=2019-06-01&enddate=2019-06-15`
* `/events.php?id=1234`

URL parameters:
* `startdate`:
  * first day of range, inclusive
  * `YYYY-MM-DD` format
  * if not provided, current date is used
* `enddate`:
  * last day of range, inclusive
  * `YYYY-MM-DD` format
  * if not provided, current date is used
* `id`:
  * `caldaily` event ID
  * if `id` is provided, it takes precedence over `startdate` and `enddate`; the date range will be ignored

Unknown parameters are ignored.

It is recommended that you always provide either an event `id` or both `startdate` and `enddate`. Relying on default or inferred values may return unexpected results.

Success:
* status code: `200`
* `events`: array of event objects; array may be empty
* each event object: key-value pairs of all available public fields; does not contain any private fields (use `manage_event` endpoint for those)
* when using `id` parameter, array is expected to return 1 object; if the ID does not match a known event, you will receive a `200` response with an empty `events` array

Example response for a single event:

    {
      "events": [
        {
          "id": "6245",
          "title": "Shift to Pedalpalooza Ride",
          "venue": "director park",
          "address": "877 SW park",
          "organizer": "fool",
          "details": "Have you ever wondered how Pedalpalooza happens every year...and did you know we have a team of programmers who work on the shift calendar and website.  There is a lot of rewarding volunteer work that goes on behind the scenes and we are recruiting for new folks who are interested in helping out next year and beyond.  Come on this ride and we will talk a little bit about the history of shift and try to find you a place to help out in the future.  We will end at a family friendly watering hole.  First round of drinks is on shift.  We will be done by 8 so you can check out other rides.",
          "time": "18:00:00",
          "hideemail": "1",
          "length": null,
          "timedetails": null,
          "locdetails": null,
          "eventduration": "120",
          "weburl": null,
          "webname": "shift",
          "image": "/eventimages/6245.jpg",
          "audience": "G",
          "tinytitle": "shift2pedalpalooza",
          "printdescr": "learn how to get involved with shift and pedalpalooza",
          "datestype": "O",
          "area": "P",
          "featured": false,
          "printemail": false,
          "printphone": false,
          "printweburl": false,
          "printcontact": false,
          "email": null,
          "phone": null,
          "contact": null,
          "date": "2017-06-05",
          "caldaily_id": "9300",
          "shareable": "https://shift2bikes.org/calendar/event-9300",
          "cancelled": false,
          "newsflash": null,
          "endtime": "20:00:00"
        }
      ]
    }

Example response for a range of events: 

    {
      "events": [
        {
          "id": "1234",
          ...
        },
        {
          "id": "1236",
          ...
        },
        {
          "id": "2200",
          ...
        }
      ], 
      "pagination": {
        "start": "2024-07-01",
        "end": "2024-07-11",
        "range": 10,
        "events": 3,
        "next": "https://www.shift2bikes.org/api/events.php?startdate=2024-07-12&enddate=2024-07-22"
      }
    }

Errors:
* status code: `400`
* `error`: object containing `message` key
* `message`: text string explaining the error
* possible errors
  * `enddate` before `startdate`
  * date range too large (100 days maximum)

Example error:

    {
      "error": {
        "message": "enddate: 2019-06-01 is before startdate: 2019-06-15"
      }
    }


### Exporting an event

Endpoint:
* GET `ics`

Example request:
* `/ics.php?id=1234`

URL parameters:
* `id`: `calevent` event ID

Errors:
* status code: `404`
* possible errors
  * no `id` specified
  * `id` not found? (**TODO**: verify)


### Crawling an event

Endpoint:
* GET `crawl`

Example request:
* `/crawl.php?id=1234`

URL parameters:
* `id`: `caldaily` event ID

Unknown parameters are ignored.

This endpoint is used by web crawlers such as search engines.

Success:
* status code: `200`
* returns a simple HTML rendering of ride data
* if `id` parameter is not present, a short, general message about Shift


Example response:

    <html>
        <head>
            <title>Shift to Pedalpalooza Ride</title>
            <meta property="og:title" content="Shift to Pedalpalooza Ride">
            <meta property="og:url" content="https://www.shift2bikes.org/calendar/event-9300">
            <meta property="og:image" content="https://www.shift2bikes.org/eventimages/6245.jpg">
            <meta property="og:type" content="article">
            <meta property="og:description" content="Have you ever wondered how Pedalpalooza happens every year...and did you know we have a team of programmers who work on the shift calendar and website.  There is a lot of rewarding volunteer work that goes on behind the scenes and we are recruiting for new folks who are interested in helping out next year and beyond.  Come on this ride and we will talk a little bit about the history of shift and try to find you a place to help out in the future.  We will end at a family friendly watering hole.  First round of drinks is on shift.  We will be done by 8 so you can check out other rides.">
            <meta property="og:site_name" content="SHIFT to Bikes">
            <meta name="description" content="Have you ever wondered how Pedalpalooza happens every year...and did you know we have a team of programmers who work on the shift calendar and website.  There is a lot of rewarding volunteer work that goes on behind the scenes and we are recruiting for new folks who are interested in helping out next year and beyond.  Come on this ride and we will talk a little bit about the history of shift and try to find you a place to help out in the future.  We will end at a family friendly watering hole.  First round of drinks is on shift.  We will be done by 8 so you can check out other rides.">
            <meta name="keywords" content="bikes,fun,friends,Portland,exercise,community,social,events,outdoors">
        </head>
        <body>
            <h2>Mon, Jun 5th, 6:00 PM - Shift to Pedalpalooza Ride</h2>
            <p>Have you ever wondered how Pedalpalooza happens every year...and did you know we have a team of programmers who work on the shift calendar and website.  There is a lot of rewarding volunteer work that goes on behind the scenes and we are recruiting for new folks who are interested in helping out next year and beyond.  Come on this ride and we will talk a little bit about the history of shift and try to find you a place to help out in the future.  We will end at a family friendly watering hole.  First round of drinks is on shift.  We will be done by 8 so you can check out other rides.</p>
            <p>877 SW park</p>
            <img src="https://www.shift2bikes.org/eventimages/6245.jpg">
        </body>
    </html>

Errors:
* status code: `404`
* body of response is empty
* possible errors
  * `id` not found
  * `id` of a hidden (unpublished) event


## Managing events

### Retrieving all event data

Endpoint:
* GET `retrieve_event`

URL parameters:
* `id`: `calevent` event ID
* `secret`: event password

The `retrieve_event` endpoint returns all private data for the event (if the `secret` is provided) so it can be edited. If you just want to retrieve public data to display the event, use the `event` endpoint.

Success:
* status code: `200`
* key-value pairs of all available fields; the response is similar to the `event` endpoint's event object, but note that they are not identical (the `datestatuses` block, for example)
* if a valid `secret` is provided, all stored values are returned; if not, you still get a `200` response but private fields (e.g. `email`) will be empty

Example response:

    {
      "id": "6245",
      "title": "Shift to Pedalpalooza Ride",
      "venue": "director park",
      "address": "877 SW park",
      "organizer": "fool",
      "details": "Have you ever wondered how Pedalpalooza happens every year...and did you know we have a team of programmers who work on the shift calendar and website.  There is a lot of rewarding volunteer work that goes on behind the scenes and we are recruiting for new folks who are interested in helping out next year and beyond.  Come on this ride and we will talk a little bit about the history of shift and try to find you a place to help out in the future.  We will end at a family friendly watering hole.  First round of drinks is on shift.  We will be done by 8 so you can check out other rides.",
      "time": "18:00:00",
      "hideemail": "1",
      "length": null,
      "timedetails": null,
      "locdetails": null,
      "eventduration": "120",
      "weburl": null,
      "webname": "shift",
      "image": "/eventimages/6245.jpg",
      "audience": "G",
      "tinytitle": "shift2pedalpalooza",
      "printdescr": "learn how to get involved with shift and pedalpalooza",
      "datestype": "O",
      "area": "P",
      "featured": false,
      "printemail": false,
      "printphone": false,
      "printweburl": false,
      "printcontact": false,
      "email": "user@example.com",
      "phone": null,
      "contact": null,
      "datestatuses": [
        {
          "id": "9300",
          "date": "2017-06-05",
          "status": "A",
          "newsflash": null
        }
      ]
    }

Errors:
* status code: `400`
* possible errors
  * no `id` specified
  * `id` not found


### Adding or updating an event

Endpoint:
* POST `manage_event`

Request can be sent as JSON, or as multipart/form-data containing binary image data plus JSON.

URL parameters:
* none

Request body:
* required fields
  * `id`: `calevent` event ID (blank when creating an event, required when updating); set by the server on create; ignored if provided by the user when creating a new event
  * `secret`: event password (required only when `id` is provided); set by the server, ignored if provided by the user when creating a new event
  * `title`: event name
  * `details`: event description
  * `organizer`: organizer name
  * `email`: organizer email
  * `venue`: location name
  * `address`: location address; should be mappable with online map services (e.g. Google Maps) _or_ be a valid http/s URL
  * `time`: event start time
  * `datestatuses`: array of datestatus objects, one for each event occurrence
    * `id`: `caldaily` occurrence ID (blank when creating an occurrence, required when updating); set by the server, ignored if provided by the user when creating a new occurrence
    * `date`: event date, YYYY-MM-DD format
    * `status`: `A` (active, aka scheduled; default) or `C` (cancelled)
    * `newsflash`: brief message unique to the occurrence; optional
  * `code_of_conduct`: boolean; organizer must agree to Shift's [Code of Conduct](/pages/shift-code-of-conduct/)
  * `read_comic`: boolean; organizer must confirm they have read the [Ride Leading Comic](/images/rideleadingcomiccolor.jpg)
* optional fields
  * `audience`: `G` (General; default), `F` (Family-friendly), `A` (Adults-only)
  * `safetyplan`: boolean; if the organizer pledges to follow Shift's [COVID Safety Plan](/pages/public-health/#safety-plan)
  * `area`: `P` (Portland; default), `V` (Vancouver WA), `W` (Westside), `E` (East Portland), `C` (Clackamas)
  * `timedetails`: any additional time details, e.g. if there is a separate meet time and ride time
  * `eventduration`: duration, in minutes
  * `locdetails`: any additional time details, e.g. meet by the tennis courts
  * `locend`: end location details; can be any description, does not have to be mappable (e.g. "Outer Southeast" or "near Beaverton Transit Center")
  * `loopride`: boolean; if ride end location is the same as the start
  * `length`: length of ride, in miles; `--` for unspecified, or `0-3`, `3-8`, `8-15`, or `15+`
  * `weburl`: http/s URL, e.g. `https://pdx.social/@shift2bikes`
  * `webname`: friendly URL name, e.g. `@shift2bikes@pdx.social`
  * `phone`: organizer phone number
  * `contact`: any additional contact info for the organizer; can be a name, an email address, another web URL, social media link, PO Box, or anything else
  * `image`: URL to the event image, e.g. `/eventimages/12345.jpg`; set by the server, ignored if provided by the user (see note below for how to add an image)
  * `tinytitle`: short event name (max 24 characters); used for the Pedalpalooza print calendar, and in some places online where space is tight (e.g. month view); if this is not provided, the first 24 characters of the `title` field will be automatically copied into this field
  * `printdescr`: short event description (max 120 characters); used for the Pedalpalooza print calendar, and in some places online where space is tight
  * `hideemail`: boolean; don't list organizer's email online; default true
  * `hidephone`: boolean; don't list organizer's phone number online
  * `hidecontact`: boolean; don't list organizer's additional contact info online
  * `printemail`: boolean; include organizer's email in the print calendar
  * `printphone`: boolean; include organizer's email in the print calendar
  * `printweburl`: boolean; include organizer's email in the print calendar
  * `printcontact`: boolean; include organizer's email in the print calendar
  * `featured`: boolean; featured ride status, set by admins and ignored if provided by the user
  * `published`: boolean; set by the server, ignored if provided by the user

Unknown properties are ignored.

Example JSON request:

    {
        "id": "99999",
        "secret": "1234567890abcdef1234567890abcdef",
        "title": "Fun Bike Ride",
        "details": "Funtime biketime get your bike fun on",
        "audience": "G",
        "time": "5:00 PM",
        "timedetails": "",
        "eventduration": "",
        "area": "P",
        "venue": "TBA",
        "address": "TBA",
        "locdetails": "",
        "locend": "",
        "length": "--",
        "organizer": "Josh",
        "email": "test@test.test",
        "hideemail": "1",
        "webname": "",
        "weburl": "",
        "phone": "",
        "contact": "",
        "tinytitle": "Fun Bike Ride",
        "printdescr": "So much fun!",
        "code_of_conduct": "1",
        "read_comic": "1",
        "datestatuses": [
          {
            "id": "",
            "date": "2024-07-07",
            "status": "A",
            "newsflash": ""
          }
        ]
    }

Success:
* status code: `200`
* if a valid `id` is provided (to update an event), a valid `secret` must also be included
* response body is the same as the `retrieve_event` endpoint

Errors:
* status code: `400`
* possible errors
  * no request body or not parseable JSON
  * required field was not included, or has an invalid value
  * invalid `secret` (when updating)

Example error:

    {
      "error": {
        "message": "Invalid secret, use link from email"
      }
    }

To add an image to the event, use a multipart/form-data request and send the image as binary. Accepts gif, jpeg, pjpeg, and png images, up to 2 MB.

Example multipart/form-data request:

    -----------------------------1234123412341234123412341234
    Content-Disposition: form-data; name="file"; filename="image.jpg"
    Content-Type: image/jpeg
    
    <binary image data>
    -----------------------------1234123412341234123412341234
    Content-Disposition: form-data; name="json"
    
    { "id":"99999", ..., "datestatuses": [ { ... } ]}
    -----------------------------1234123412341234123412341234--

Success:
* status code: `200`
* response body is the same as when submitting a JSON-only request

Errors:
* status code: `400`
* possible errors
  * unsupported file type
  * file size too large

Example error:

    {
      "error": {
        "message": "The file uploaded is not an image"
      }
    }


### Deleting an event

Endpoint:
* POST `delete_event`

URL parameters:
* none

Request body:
* required fields
  * `id`: `calevent` event ID
  * `secret`: event password
* optional fields
  * none

Unknown properties are ignored.

Example request:

    {
        "id": "6245",
        "secret": "example"
    }

Success:
* status code: `200`
* `success` true message

Example response:

    {
        "success": true
    }

Errors:
* status code: `400`
* possible errors
  * no request body or not parseable JSON
  * `id` not included
  * invalid `id`
  * invalid or missing `secret`

Example error:

    {
      "error": {
        "message": "Invalid secret, use link from email"
      }
    }

----

## Changelog

### v1

* 1.0.0: From Shift formation (c. 2002) until v2 (mid-2017)

There were undoubtedly revisions during this time, but changelog documentation is not available.


### v2

* 2.0.0: (2017-06-09) Launch of the `/fun` mobile-friendly calendar view, added to the existing PHP-based site

As with v1, there were probably revisions to v2 during this time, but changelog documentation is not available.


### v3

* 3.0.0: (2019-03-14) Launch of Hugo-based site; the API is now fully separated from the front-end
* 3.0.1: (2019-03-25) Fixed ICS export
* 3.0.2: (2019-04-01) Events and ICS endpoint documentation
* 3.1.0: (2019-04-11) Maximum day range (45 days) for Events endpoint
* 3.2.0: (2020-02-02) Added more details to ICS export
* 3.2.1: (2020-04-23) Added temporary blanket cancellation to Events endpoint
* 3.2.2: (2020-05-21) Bug fixes and documentation for the Retrieve Event
* 3.3.0: (2020-05-30) Hidden events are excluded from the Events and Crawl endpoints; added error checks on Crawl endpoint; error handling and documentation for Delete Event endpoint
* 3.4.0: (2020-06-05) Publishing an event requires second post to Manage Event endpoint
* 3.4.1: (2020-06-07) Updated blanket cancellation date on Events endpoint
* 3.4.2: (2020-08-13) Removed blanket cancellation from Events endpoint
* 3.5.0: (2021-03-28) Print details are no longer required to submit an event
* 3.6.0: (2021-04-21) Increased max day range on Events endpoint to 100 days, to accommodate 3-month Pedalpalooza
* 3.7.0: (2021-05-19) Added "loop ride" and "location end details" fields
* 3.8.0: (2021-05-28) Added "COVID safety plan" field
* 3.9.0: (2023-05-11) iCal feed improvements: better handling of cancelled or deleted events; adds more info to each event
* 3.9.1: (2023-05-16) Bug fix for soft deleting event occurrences
* 3.9.2: (2023-05-18) Better enforcement of max image size
* 3.10.0: (2023-10-09) Cache busting for updated event images
* 3.11.0: (2024-01-22) New values for Area field (Westside, East Portland, Clackamas); added pagination object to Events endpoint response when requesting a range of events
* 3.11.1: (2024-02-12) Manage Event (create/update) endpoint documentation

# Calendar API

**Work in progress**

----

## General

Base URL:
* production: `https://www.shift2bikes.org/api/`
* local development: `https://localhost:4443/api/`

All responses are in JSON format, except for event export which uses vCalendar format.

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

Example response:

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

Errors:
* status code: `400`
* `error`: object containing `message` key
* `message`: text string explaining the error
* possible errors
  * `enddate` before `startdate`
  * date range too large (45 days maximum)

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


## Managing events

### Retrieving all event data

Endpoint:
* GET `retrieve_event`

URL parameters:
* `id`: `calevent` event ID
* `secret`: event password

**TODO**


### Adding or updating an event

Endpoint:
* POST `manage_event`

**TODO**


### Deleting an event

Endpoint:
* POST `delete_event`

**TODO**


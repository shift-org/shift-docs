/**
 * Crawl: Returns a simple HTML rendering of ride data.
 * Used by web crawlers such as search engines.
 *
 * Expects an (optional) TIME id using url query parameter; ex:
 *    https://api.shift2bikes.org/api/crawl?id=15229
 *    https://localhost:3080/api/crawl?id=1893
 *
 * See also:
 *   https://github.com/shift-org/shift-docs/blob/main/docs/CALENDAR_API.md#crawling-an-event
 */
const config = require("../config");
const { CalEvent } = require("../models/calEvent");
const { CalDaily } = require("../models/calDaily");
const { to12HourString, from24HourString, friendlyDate } = require("../util/dateTime");

exports.get = function(req, res, next) {
  let id = req.query.id;
  const p = {
    title: config.crawl.title,
    description : config.crawl.description,
    url : config.site.url(),
    image: config.crawl.image,
    siteName: config.site.name,
    type: "website",
  };
  if (!id) {
    res.render('crawl.html', p);
  } else {
    return CalDaily.getByDailyID(id).then((at) => {
      if (!at) {
        res.sendStatus(404); // returns not found
      } else {
        return CalEvent.getByID(at.id).then((evt) => {
          if (!evt) {
            res.sendStatus(404); // returns not found
          } else {
            res.render('crawl.html',Object.assign(p, {
              title: evt.title,
              url: config.site.url("calendar", "event-${at.id}"),
              image: evt.image || p.image,
              type: "article", //FIXME: Does FB support 'event' yet?
              description: evt.desc,
              address: evt.address,
              when : {
                // ex. "Mon, Aug 8th"
                // if the eventdate is invalid, the value here is 'null'
                date: friendlyDate( at.eventdate ),
                // note: the event time is stored as "19:00:00"
                // and we want to report it as "7:00 PM"
                // if the eventtime is invalid, the value here is 'null'
                time: to12HourString( from24HourString(evt.eventtime) ),
              },
            }));
          }
        });
      }
    }).catch(next);
  }
}

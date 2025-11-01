/**
 * Crawl: Returns a simple HTML rendering of ride data.
 * Used by web crawlers such as search engines.
 *
 * Expects an (optional) TIME id using url query parameter; ex:
 *    https://api.shift2bikes.org/api/crawl.php?id=15229
 *    https://localhost:3080/api/crawl.php?id=1893
 *
 * See also:
 *   https://github.com/shift-org/shift-docs/blob/main/docs/CALENDAR_API.md#crawling-an-event
 */
const config = require("../config");
const { to12HourString, from24HourString, friendlyDate } = require("../util/dateTime");
const { summarize } = require("../models/summarize");

// TODO: nothing really uses this endpoint; remove?
exports.get = function(req, res, next) {
  const id = req.query.id;
  const page = {
    title: config.crawl.title,
    description : config.crawl.description,
    url : config.site.url(),
    image: config.crawl.image,
    siteName: config.site.name,
    type: "website",
  };
  if (!id) {
    res.render('crawl.html', page);
  } else {
    return summarize.events({dayId: id}).then(events => {
      if (!events.length) {
        res.sendStatus(404); // returns not found
      } else {
        // since we are requesting a specific day, 
        // we expect at most one event summary.
        const evt = events[0];
        res.render('crawl.html', Object.assign(page, {
              title: evt.title,
              url: evt.shareable,
              image: evt.image || page.image,
              type: "article",
              description: evt.details,
              address: evt.address,
              when : {
                // ex. "Mon, Aug 8th"
                date: friendlyDate(evt.date),
                // note: the event time is stored as "19:00:00"
                // and we want to report it as "7:00 PM"
                // if the eventtime is invalid, the value here is 'null'
                time: to12HourString( from24HourString(evt.time) ),
              },
        }));
      }
    }).catch(next);
  }
}

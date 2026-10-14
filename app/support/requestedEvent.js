const db = require('shift-docs/db');
const config = require('shift-docs/config');
const { uploader } = require('shift-docs/uploader');
const reconcile = require('shift-docs/support/reconcile');
const dt = require('shift-docs/util/dateTime');

module.exports = {
  checkEvent,
  writeEvent,
  writeImage
};

// promise publication count
// returns null if not published
function checkEvent(id, secret) {
  return db
    .query("view_private_checks")
    // knex has the annoying behavior that an undefined value
    // results in an unused binding, which makes the query throw
    // since the calling code wants null on missing value, reduce undefined to null.
    .where({ id: id ?? null, secret: secret ?? null })
    .then((rows) => {
      if (!rows.length) {
        return null;
      } else {
        // the update_check gaurentees published is non-null
        const published = rows[0].published;
        console.assert(
          Number.isInteger(published),
          "expected a valid publication status",
        );
        return published;
      }
    });
}

function writeEvent(id, event, schedule, nextPublished) {
  return db.query.transaction((tx) => {
    // we've read the current published value from the db:
    // increment it, and store it into the new series data.
    // not sure if the transaction saves us from race conditions on the counter.
    // (ex. if two requests to update the same event are being processed at the same time)
    // but i don't think it matters much.
    event.series.published = nextPublished;
    return reconcile.updateEventData(tx, id, event, schedule);
  });
}

// returns the url of the new image, or throws on error.
// fix? this results in errors saving the event even if all the other data was okay.
// todo: a way of clearing the image?
async function writeImage(id, fileData) {
  // first write the image to disk as (id.ext)
  // returns { name, ext }
  const f = await uploader.write(fileData, id.toString());
  // then write that to the the db
  await reconcile.updateImageData(db.query, id, f.name, f.ext);
  // we use the image sequence number to disrupt the browser's cache
  // but here, the client just needs to know something changed.
  // we stamp the image with the time b/c its guaranteed to be unique.
  // when someone asks for the event data next, it'll return real, the updated sequence id.
  // [ doing this saves us from having to query the results of the update here ]
  const unique = dt.icalFormat(dt.getNow());
  const filename = `${f.name}-${unique}${f.ext}`;
  // return the url
  return config.image.url(filename);
}
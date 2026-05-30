const readEvent = require("server/api/readEvent");
const config = require("server/core/config");
const db = require("server/core/db");
const { updateEventData, updateImageData } = require("server/core/reconcile");
const { TextError } = require("server/support/errors");
const { uploader } = require("server/support/uploader");
const dt = require("server/util/dateTime");

module.exports = updateExistingEvent;

// the exported request handler
// after validating the incoming id and secret,
// updates the event and scheduling data, then
// promises an object with { id, image, published: true }
async function updateExistingEvent(req) {
  const id = parseInt(req.params.seriesId);
  const input = readEvent(req, {allowImages: true});
  // we expect the outer id, and the inner id to match
  if (id !== input.id || !input.secret) {
    throw new TextError("Malformed request");
  }
  // update all the data; throws if it can't
  // ( including on mismatched secret )
  // in which case nothing gets saved.
  const tgt = await db.query.transaction(tx => {
    const { id, secret, event, schedule } = input;
    return updateEventData(tx, id, secret, event, schedule);
  });
  // doing this outside of the transaction
  // TBD: might consider catching problems and notifying the user
  // without a full error. ex. their data is saved; just not the image.
  const newImage = await saveImageToDisk(tgt.seriesId, req.file);
  if (newImage) {
    // todo: a way of clearing the image?
    await updateImageData(db.query, tgt.seriesId, newImage);
  }
  // if we got here... all must be well.
  return {
    id: tgt.seriesId.toString(),
    image: newImage && config.image.url(newImage.filename),
    published: true, // saving implicitly publishes; returns true for backcompat.
  };
}

// save the uploaded file (if any)
// promise the name, extension, and unique filename
// ex. { name: "123", ext: ".png", filename: "123-5.png" }
// ( errors are handled inside uploader.js )
async function saveImageToDisk(seriesId, fileData) {
  if (!fileData) {
    return false;
  }
  // the image gets written to disk as "id.ext"
  const f = await uploader.write(fileData, seriesId.toString());
  // extract just the name and .ext data.
  const { name, ext } = f;
  // we use the image sequence number to disrupt the browser's cache
  // but here, the client just needs to know something changed.
  // we stamp the image with the time b/c its guaranteed to be unique.
  // when the user next asks for the event, it'll return real, the updated sequence id.
  // [ doing this saves us from having to query the results of the update here ]
  const unique = dt.icalFormat(dt.getNow());
  const filename = `${name}-${unique}${ext}`;
  return {
    name,
    ext,
    filename,
  };
}

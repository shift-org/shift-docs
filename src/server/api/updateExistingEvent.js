const { TextError } = require("server/support/errors");
const { readEvent, handleEventError } = require("server/support/events");

module.exports = updateExistingEvent;

function updateExistingEvent(req) {
  const { tgt, vals } = readEvent(req, {allowImages: true});
  if (tgt.id || tgt.seriesId) {
    throw new TextError("Malformed request");
  }
  return handleUpdate(tgt, req.file, vals).catch(onEventError);
}

// promises an object with { id, image, published: true }
async function handleUpdate(src, fileData, vals) {
  // update all the data; throws if it can't.
  // ( in which case nothing gets saved. )
  const tgt = await db.query.transaction(tx => {
    const { seriesId, password } = src;
    const { event, days } = vals;
    return Reconcile.updateEvent(tx, seriesId, password, event, days);
  });
  // doing this outside of the transaction
  // TBD: might consider catching problems and notifying the user
  // without a full error. ex. their data is saved; just not the image.
  const newImage = await saveImageToDisk(tgt.seriesId, fileData);
  if (newImage) {
    // todo: a way of clearing the image?
    await Reconcile.updateImage(db.query, tgt.seriesId, newImage);
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

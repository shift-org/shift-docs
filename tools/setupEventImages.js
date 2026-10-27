//
// Ensures the image directory needed for node development exists,
// and that it contains the `bike.jpg` used by the `make-fake-events` tool.
// This tool is run automatically by `npm dev` ( as part of its `predev` cycle. )
//
const path = require("path");
const fs = require('fs').promises;
const config = require("shift-docs/config");
const images = require('shift-docs/images');

async function setupEventImages(dstDir) {
  console.log("initializing event images...");
  await fs.mkdir(dstDir)
    .then(_ => console.log(`ok: created "${dstDir}"`))
    .catch(e => {
      if (e.code === 'EEXIST') {
        console.log(`ok: "${dstDir}" already exists.`);
      } else {
        console.error(`ng: couldn't create "${dstDir}"`, e.message);
      }
    });

  // now, copy the files and log success
  const src = images.bike.jpg;
  const dst = path.join(config.image.dir, "bike.jpg");
  await fs.copyFile(src, dst, fs.constants.COPYFILE_EXCL).then(_ => {
    console.log(`ok: copied "${src}" to "${dst}"`);
  }).catch(e => {
    if (e.code === 'EEXIST') {
      console.log(`ok: "${dst}" already exists.`);
    } else {
      console.error(`ng: couldn't copy "${src}" to "${dst}"`, e.message);
    }
  });

  process.exit(); // done.
}
setupEventImages(config.image.dir);

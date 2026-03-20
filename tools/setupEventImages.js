// run by npm predev ( automatically as part of running dev )
// ensures the event images directory exists
// and that it has the `bike.jpg` used by fake events.
const path = require("path");
const fs = require('fs').promises;
const config = require("shift-docs/config");

const dstDir = config.image.dir;
const srcDir = path.resolve(config.appPath, 'eventimages');
const imageFile = "bike.jpg"; // lives in the repo

async function setupEventImages() {
  console.log("initializing event images...");
  if (srcDir !== dstDir) {
    const src= path.join(srcDir, imageFile);
    const dst= path.join(dstDir, imageFile);
    // ignore failures to create the dir
    await fs.mkdir(dstDir).catch(e => null);
    // copy and log.
    await fs.copyFile(src, dst, fs.constants.COPYFILE_EXCL).then(_ => {
      console.log(`ok: copied "${src}" to "${dst}"`);
    }).catch(e => {
      if (e.code === 'EEXIST') {
         console.log(`ok: "${dst}" already exists.`);
      } else {
        console.error(`ng: couldn't copy "${src}" to "${dst}"`, e.message);
      }
    });
  }
  process.exit(); // done.
}
setupEventImages();

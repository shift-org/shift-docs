// run by npm post-install
const path = require("path");
const fs = require('fs').promises;
const config = require("../config");

async function setupEventImages() {
  console.log("initializing event images...");
  const imageFile = "bike.jpg";
  const src= path.resolve(config.appPath, 'eventimages', imageFile);
  const dst= path.resolve(config.image.dir, imageFile);
  if (src !== dst) {
    // ignore failures to create the dir
    await fs.mkdir(config.image.dir).catch(e => null);
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
async function runPostInstall() {
  await setupEventImages();
}
runPostInstall();

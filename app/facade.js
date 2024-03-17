// for development, allow the backend to serve the frontend.
const express = require('express');
const path = require('path');
const app = express();

// for these, javascript on the static page parses the url and sends backend requests.
// ngnix does this remapping when running docker locally;
// in production, its handled by netlify.
function splat(app, url, filePath) {
  app.get(url, function (req, res, next) {
    const parts = JSON.stringify(req.params);
    console.debug(`remapping ${url} with ${parts}`);
    res.sendFile(filePath);
  });
}

// fix? might be cool to make this express "middleware"
module.exports = function(app, config) {
  const staticFiles = path.resolve(config.appPath, config.site.staticFiles);
  console.log("serving static files from", staticFiles);
  app.use(express.static(staticFiles));

  // ex. http://localhost:3080/addevent/edit-1-d00c888b0a1d4bab8107ba2fbe2beddf
  splat(app,"/addevent/edit-:id-:secret",
    path.join(staticFiles, 'addevent', 'index.html'));

  // ex. http://localhost:3080/calendar/event-201
  splat(app,"/calendar/event-:id",
    path.join(staticFiles, 'calendar', 'index.html'));

  // in production, "eventimages/*" gets redirected by netlify to the backend,
  // then remapped and served by ngnix.
  // ex. http://localhost:3080/eventimages/9248-124.png
  const imageHandler = function (req, res, next) {
    const { id, rev, ext } = req.params;
    console.debug("got event image request:", id, rev || "xxx", ext );
    // ignores rev: that's for cache busting; the image is just id and extension.
    const imageFiles = path.resolve(config.appPath, config.image.dir);
    const imageFile = path.join(imageFiles, id+"."+ext)
    res.sendFile(imageFile);
  };
  app.get("/eventimages/:id-:rev.:ext", imageHandler);
  app.get("/eventimages/:id.:ext", imageHandler);
};

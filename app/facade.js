// for development, allow the backend to serve the frontend.
// ex. npm run -w tools preview
const express = require('express');
const path = require('path');

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
const facade = {
  // uses config for the source of the static files
  // you can use "hugo --watch" to rebuild changes on demand.
  serveFrontEnd(app, config) {
    if (!config.site.staticFiles) {
      throw new Error("missing static files path");
    }
    const staticFiles = path.resolve(config.appPath, config.site.staticFiles);
    console.log("serving static files from", staticFiles);
    app.use(express.static(staticFiles));

    // ex. http://localhost:3080/addevent/edit-1-d00c888b0a1d4bab8107ba2fbe2beddf
    splat(app,"/addevent/edit-:id-:secret",
      path.posix.join(staticFiles, 'addevent', 'index.html'));

    // ex. http://localhost:3080/calendar/event-201
    splat(app,"/calendar/event-:id",
      path.posix.join(staticFiles, 'calendar/event', 'index.html'));
  },

  // uses config for the image directory
  // in production, "eventimages/*" gets redirected by netlify to the backend,
  // then remapped and served by ngnix.
  // ex. http://localhost:3080/eventimages/9248-124.png
  serveImages(app, config) {
    const imageHandler = function (req, res, next) {
      const { id, rev, ext } = req.params;
      console.debug("got event image request:", id, rev || "xxx", ext );
      // ignores rev: that's for cache busting; the image is just id and extension.
      // these are local files, so it uses regular path functions
      const imageFiles = path.resolve(config.appPath, config.image.dir);
      const imageFile = path.join(imageFiles, id+"."+ext)
      res.sendFile(imageFile);
    };
    app.get("/eventimages/:id-:rev.:ext", imageHandler);
    app.get("/eventimages/:id.:ext", imageHandler);
  },

  makeFacade(app, config) {
    facade.serveFrontEnd(app,config);
    facade.serveImages(app,config);
  }
};

module.exports = facade;

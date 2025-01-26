// for development, allow the backend to serve the frontend.
// ex. npm run -w tools preview
const express = require('express');
const path = require('path');

// fix? might be cool to make this express "middleware"
const facade = {
  // uses config for the source of the static files
  // you can use "hugo --watch" to rebuild changes on demand.
  serveFrontEnd(app, config) {
    if (!config.site.staticFiles) {
      throw new Error("missing static files path");
    }
    console.log("serving static files from", staticFiles);
    app.use(express.static(staticFiles));

    // remap any path under a url to a specific html pages. 
    // in production, this is done by netlify.
    // running locally with docker, this is done by nginx.
    // this handles local node development via "npm run dev"
    config.site.devEndpoints.forEach(item => {
      const { item, filePath } = item;
      // when someone gets the url
      app.get(url, function (req, res, next) {
        // log url parts for debugging
        const parts = JSON.stringify(req.params);
        console.debug(`remapping ${url} with ${parts}`);
        // and always return the specified file
        res.sendFile(filePath);
      });
    });
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

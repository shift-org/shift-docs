// for development, allow the backend to serve the frontend.
// ex. npm run -w tools preview
const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

// fix? might be cool to make this express "middleware"
const facade = {
  // uses config for the source of the static files
  // you can use "hugo --watch" to rebuild changes on demand.
  serveWebContent(app, config) {
    const { staticFiles } = config.site;
    if (!staticFiles) {
      throw new Error("missing static files path");
    }
    console.log("serving static files from", staticFiles);
    app.use(express.static(staticFiles));

    // remap any path under a url to a specific html pages. 
    // in production, this is done by netlify.
    // running locally with docker, this is done by nginx.
    // this handles local node development via "npm run dev"
    config.site.devEndpoints.forEach(item => {
      const { url, filePath } = item;
      // when someone gets the url
      app.get(url, function (req, res, next) {
        // log url parts for debugging
        const parts = JSON.stringify(req.params);
        console.debug(`remapping ${url} with ${parts} to ${filePath}`);
        // and always return the specified file
        res.sendFile(filePath);
      });
    });
  },

  // in production, netlify uses vite to build the frontend app
  // into a single set of files embedded into events/index.html
  // in development, vite runs a server to watch for source code changes
  // our webpage can only talk to one server, so we make it talk to node
  // and have node -- here -- send "events" requests to vite.
  serveVite(app, config) {
    const events = createProxyMiddleware({
      logger: console,
      target: 'http://localhost:5173/events/',
      changeOrigin: true,
      ws: true 
    });
    app.use('/events', events);
    // 
    const etc = createProxyMiddleware({
      logger: console,
      target: 'http://localhost:5173/',
      pathFilter: [
        '/@*/**', // ex. @vite/client
        '/src/**', 
        '/node_modules/**',
        // the proxy code uses micromatch, https://www.npmjs.com/package/micromatch and it doesn't allow star (*) to match dot (.) 
        '/node_modules/.*/**',
       ],
      changeOrigin: true,
      ws: true 
    });
    app.use('/', etc);
    // 
    const social = createProxyMiddleware({
      logger: console,
      target: "https://pdx.social/@shift2bikes.rss",
      changeOrigin: true,
      ws: true 
    });
    app.use('/socialapi', social);
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
    // serve vite first so its events path will override any events folder in dist
    // ( ex. if previously built with npm run build )
    facade.serveVite(app, config);
    facade.serveWebContent(app, config);
    facade.serveImages(app, config);
  }
};

module.exports = facade;

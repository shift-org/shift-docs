const express = require('express');
const config = require("./config");
const errors = require("./util/errors");
const nunjucks = require("./nunjucks");
const knex = require("./knex");
const path = require('path');
const app = express();

// shift.conf for nginx sets the x-forward header
// and this says express can use it
app.set('trust proxy', true);

// allows ex. res.render('crawl.html');
nunjucks.express(app);

// modify every request
app.use(function (req, res, next) {
  // add these two error shortcuts:
  res.textError = (msg) => errors.textError(res, msg);
  res.fieldError = (fields, msg) => errors.fieldError(res, fields, msg);
  // tbd: the php sets this for every end point.
  // maybe unneeded with the trust_proxy call above?
  res.set('Access-Control-Allow-Origin', "*");
  next()
});

// for development, allow the backend to serve the frontend.
// you can use "hugo --watch" to rebuild changes on demand.
if (config.site.staticFiles) {
  const staticFiles = path.resolve(__dirname, config.site.staticFiles);
  console.log("serving static files from", staticFiles);
  app.use(express.static(staticFiles));

  // this is normally handled by ngnix
  app.get(/\/addevent\/.*/, function (req, res, next) {
    console.log("remapping", req.url);
    const addEventPage = path.join(staticFiles, 'addevent', 'index.html')
    res.sendFile(addEventPage);
  });
}

// handle application/x-www-form-urlencoded and application/json posts
// ( multipart posts are handled by their individual endpoints )
app.use(express.urlencoded({extended:false}), express.json());

// each of these is a javascript file
// containing a get ( or post ) export.
const endpoints = [
  "crawl",
  "delete_event",
  "events",
  "ical",
  "manage_event",
  "retrieve_event"
];

// host each of those endpoint files at a php-like url:
// note: require() is synchronous.
endpoints.forEach((ep) => {
  const apipath = `/api/${ep}.php`;
  const endpoint = require(`./endpoints/${ep}.js`);
  if (endpoint.get) {
    app.get(apipath, endpoint.get);
  }
  if (endpoint.post) {
    if (Array.isArray(endpoint.post)) {
      app.post(apipath, ...endpoint.post);
    } else {
      app.post(apipath, endpoint.post);
    }
  }
});

app.use(function(err, req, res, next) {
  res.sendStatus(500);
  console.error(err.stack);
});

const port = config.site.listen;
knex.initialize().then(_ => {
  app.listen(port, _ => {
    console.log(`${config.site.name} listening on port ${port}`)
    app.emit("ready"); // raise a signal for testing.
  });
});

// for testing
module.exports = app;

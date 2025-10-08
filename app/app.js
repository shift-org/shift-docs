const express = require('express');
const config = require("./config");
const errors = require("./util/errors");
const nunjucks = require("./nunjucks");
const { initMail } = require("./emailer");
const knex = require("./knex");  // initialize on startup
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
  const { makeFacade } = require('./facade');
  makeFacade(app, config);
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
  "retrieve_event",
  "search",
  "ride_count"
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
  console.error(err.stack);
  res.sendStatus(500);
});

const verifyMail = initMail().then(hostName=> {
  console.log("okay: verified email host", hostName);
}).catch(e=> {
  console.error("failed smtp verification:", e.toString());
}).finally(_ => {
  console.log("and emails will log to", config.email.logfile || "console");
});
Promise.all([knex.initialize(), verifyMail]).then(_ => {
  const port = config.site.listen;
  app.listen(port, _ => {
    // NOTE: the ./shift script listens for this message!
    console.log(`${config.site.name} listening at ${config.site.url()}`)
    app.emit("ready"); // raise a signal for testing.
  });
});

// for testing
module.exports = app;

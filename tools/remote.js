// npm -w tools remote
// goals:
// 1. act as a front end server for all hugo files
// 2. proxy all api paths to the production backend
//
const express = require('express');
const config = require("shift-docs/config");
const { serveFrontEnd } = require("shift-docs/facade");
const app = express();
// https://github.com/villadora/express-http-proxy
// alt: https://github.com/chimurai/http-proxy-middleware
const proxy = require('express-http-proxy');

// handle application/x-www-form-urlencoded and application/json posts
// ( multipart posts are handled by their individual endpoints )
app.use(express.urlencoded({extended:false}), express.json());

if (!config.site.staticFiles) {
	throw new Error("SHIFT_STATIC_FILES not set");
}

serveFrontEnd(app, config);

app.use('/api', proxy('api.shift2bikes.org/api'));
app.use('/eventimages', proxy('api.shift2bikes.org/eventimages'));

const port = config.site.listen;
app.listen(port, _ => {
	console.log(`${config.site.name} listening on port ${port}`)
	app.emit("ready"); // raise a signal for testing.
});
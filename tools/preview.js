// use local content with the production backend.
// npm -w tools run preview
// goals:
// 1. act as a front end server for all hugo files
// 2. proxy all api paths to the production backend
//
const express = require('express');
const config = require("shift-docs/config");
const { serveFrontEnd } = require("shift-docs/facade");
const app = express();
const {createProxyMiddleware} = require('http-proxy-middleware');


serveFrontEnd(app, config);
// https://www.shift2bikes.org/eventimages/11228-2.jpg
// https://api.shift2bikes.org/eventimages/11228-2.jpg

// https://github.com/chimurai/http-proxy-middleware
app.use(createProxyMiddleware({
    target: 'https://api.shift2bikes.org',
    changeOrigin: true,
    pathFilter: ['/api','/eventimages/'],
  }));

const port = config.site.listen;
app.listen(port, _ => {
	console.log(`${config.site.name} listening at ${config.site.url()}`)
	app.emit("ready"); // raise a signal for testing.
});

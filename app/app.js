/**
 * The main entry point for the node container
 */
import config from './config.js';
import { initMail } from './emailer.js';
import app from './appSetup.js';
import db from './knex.js';  // initialize on startup

// connect to the db
await db.initialize();

// connect to the smtp server
await initMail().then(hostName => {
  console.log("okay: verified email host", hostName);
}).catch(e => {
  console.error("failed smtp verification because", e.toString());
}).finally(_ => {
  console.log("and emails will log to", config.email.logfile || "console");
});

// start a webserver to listen to all requests
const port = config.site.listen;
app.listen(port, _ => {
  // NOTE: the ./shift script listens for this message!
  console.log("=======================================");
  console.group();
  console.info(`${config.site.name} listening.`);
  console.info(`Browse to \x1b[36m${config.site.url()}\x1b[0m to see the site.`)
  console.groupEnd();
  console.log("=======================================");
  app.emit("ready"); // raise a signal for testing? todo: document what this does.
});

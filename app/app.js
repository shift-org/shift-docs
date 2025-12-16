/**
 * The main entry point for the node container
 */
const config = require('./config');
const { initMail } = require( './emailer');
const app = require( './appSetup');
const db = require('./db');  // initialize on startup
const tables = require("./models/tables");

// connect to the db
db.initialize().then(async () => {
  // create db tables
  await tables.createTables();

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
    app.emit("ready"); // raise a signal for testing? todo: document what this does.
    // use a timeout to appear after the vite message;
    // reduces confusion about which port to browse to.
    setTimeout(() => {
      // NOTE: the ./shift script listens for this message!
      console.log("\n=======================================");
      console.group();
      console.info(`${config.site.name} listening.`);
      console.info(`Browse to \x1b[36m${config.site.url()}\x1b[0m to see the site.`)
      console.groupEnd();
      console.log("=======================================");
    }, 1000);
  });
});
const nodemailer = require('nodemailer');
const fsp = require('fs').promises;
const path = require('node:path');
const config = require("./config");
const dt = require("./util/dateTime");

// magically, config.smtp matches what nodemailer needs;
// i wonder how that happened....
// note: it uses a fake json if a proper SMTP_HOST variable isnt set.
const transporter = nodemailer.createTransport(config.smtp || { jsonTransport: true });

module.exports = {
  // promise the hostname after trying to verify the smtp configuration;
  // or reject if smtp isnt in use
  initMail() {
    return !config.smtp ? // annoyingly, verify returns a promise for smtp and a boolean otherwise
          Promise.reject("smtp not configured.") :
          transporter.verify().then(_ => config.smtp.host || "???");
  },
  // returns a promise after sending the email and logging the trailing arguments
  // see https://nodemailer.com/message/
  sendMail(email, ...logArgs) {
    return transporter.sendMail(email).then(info => {
      const date = dt.getNow().toString();
      const logMessage = `Sent email ${date}:\n` + JSON.stringify(logArgs, null, " ");
      console.log(logMessage);
      return Promise.resolve(true); // don't log to the file for now; conflicts with php/node paths
      // tbd: would it be better to log to console only, and configure docker with "local"
      // it does compression, and auto rotation.
      // https://docs.docker.com/config/containers/logging/configure/
      // const logFile = config.email.logfile;
      // return !logFile ? Promise.resolve(true) :
      //        fsp.writeFile(config.email.logfile, logMessage+"\n", {flag: 'a'});
    });
  }
};

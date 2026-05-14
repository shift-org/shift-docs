const nodemailer = require('nodemailer');
const fsp = require('fs').promises;
const path = require('node:path');
const config = require('server/core/config');
const dt = require('server/util/dateTime');

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
  // returns a empty promise after sending the email.
  sendMail(email) {
    // info contains extended info about the sent email.
    // not much we can do with that info, so this eats it.
    // https://nodemailer.com/#response-object
    return transporter.sendMail(email).then(info => {
      return Promise.resolve(true);
    });
  }
};

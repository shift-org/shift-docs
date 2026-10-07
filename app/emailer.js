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
  // returns an empty promise after sending the email.
  // see https://nodemailer.com/message/
  sendMail(email) {
    return transporter.sendMail(email).then(_ => {
      return Promise.resolve(true);
    });
  },

  // returns true if the passed email address was on the block list.
  isDeadLetter(address) {
    const parts = (process.env.DEAD_LETTERS || "").split(";").filter(Boolean);
    return parts.some(p => address.endsWith(p));
  }
};

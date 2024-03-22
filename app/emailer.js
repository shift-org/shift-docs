const nodemailer = require('nodemailer');
const fsp = require('fs').promises;
const path = require('node:path');
const config = require("./config");
const dt = require("./util/dateTime");

// magically, config.smtp matches what nodemailer needs;
// i wonder how that happened....
// note: it uses a fake json if a proper SMTP_HOST variable isnt set.
const transporter = nodemailer.createTransport(config.smtp);

module.exports = {
  // returns a promise after sending the email and logging it.
  // see https://nodemailer.com/message/
  sendMail(email) {
    return transporter.sendMail(email).then(info => {
      const date = dt.getNow().toString();
      let content = `Sending email ${date}:\n`;
      // for debugging anything that might come up, log the whole returned data.
      // the jsonTransport (testCfg) includes the sent email,
      // the smsmtpCfg does not.
      if (info.message) {
        const prettify = JSON.parse( info.message.toString() );
        content += JSON.stringify(prettify, null, " ");
      } else {
        content += JSON.stringify({
          info, email
        }, null, " ");
      }
      return fsp.writeFile(config.email.logfile, content+"\n", {flag: 'a'});
    });
  }
};

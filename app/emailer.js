const nodemailer = require('nodemailer');
const fsp = require('fs').promises;
const path = require('node:path');
const config = require("./config");
const dt = require("./util/dateTime");

// https://nodemailer.com/transports/stream/
const testCfg =  {
  jsonTransport: true
};

// https://nodemailer.com/smtp/
const smtpCfg = {
  host: config.smtp.host,
  port: 465,
  secure: true, // use TLS
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
};

const transporter = nodemailer.createTransport(
  config.smtp.host ? smtpCfg : testCfg);

module.exports = {
  // returns a promise after sending the email and logging it.
  // see https://nodemailer.com/message/
  sendMail(email) {
    return transporter.sendMail(email).then(info => {
      const date = dt.getNow().toString();
      let content = `Sending email ${date}:\n`;
      // for debugging anything that might come up, log the whole returned data
      // the test cfg includes the sent email, the smtp does not.
      if (info.message) {
        const prettify = JSON.parse( info.message.toString() );
        content += JSON.stringify(prettify, null, " ");
      } else {
        content += JSON.stringify({
          info, email
        }, null, " ");
      }
      return fsp.writeFile(config.smtp.logfile, content+"\n", {flag: 'a'});
    });
  }
};

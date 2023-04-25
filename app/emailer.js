const nodemailer = require('nodemailer');
const config = require("./config");
const path = require('node:path');

const sendmail = path.join(path.dirname(config.site.email_log), "sendmail.sh");

const testMail =  {
  jsonTransport: true,
  newline: 'windows'
};
const sendMail = {
  sendmail: true,
  // uses "windows" newlines because the php version had carriage return style newlines.
  newline: 'windows',
  // docker-compose mounts "opt/node" to the "services/node "directory.
  // the sendmail script logs to $SHIFT_EMAIL_LOG and, on production, invokes actual "sendmail"
  path: sendmail,
};

module.exports = nodemailer.createTransport(
  (process.env.npm_lifecycle_event !== 'test') ?
  sendMail : testMail);

const nodemailer = require('nodemailer');
const config = require("./config");

const testMail =  {
  jsonTransport: true,
  newline: 'windows'
};
const sendMail = {
  sendail: true,
  // uses "windows" newlines because the php version had carriage return style newlines.
  newline: 'windows',
  // docker-compose mounts "opt/node" to the "services/node "directory.
  // the sendmail script logs to $SHIFT_EMAIL_LOG and, on production, invokes actual "sendmail"
  path: "/opt/node/sendmail.sh",
};

module.exports = nodemailer.createTransport(
  (process.env.npm_lifecycle_event !== 'test') ?
  sendMail : testMail);

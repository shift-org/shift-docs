const nodemailer = require('nodemailer');
const config = require("./config");
const path = require('node:path');
const AWS = require("aws-sdk");

// minimal configuration if its not finding its credentials
// AWS.config.update({ region: process.env.AWS_REGION_ID });

//
// configure AWS SDK
// AWS.config.update({
//   accessKeyId: << SES_ACCESS_KEY >>,
//   secretAccessKey: << SES_SECRET_KEY >>,
//   region: << SES_REGION >>,
// });

const testMail =  {
  jsonTransport: true,
  newline: 'windows'
};

// on docker, this fails with epipe.
// const sendMail = {
//   sendmail: true,
//   // uses "windows" newlines because the php version had carriage return style newlines.
//   newline: 'windows',
//   // docker-compose mounts "opt/node" to the "services/node "directory.
//   // the sendmail script logs to $SHIFT_EMAIL_LOG and, on production, invokes actual "sendmail"
//   path: path.join(path.dirname(config.site.email_log), "sendmail.sh"),
// };

const sendMail = nodemailer.createTransport({
  SES: new AWS.SES(),
});

module.exports = nodemailer.createTransport(
  (process.env.npm_lifecycle_event !== 'test') ?
  sendMail : testMail);

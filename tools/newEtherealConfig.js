// generate a special config file that can be for email credentials.
// ex. npm run -w tools new-ethereal-cfg
// will create ./bin/shift-email.cfg
// after creating events, you can check messages here: https://ethereal.email/messages
const path = require("path");
const fs = require('fs');
const config = require("shift-docs/config");
const nodemailer = require('nodemailer');

async function newEtherealConfig()  {
  const key = 'SHIFT_EMAIL_CFG';
  const fileName = process.env[key];
  if (!fileName) {
    throw new Error(`${key} not set`);
  }
  const outFile = path.resolve(config.appPath, fileName);
  nodemailer.createTestAccount((err, account) => {
      const data = {
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: account.user, // generated ethereal user
            pass: account.pass  // generated ethereal password
        }
      }
      fs.writeFileSync(outFile, JSON.stringify(data, null, " "));
      process.exit(); // done.
  });
}
newEtherealConfig();

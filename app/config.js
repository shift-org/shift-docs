const path = require('path');
const fs = require("fs");

function env_default(field, def) {
  return process.env[field] ?? def;
}

// node server listen for its http requests
// fix? there is no such environment variable right now.
const listen = env_default('NODE_PORT', 3080);

// the user facing server.
const siteHost = siteUrl(listen);

// location of app.js ( same as config.cs )
const appPath =  path.resolve(__dirname);

// for max file size
const bytesPerMeg = 1024*1024;

const config = {
  appPath,
  api: {
    header: 'Api-Version',
    version: "3.53.0",
  },
  db: {
    host: env_default('MYSQL_HOST', 'db'),
    port: 3306, // standard mysql port.
    user: env_default('MYSQL_USER', 'shift'),
    pass: env_default('MYSQL_PASSWORD', 'ok124'),
    name: env_default('MYSQL_DATABASE', 'shift'),
    type: "mysql2", // name of driver, installed by npm
  },
  // a nodemailer friendly config, or false if smtp is not configured.
  smtp: getSmtpSettings(),
  site: {
    name: "SHIFT to Bikes",
    listen,
    path: "/",
    // used for crawl url, shareable links, and the manage url sent in email
    url(...parts) {
     const base = `${siteHost}${config.site.path}`;
     return base + parts.join("/");
    },
    helpPage() {
      return config.site.url("pages/calendar-faq/");
    },
    staticFiles: env_default('SHIFT_STATIC_FILES'),
  },
  // various useful email addresses
  // ( for sendConfirmationEmail() )
  // https://nodemailer.com/message/addresses/
  email: {
    sender: {
      name: 'SHIFT to Bikes',
      address: 'bikefun@shift2bikes.org'
    },
    // the confirmation emailer sets this as the reply-to
    support: "bikecal@shift2bikes.org",
    // the confirmation emailer blind copies this address
    moderator: "shift-event-email-archives@googlegroups.com",
    logfile: function() {
      const logfile = env_default('SHIFT_EMAIL_LOG');
      return logfile ? path.resolve(appPath, logfile) : false;
    }()
  },
  image: {
    // storage location for event images
    dir: path.resolve(appPath,
        env_default('SHIFT_IMAGE_DIR', "eventimages")),
    // used for generated event image links
    // ( see also the ngnix config )
    path: env_default('SHIFT_IMAGE_PATH', "/eventimages/"),
    // used for event image links.
    // for backwards compatibility:
    // 1. if you pass a falsey value, this returns null.
    // 2. php used host relative image links so this does too.
    // ex. not "https://shift2bikes.org/eventimages/9248-2.png"
    // but "/eventimages/9248-2.png"
    url(name) {
      return !name ? null : path.posix.join(config.image.path, name);
    },
    // see also: shift.conf (ngnix configuration)
    // we set this *larger* than ngnix so to accept everything it gives us.
    // ( while still having a fail-safe if something unexpected occurs. )
    maxFileSize: 5.5 * bytesPerMeg,
    // mime type to a desired image extension.
    // we assign the extension based on the content.
    imageTypes:{
      'image/gif'  : '.gif',
      'image/jpeg' : '.jpg',
      'image/pjpeg': '.jpg',
      'image/png'  : '.png',
    },
  },
  crawl: {
    image: 'https://www.shift2bikes.org/images/shiftLogo_plain.gif',
    title: 'Shift/Pedalpalooza Calendar',
    description: `Find fun bike events and make new friends!` +
      `Shift helps groups and individuals to promote their "bike fun" events.`,
  },
  cal: {
    name: 'Shift Bike Calendar',
    desc: 'Find fun bike events and make new friends!',
    guid: 'shift@shift2bikes.org',
    prod: '-//shift2bikes.org//NONSGML shiftcal v2.1//EN',
    filename: 'shift-calendar',
    ext: '.ics',
    maxage: 60*60*3, // 3 hours
  }
};
module.exports = config;

// determine the user facing prefix for generating page and image links.
// production         - https://shift2bikes.org
// docker dev         - https://localhost:4443
// standalone or test - http://localhost:3080
function siteUrl(proxyPort) {
  const hostname = env_default('SHIFT_DOMAIN', 'localhost');
  // production uses 443, docker dev uses 4443, standalone is null.
  const serverPort = env_default('NGINX_HTTPS_PORT', null);
  const protocol = serverPort ? "https://" : "http://";
  const portstr  = (serverPort === '443') ? '' : ':' + (serverPort ?? proxyPort);
  return protocol + hostname + portstr;
}

// returns a nodemailer friendly config, or false if smtp is not configured.
function getSmtpSettings() {
  // hack to read email configuration from a file;
  // tools/newEtherealConfig.js can generated it.
  const emailCfg = env_default('SHIFT_EMAIL_CFG');
  if (emailCfg) {
    try {
      const raw= fs.readFileSync(emailCfg, "utf8");
      return JSON.parse(raw);
    } catch (err) {
      // its okay if there is no such file...
      if (err.code !== 'ENOENT') {
        throw(err);
      }
    }
  }
  // assumes that if SMTP_HOST is set, the rest is okay.
  const host = env_default('SMTP_HOST');
  if (!host) {
    return false;
  } else {
    // assumes that if SMTP_HOST is set, the rest is okay;
    // ( and returns a nodemailer config: https://nodemailer.com/smtp/ )
    return {
      host: host,
      port:  587,
      // secure should be true for 465;
      // false for everything else; and everyone seems to want 587.
      secure: false,
      auth: {
        user: env_default('SMTP_USER'),
        pass: env_default('SMTP_PASS'),
      }
    };
  }
}

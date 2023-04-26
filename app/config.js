const path = require('node:path');

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

const config = {
  db: {
    host: env_default('MYSQL_HOST', 'db'),
    port: 3306, // standard mysql port.
    user: env_default('MYSQL_USER', 'shift'),
    pass: env_default('MYSQL_PASSWORD', 'ok124'),
    name: env_default('MYSQL_DATABASE', 'shift'),
    type: "mysql2", // name of driver, installed by npm
  },
  smtp: {
    host: env_default('SMTP_HOST'),
    user: env_default('SMTP_USER'),
    pass: env_default('SMTP_PASS'),
    logfile: env_default('SHIFT_EMAIL_LOG',
       path.join(appPath, "../services/node/shift-mail.log")),
  },
  site: {
    name: "SHIFT to Bikes",
    listen,
    path: "/",
    // used for crawl url, shareable links, and the manage url sent in email
    url(...parts) {
     const base = `${siteHost}${config.site.path}`;
     return base + parts.join("/");
    }
  },
  image: {
    // storage location for images:
    // testing for SHIFT_DOMAIN here is a simple way to check for docker.
    dir: env_default('SHIFT_DOMAIN') ?
       "/opt/backend/eventimages" :
       path.join(appPath, "eventimages"),
    // image link directory
    path: "/eventimages/",
    // used for event image links
    // ex. https://shift2bikes.org/eventimages/9248.png
    url(name) {
      const base = `${siteHost}${config.image.path}`;
      return !name ? null : base + name;
    }
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

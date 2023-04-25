const path = require('node:path');

function env_default(field, def) {
  return process.env[field] ?? def;
}

// node server listen for its http requests
// fix: there is no such environment variable set right now.
const listen = env_default('NODE_PORT', 3080);

// external path configuration:
// docker dev uses 4443, production uses 443
// 443 is the default https port
const https = env_default('NGINX_HTTPS_PORT', null);

// ex. "https://shift2bikes.org", "https://localhost:4443",or "http://localhost:3080".
const protocol = (https ? "https://" : "http://");
const hostname = env_default('SHIFT_DOMAIN', 'localhost');
const portstr  = (https === '443') ? '' : ':' + (https ?? listen);
const host = protocol + hostname + portstr;

const email_log = env_default( 'SHIFT_EMAIL_LOG', "/opt/node/shift-mail.log" );

const config = {
  db: {
    host: env_default('MYSQL_HOST', 'db'),
    port: 3306, // standard mysql port.
    user: env_default('MYSQL_USER', 'shift'),
    pass: env_default('MYSQL_PASSWORD', 'ok124'),
    name: env_default('MYSQL_DATABASE', 'shift'),
    type: "mysql2", // name of driver, installed by npm
  },
  site: {
    name: "SHIFT to Bikes",
    listen,
    path: "/",
    // used for crawl url, shareable links, and the manage url sent in email
    url(...parts) {
     const base = `${host}${config.site.path}`;
     return base + parts.join("/");
    },
    email_log,
  },
  image: {
    // disk directory
    // entrypoint.sh makes it exist, the docker compose exposes it.
    // if running locally ( ex. npm test ) assumes the project eventimages directory
    dir:  https ? "/opt/backend/eventimages" : path.join(__dirname , "eventimages"),
    // image link directory
    path: "/eventimages/",
    // used for event image links
    // ex. https://shift2bikes.org/eventimages/9248.png
    url(name) {
      const base = `${host}${config.image.path}`;
      return !name ? null : base + name;
    }
  },
  crawl: {
    image: 'https://www.shift2bikes.org/images/shiftLogo_plain.gif',
    title: 'Shift/Pedalpalooza Calendar',
    description: 'Find fun bike events and make new friends! Shift helps groups and individuals to promote their "bike fun" events.',
  },
  cal: {
    name : 'Shift Bike Calendar',
    desc : 'Find fun bike events and make new friends!',
    guid : 'shift@shift2bikes.org',
    prod : '-//shift2bikes.org//NONSGML shiftcal v2.1//EN',
    filename : 'shift-calendar',
    ext : '.ics',
    maxage : 60*60*3, // 3 hours
  }
};
module.exports = config;

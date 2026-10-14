/**
 * Global configuration for the backend.
 * Holds all environment, commandline options, paths, etc.
 */
const fs = require('node:fs');    // for reading email config
const os = require('node:os');    // for tmpdir fallbacks
const path = require('node:path');
const CommandLine = require('shift-docs/util/cmdLine');

// helper to read environment variables
function env_default(field, def) {
  return process.env[field] ?? def;
}

const cmdLine = new CommandLine({
  db_debug: [
    "Can be either 'true' or 'false'.",
    " Defaults to 'false'. When 'true', adds extra debugging info for queries.",
  ],
  db: [
    "Can be either 'sqlite' or 'mysql'.",
    "For prod and dev it defaults to 'mysql'.",
    "For tests, it defaults to 'sqlite'.",
    "- 'mysql': Requires docker.",
    "  For prod and dev it pulls its full configuration from the environment.",
    "  Tests have a hardcoded configuration.",
    "- 'sqlite': Uses a sqlite database.",
    "  This option can followed by the path to its file.",
    "  The default is equivalent to specifying: '-db=sqlite:./bin/events.db'.",
  ],
});

// determine the port for the node server.
const listen = (() => {
  return 3080;
})();

// the user facing server.
const siteHost = siteUrl(listen);

// via process:
//  env.INIT_CWD: where 'npm run' was invoked.
//  env.PWD: where 'node' was invoked, can change if the working dir changes.
//  env.npm_package_json: root package.json path, ignoring workspace.
const shiftRoot = process.env.INIT_CWD || process.env.PWD;

// for max file size
const bytesPerMeg = 1024*1024;

// ex. npm_lifecycle_event: 'dev-setup'
const isTesting = process.env.npm_lifecycle_event && process.env.npm_lifecycle_event.startsWith('test');

// optional directory containing front-end content.
// if it doesnt exist, assumes the app isn't trying to serve static files.
// ( and that there is a separate front-end running out there, ex. production. )
const staticFiles = (() => {
  const p = env_default('SHIFT_STATIC_FILES');
  return !p ? null : path.resolve(shiftRoot, p);
})();

// storage location for uploaded images.
// forces a temp directory when running unit tests.
const imageDestination = (() => {
  const p = env_default('SHIFT_IMAGE_DIR');
  if (isTesting) {
    return os.tmpdir();
  } else if (p) {
    return path.resolve(shiftRoot, p);
  }
})();

const dbConfig = getDatabaseConfig(cmdLine.options.db, cmdLine.bool('db_debug'), isTesting);

// The config object exported
const config = {
  api: {
    header: 'Api-Version',
    version: "3.64.0",
  },
  db: dbConfig,
  // maybe bad, but some code likes to know:
  isTesting,
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
    staticFiles,
    // expose frontend content for adding and viewing events.
    // in production: these endpoints are served via netfliy.
    // uses path.posix to get forward slashes even on windows
    // i forget exactly why...
    devEndpoints: !staticFiles ? null : [{
      // ex. http://localhost:3080/addevent/edit-1-d00c888b0a1d4bab8107ba2fbe2beddf
      // loads http://localhost:3080/addevent/index.html
      url: "/addevent/edit-:series-:secret",
      filePath: path.posix.resolve(staticFiles, 'addevent', 'index.html')
    }, {
      // ex. http://localhost:3080/calendar/event-201
      // loads http://localhost:3080/calendar/event/index.html
      url: "/calendar/event-:caldaily",
      filePath: path.posix.resolve(staticFiles, 'calendar/event', 'index.html')
    }, {
      // ex. http://localhost:3080/events/201
      // loads http://localhost:3080/events/index.html
      url: "/events/:series_id/:caldaily_id/:slug?",
      filePath: path.posix.resolve(staticFiles, 'events', 'index.html')
    },{
      url: "/socialapi",
      remoteUrl: "https://pdx.social/@shift2bikes.rss",
    }],
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
      return logfile ? path.resolve(shiftRoot, logfile) : false;
    }()
  },
  image: {
    // storage location for event images
    dir: imageDestination,
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
  cal: {
    pedalp: {
      name: 'Pedalpalooza Bike Calendar',
      desc: 'Find fun Pedalpalooza bike events!',
      guid: 'shift@shift2bikes.org',
      filename: 'pedalpalooza-calendar',
    },
    shift: {
      name: 'Shift Community Calendar',
      desc: 'Find fun bike events all year round.',
      guid: 'community@shift2bikes.org',
      filename: 'shift-calendar',
    },
    // shared properties:
    base: {
      ext: '.ics',
      maxage: 60*60*3, // 3 hours
      // the software that created the calendar
      prod: '-//shift2bikes.org//NONSGML shiftcal v2.1//EN',
    },
  },
};
module.exports = config;

// determine the user facing prefix for generating page and image links.
// production         - https://shift2bikes.org
// docker dev         - https://localhost:4443
// npm dev, npm test  - http://localhost:3080
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

// our semi-agnostic database configuration
function getDatabaseConfig(dbType, dbDebug, isTesting) {
  dbType = dbType || readDbEnv(isTesting ? 'sqlite' : null);

  const [name, parts] = dbType.split(':');
  const config = {
    mysql: !isTesting ? getMysqlDefault : getMysqlTesting,
    sqlite: getSqliteConfig,
  }
  if (!name in config) {
    throw new Error(`unknown database type '${dbType}'`)
  }
  return {
    type: name,
    connect: config[name](parts),
    debug: dbDebug,
  }
}

// nothing specified in the env fails
// sqlite specified in the env uses.... sqlite.
// anything other than sqlite in the env is assumed to be a mysql spec.
function readDbEnv(fallback, env = 'MYSQL_DATABASE') {
  const dbType = env_default(env) || fallback;
  if (!dbType) {
    throw new Error(`expected db type on command line or '${env}' env variable`);
  }
  return dbType.startsWith("sqlite") ? dbType : 'mysql';
}

// the default for mysql when running dev or production
function getMysqlDefault() {
  return {
    host: env_default('MYSQL_HOST', 'db'),
    port: env_default('MYSQL_PORT', 3306), // standard mysql port.
    user: env_default('MYSQL_USER', 'shift'),
    pass: env_default('MYSQL_PASSWORD', 'ok124'),
    name: env_default('MYSQL_DATABASE', 'shift'),
  }
}

// the default for mysql when running tests
function getMysqlTesting() {
  return {
    host: "localhost",
    port: 3308,  // custom EXTERNAL port to avoid conflicts
    user: 'shift_test',
    pass: 'shift_test',
    name: 'shift_test',
  }
}

// the default for sqlite
// if filename is null, it uses a memory database
// relative paths are resolved using the shift root directory
function getSqliteConfig(filename) {
  const connection = !filename ? ":memory:" : path.resolve(shiftRoot, filename);
  return {
    name: connection
  };
}
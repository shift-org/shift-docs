// the knex object opens a connection to the db.
const knex = require('knex');
const path = require('path'); // for sqlite 3
const pickBy = require('lodash/pickBy'); // a dependency of package knex
const config = require("./config");
const tables = require("./models/tables");
const dt = require("./util/dateTime");

// the default configuration;
// the values change based on various environmental values
const shift = {
  client: config.db.type,
  connection: {
    host : config.db.host,
    port : config.db.port,
    user : config.db.user,
    password : config.db.pass,
    database : config.db.name
  }
};

// testing for sqlite
const sqliteCfg = {
  client: "sqlite3",
  connection: ":memory:",
  // output to the root directory to inspect the data.
  // connection: "../test.db",
  useNullAsDefault: true,
};

// use sqlite when running `npm test`
let useSqlite = process.env.npm_lifecycle_event === 'test';

// hack: change mysql to sqlite if the environment variable
// MYSQL_DATABASE was set to "sqlite"
// also: can specify a filename for the db "sqlite:somefile.db"
if (!useSqlite && config.db.name.startsWith('sqlite')) {
  const parts = config.db.name.split(':');
  if (parts && parts.length === 2) {
    const fn = parts[1];
    sqliteCfg.connection = path.resolve(config.appPath, fn);
  }
  console.log("using sqlite", sqliteCfg.connection);
  useSqlite = true;
}

const dbConfig = Object.freeze( useSqlite ? sqliteCfg : shift );

const db = {
  // lightly wrap knex with a query function.
  // ex. db.query('calevent').....
  query: knex(dbConfig),

  // create tables if they dont already exist
  initialize() {
    return tables.create(db.query, !useSqlite);
  },

  // for tests to be able to reset the database.
  recreate() {
    db.query = knex(dbConfig);
    return db.initialize();
  },

  // helper shortcut
  raw(...args) {
    return db.query.raw(...args);
  },

  // convert a dayjs object to a 'date' column.
  //
  // the sqlite driver stores a date as a number
  // re: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date
  // while that works, it's hard to read.
  //
  // mysql stores a date as "YYYY-MM-DD"
  // re: https://dev.mysql.com/doc/refman/8.0/en/date-and-time-literals.html
  // but the code has been handing it javascript dates, and it seems to like that.
  // tbd: test if mysql can (also) use strings; if so, remove the if statement here.
  //
  toDate(date) {
    return !useSqlite ? date.toDate() : dt.toYMDString(date);
  },

  // sqlite and mysql differ on the keyword.
  currentDateString() {
    return !useSqlite ? `CURDATE()` : `DATE()`;
  },
};
module.exports = db;
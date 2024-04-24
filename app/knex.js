// the knex object opens a connection to the db.
const createKnex = require('knex');
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

const knex = {
  // lightly wrap knex with a query function.
  // ex. knex.query('calevent').....
  query: createKnex(dbConfig),

  // create tables if they dont already exist
  initialize() {
    return tables.create(knex.query, !useSqlite);
  },

  // for tests to be able to reset the database.
  recreate() {
    knex.query = createKnex(dbConfig);
    return knex.initialize();
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

  /**
   * update or insert into the database.
   * @param table string table name.
   * @oaram rec the object containing the data.
   * @return promises the rec ( with its new id ).
   *
   * fix? an orm would probably be smart enough to only update the needed fields.
   * this updates *everything*.
   */
  store(table, idField, rec) {
    const q = knex.query(table);
    // get everything from that isn't a function()
    let cleanData = pickBy(rec, isSafe);
    if (rec.exists()) {
      // fix: manually set modified for sqlite?
      // cleanData.modified = dt.toTimestamp();
      return q.update(cleanData)
        .where(idField, rec[idField])
        .then(_ => rec);
    } else {
      return q.insert(cleanData)
        .then(row => {
          rec[idField] = row[0];
          return rec;
        });
    }
  },
  /**
   * delete one (or more) rows from the named table
   * where the named field has the value in the passed record.
   */
  del(table, idField, rec) {
    return knex.query(table).where(idField, rec[idField]).del();
  },
};
module.exports = knex;

// ugh. if knex sees a function in an object,
// it assumes the function generates knex style queries and tries to call them.
// filter them out, mimicking what knex does internally for undefined values.
function isSafe(v, k) {
  return (typeof v !== 'function');
}

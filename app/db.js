const knex = require('knex'); // the knex constructor
const pickBy = require('lodash/pickBy'); // a dependency of package knex
const config = require("./config");
const dt = require("./util/dateTime");

// build knex configuration from our own
const dbConfig = unpackConfig(config.db);
const useSqlite = config.db.type === 'sqlite';
const dropOnCreate = config.db.connect?.name === 'shift_test';

const db = {
  config: config.db,

  // access to the created knex object.
  // ex. their `knex.select('*')` is our `db.query.select('*')`
  // valid in-between db.initialize() and db.destroy()
  query: false,

  // waits to open a connection.
  // re: #1137 - after a MySQL version update the server runs upgrade steps
  // and may refuse connections for longer than usual. Retry with backoff so the
  // node container recovers on its own without a manual bounce.
  async initialize(name) {
    if (db.query) {
      throw new Error("db already initialized");
    }
    const connection = knex(dbConfig);
    db.query = connection;
    if (config.db.type === 'mysql') {
      await waitForConnection(connection);
    } else {
      await connection;
    }
  },

  // promise to close connections.
  destroy() {
    const connection = db.query;
    if (!connection) {
      throw new Error("db already destroyed");
    }
    db.query = false;
    return connection.destroy();
  },

  // helper shortcut to make raw queries easier to write
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
    const q = db.query(table);
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
    return db.query(table).where(idField, rec[idField]).del();
  },
};
module.exports = db;

// ugh. if knex sees a function in an object,
// it assumes the function generates knex style queries and tries to call them.
// filter them out, mimicking what knex does internally for undefined values.
function isSafe(v, k) {
  return (typeof v !== 'function');
}

// Probe the MySQL connection with retries and exponential backoff.
// re: #1137 - MySQL runs upgrade steps on first launch after a version update.
// During that window mysqld is reachable but not yet accepting queries; a raw
// ping succeeds while SELECT 1 may still fail. Retrying here lets the node
// process self-heal instead of requiring a manual `./shift down && ./shift up`.
//
// Max wait: ~63 s  (delays of 1, 2, 4, 8, 16, 32 s across 6 attempts)
async function waitForConnection(connection, maxRetries = 6) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await connection.raw('SELECT 1');
      return; // success
    } catch (err) {
      if (attempt === maxRetries) {
        throw err;
      }
      const delaySec = Math.pow(2, attempt - 1); // 1, 2, 4, 8, 16, 32 …
      console.warn(
        `db: connection attempt ${attempt}/${maxRetries} failed (${err.code ?? err.message}),` +
        ` retrying in ${delaySec}s\u2026`
      );
      await new Promise(resolve => setTimeout(resolve, delaySec * 1000));
    }
  }
}

// turn the shift config into knex format
function unpackConfig({ type, connect, debug }) {
  return (type === 'mysql') ? {
    client: 'mysql2',
    debug,
    connection: {
      host : connect.host,
      port : connect.port,
      user : connect.user,
      password : connect.pass,
      database : connect.name,
      // match the utf8mb4 database/server so 4-byte characters
      // ( ex. emoji ) round-trip cleanly. re: #796
      charset : 'utf8mb4',
    },
    // knex recommends setting the min pool size to 0
    // ( for backcompat, their default is 2. )
    // https://knexjs.org/guide/#pool
    pool: {
      min: 0,
      max: 7,
    },
  } : (type === 'sqlite') ? {
    client: "sqlite3",
    debug,
    connection: {
      filename: connect.name,   // memory or a filename
    },
    useNullAsDefault: true,
  } : {
    client: "unknown"
  }
}
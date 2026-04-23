const knex = require('knex'); // the knex constructor
const pickBy = require('lodash/pickBy'); // a dependency of package knex
const config = require("./config");
const dt = require("./util/dateTime");

// build knex configuration from our own
const dbConfig = unpackConfig(config.db);
const useSqlite = config.db.type === 'sqlite';
const dropOnCreate = config.db.connect?.name === 'shift_test';
let prevSetup;

const db = {
  config: config.db,

  // access to the created knex object.
  // ex. their `knex.select('*')` is our `db.query.select('*')`
  // valid in-between db.initialize() and db.destroy()
  query: false,

  // waits to open a connection.
  async initialize(name) {
    if (db.query) {
      throw new Error(`db being initialized by ${name} when already initialized by ${this.initialized}.`);
    }
    const connection = knex(dbConfig);
    db.query = connection;
    db.initialized = name;
    await connection;
  },

  // promise to close connections.
  destroy() {
    const connection = db.query;
    if (!connection) {
      throw new Error("db already destroyed");
    }
    db.query = false;
    db.initialized = false;
    return connection.destroy();
  },

  // helper shortcut
  raw(...args) {
    return db.query.raw(...args);
  },

  // sqlite and mysql differ on the keyword.
  currentDateString() {
    return !useSqlite ? `CURDATE()` : `DATE()`;
  }
};
module.exports = db;

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
      database : connect.name
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
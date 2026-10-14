const knex = require('knex'); // the knex constructor
const config = require('shift-docs/config');
const dt = require('shift-docs/util/dateTime');

// build knex configuration from our own
const dbConfig = unpackConfig(config.db);
const useSqlite = config.db.type === 'sqlite';

const db = {
  config: config.db,

  // access to the created knex object.
  // ex. their `knex.select('*')` is our `db.query.select('*')`
  // valid in-between db.initialize() and db.destroy()
  query: false,

  // waits to open a connection.
  async initialize(debugName = "unknown") {
    if (db.query) {
      throw new Error(`db being initialized by ${debugName} when already initialized by ${this.debugName}.`);
    }
    const connection = knex(dbConfig);
    db.query = connection;
    db.debugName = debugName;
    await connection;
  },

  // promise to close connections.
  destroy() {
    const connection = db.query;
    if (!connection) {
      throw new Error("db already destroyed");
    }
    db.query = false;
    db.debugName = `destroyed ${db.debugName}`;
    return connection.destroy();
  },

  // helper shortcut to make raw queries easier to write
  raw(...args) {
    return db.query.raw(...args);
  },
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
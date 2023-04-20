// the knex object opens a connection to the db.
const createKnex = require('knex');
const pickBy = require('lodash/pickBy'); // a dependency of package knex
const config = require("./config");
const tables = require("./models/tables"); // for sqlite 3

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
const test = {
  client: "sqlite3",
  connection: ":memory:",
  useNullAsDefault: true,
};

let useSqlite = process.env.npm_lifecycle_event === 'test';
if (!useSqlite && (process.argv.length >= 2) && (process.argv[2] === "sqlite")) {
  console.log("using sqlite");
  useSqlite = true;
}

const dbConfig = Object.freeze( useSqlite ? test : shift );

const knex = {
  // lightly wrap knex with a query function.
  // ex. knex.query('calevent').....
  query: createKnex(dbConfig),

  // hack for a way to run sqlite locally instead of mysql.
  initialize() {
    return useSqlite ? tables.create(knex.query) : Promise.resolve(knex.query);
  },

  // for tests to be able to reset the database.
  recreate() {
    knex.query = createKnex(dbConfig);
    return knex.initialize();
  },

  /**
   * update or insert into the database.
   * @param table string table name.
   * @oaram rec the object containing the data.
   *
   * fix? an orm would probably be smart enough to only update the needed fields.
   * this updates *everything*.
   */
  store(table, idField, rec) {
    const q = knex.query(table);
    const cleanData = pickBy(rec, isSafe);
    return rec.exists() ?
      q.update(cleanData)
        .where(idField, rec[idField])
        .then(_ => rec) :
      q.insert(cleanData)
        .then(row => {
          rec[idField] = row[0];
          return rec;
        });
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

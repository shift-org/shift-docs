const allViews = require("server/v2/schema/allViews");
const { allTables, extraKeys } = require("server/v2/schema/allTables");
const TableMaker = require('server/util/tableMaker');

module.exports = {
  // create or ensure all tables, views, etc. exist
  // where db is a 'core/db' connection
  // returns the promise of success (true)
  setupTables(db, options = {drop: false}) {
    const context = { tables: allTables, views: allViews };
    const steps = options.drop ? stages.recreateAll : stages.ensureAll;
    // create a nested chain of promises
    // each step has to succeed before the next occurs
    return steps.reduce((prev, stage) => prev.then(_ => {
      const ps = stage(db, context);
      return Promise.all(ps);
    }), Promise.resolve(true));
  },

  // where db is a 'core/db' connection
  // return an array of sql statements
  setupStatements(db) {
    const context = { tables: allTables, views: allViews };
    return stages.recreateAll.flatMap(stage => {
      const ps = stage(db, context);
      const out =  ps.map(p => {
        // https://github.com/knex/knex/issues/5369
        const res = p.toSQL();
        const text = db.raw(res[0].sql, res[0].bindings).toSQL().toNative().sql;
        return (text.endsWith(';') ? text : text + ';') + '\n';;
      });
      return out;
    });
  },
}

// ---------------------------------------------------------------------------
// staging
// ---------------------------------------------------------------------------

// holds arrays of staging functions: fn(db, {tables, views})
// which must be called in-order, one at a time.
const stages = {
  ensureAll: [ensureTables, dropViews, ensureViews],
  recreateAll: [dropViews, dropTables, setupTables, ensureViews]
}

// a staging function: drops all the tables
// returns an array of promises
function dropTables(db, {tables}) {
  db.config.debug && console.log("dropTables...");
  const names = Object.keys(tables);
  return names.map(n => db.query.schema.dropTableIfExists(n));
}
// a staging function: drops all known views
// returns an array of promises
function dropViews(db, {views}) {
  db.config.debug && console.log("dropViews...");
  const names = Object.keys(views);
  return names.map(n => db.query.schema.dropViewIfExists(n));
}
// a staging function: creates tables, errors if they exist
// returns an array of promises
function setupTables(db, {tables}) {
  const names = Object.keys(tables);
  const ps = names.map(n => createTable(db, n, tables[n]));
  db.config.debug && console.log(`create ${ps.length} tables...`);
  return ps;
}
// a staging function: ensure the tables exist, skipping if they already do.
// returns an array of promises
function ensureTables(db, {tables}) {
  db.config.debug && console.log("ensureTables...");
  const names = Object.keys(tables);
  return names.map(n => db.query.schema.hasTable(n).then(exists => {
    if (!exists) {
      return createTable(db, n, tables[n]);
    }
  }));
}
// a staging function: ensure the views exist, recreating if they already do.
// returns an array of promises
function ensureViews(db, {views}) {
  db.config.debug && console.log("ensureViews...");
  return Object.keys(views).map(name => recreateView(db, name, views[name]));
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

// returns the promise of a table
function createTable(db, name, tableDesc) {
  return db.query.schema.createTable(name, table => {
    db.config.debug && console.log(`createTable ${name}:`);
    const tm = new TableMaker(db, table);
    for (const colName in tableDesc) {
      const args = [].concat(tableDesc[colName]); // normalize 1 or more arguments into an array of many
      const method = args.shift();            // pop the first one, the "make.something()" function
      method.call(tm, colName, ...args);       // call that function with any remaining arguments
    }
  });
}

// returns the promise of a new view
// because views are transient, creates or replaces them
function recreateView(db, name, raw) {
  return db.query.schema.createView(name, (view) => {
    return view.as(db.raw(raw));
  });
}

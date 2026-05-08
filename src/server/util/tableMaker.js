
// wrapper to provide a more limited method of creating tables.
class TableMaker {
  constructor(db, table) {
    if (!db.config.type) {
      throw new Error(`missing db type`);
    }
    this.db = db;
    this.table = table;
    if (this.isMysql()) {
      table.engine("MyISAM");
      table.collate('utf8mb4_general_ci');
    }
  }
  isMysql() {
    return this.db.config.type === 'mysql';
  }
  primaryKey(name) {
    // knex creates these as unsigned; the original tables were signed
    // it should be fine; that's a lot of ids.
    // knex uses this as the primary key if another isn't specified.
    this.table.increments(name);
  }
  // a column to reference the series
  // with no compositeKey,
  //  the series id alone uniquely identifies the row.
  // with a compositeKey,
  //  the series id and the named column together uniquely identify the row.
  dependentKey(id, compositeKey) {
    const column = this.table.integer(id).notNullable();
    if (!compositeKey) {
      column.primary();
    } else {
      this.table.primary([id, compositeKey]);
    }
  }
  uniqueIndex(id, ...columns) {
    this.table.integer(id).notNullable();
    this.table.index([id].concat(columns));
  }
  // add a column for row created time
  createdTime(name) {
    this.table.timestamp(name)
    .notNullable()
    .defaultTo(this.db.raw('CURRENT_TIMESTAMP'));
  }
  // add a column for row modified time
  // fix? modified time doesn't work for sqlite;
  // maybe instead, manually set the time on store.
  modifiedTime(name) {
    const ts = this.table.timestamp(name).notNullable();
    if (!this.isMysql()) {
      ts.defaultTo(this.db.raw('CURRENT_TIMESTAMP'));
    } else {
      ts.defaultTo(this.db.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
    }
  }
  // a 0/1 flag that defaults to 0
  boolflag(name, opt) {
    opt = opt || { default: 0, required: true };
    const column = this.table.tinyint(name, 1);
    setDefaults(column, opt);
  }
  // 4 byte signed value (-2147483648 to 2147483647)
  integer(name, opt) {
    opt = opt || { default: 0, required: false };
    // note: in the original tables `int(11)` is a *display* size
    // and its deprecated as of mysql 8.0.17
    // https://dev.mysql.com/doc/refman/8.0/en/numeric-type-attributes.html
    const column = this.table.integer(name);
    setDefaults(column, opt);
  }
  // a string containing no more than {'width'} characters.
  // not required ( can be null ) by default.
  string(name, opt) {
    const column = this.table.string(name, opt.width);
    setDefaults(column, opt);
  }
}

// where opt can contain { required: <true/false>, default: <value> }
function setDefaults(column, opt) {
  if (opt.default !== undefined) {
    column.defaultTo(opt.default);
  }
  if (opt.required) {
    column.notNullable();
  }
}

module.exports = TableMaker;
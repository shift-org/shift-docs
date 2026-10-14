/**
 * high level functions for creating and updating events in the db.
 * note: all of these assume the incoming data has been validated
 * except for the correct id/password pairing.
 */
const db = require('shift-docs/db');
const { allTables, extraKeys } = require('shift-docs/schema/allTables');
const dt = require('shift-docs/util/dateTime');
const misc = require('shift-docs/util/misc');

module.exports = {
  newEventData,       // generates a new secret
  updateEventData,    // validates the secret
  updateImageData,    // does not validate the secret
  deleteEntireSeries, // validates the secret
  revokeEntireSeries,
  // exported for testing
  isEmptyRow,
  insertNewData       // overwrites the secret
};

// ex. "series" -> "cal_series"
function getTableName(group) {
  return "cal_" + group;
}

const table = {
  series: "cal_series",
  image: "cal_image",
  schedule: 'cal_schedule',
  privateData: 'cal_private',
}

// after creating a new event and adding all its info
// promises an object containing { id, secret }.
// tx can be either 'db.query' or a knex transaction.
function newEventData(tx, eventData, dayData) {
  const secret = misc.newSecret();
  eventData.private.secret = secret;
  return insertNewData(tx, eventData).then(id => {
    return writeSchedule(tx, id, dayData).then(_ => ({
      id,
      secret
    }));
  });
}

// after validating the id and secret
// updates all event and scheduling info then
// promises an object containing { seriesId, published }
// where 'published' is a counter of the next change.
function updateEventData(tx, seriesId, eventData, dayData) {
  // eventData is a map of table to row data
  // for each table, generate an update statement
  const updates = Object.keys(eventData).flatMap(group => {
    const vals = eventData[group];
    // normalize into an array. most of the time there will be only one row
    // except for something like tag(s) which might have multiple rows to write.
    const rows = [].concat(vals);
    const tableName = getTableName(group);
    return rows.map(row => updateOrDelete(tx, tableName, seriesId, row));
  }).concat(writeSchedule(tx, seriesId, dayData));
  // wait on all the table updates including the schedule.
  // after everything: return the id and predicted next published counter
  return Promise.all(updates);
}

// insert or update image data for the indicated series.
// where img = { name, ext: '.ext' }
// does not validate the secret!
function updateImageData(tx, seriesId, name, ext) {
  if (name !== ('' + seriesId)) {
    throw new Error(`Image for series '${seriesId}' had an unexpected name: '${name}'`);
  } else if (!('' + ext).startsWith('.')) {
    throw new Error(`Image for series '${seriesId}' had an unexpected extension: '${ext}'`)
  }
  const data = {
    id: seriesId,
    img_version: 1,
    img_ext: ext.slice(1),
  }
  return tx(table.image)
    .insert(data)
    .onConflict('id')
    // undocumented merge raw:
    // https://github.com/knex/knex/issues/5652#issuecomment-3368670719
    .merge({
      img_version: db.raw(`img_version + 1`),
      img_ext: data.img_ext,
      // doesn't clear override
      // b/c that's set by us
      // if it's set, there's probably a reason.
      // img_override: null,
    });
}

async function writeSchedule(tx, seriesId, dayData) {
  // create an array of just the dates. ex ["YYYY-MM-DD", "YYYY-MM-DD", ...]
  const ymds = dayData.map(el => el.ymd);
  // assuming there are some....
  if (ymds.length) {
    // first insert any missing dates to the db
    await addMissingDays(tx, seriesId, ymds);
    // and then update the data for all the requested days
    await updateDailyStatus(tx, seriesId, dayData);
  }
  // finally, remove any entries *not* in the requested dates
  await delistMissingDays(tx, seriesId, ymds);
}

// create days for any dates not in the db.
// assumes newDates is an array of validated YYYY-MM-DD strings.
function addMissingDays(tx, seriesId, ymds) {
  const now = dt.toTimestamp(); // for sqlite, set the change time manually
  // generates ? placeholders for the query
  const withIdDates = withTable("idDates", ['id', 'ymd', 'changed'], ymds.length);
  // those places holders are filled with these matching values:
  const idDates = ymds.flatMap(ymd => [seriesId, ymd, now]);
  const raw = `
  insert into ${table.schedule}(id, ymd, changed)
  ${withIdDates}
  select * from idDates
  where not exists ( 
    select 1 from ${table.schedule}
    where ${table.schedule}.id = idDates.id
    and ${table.schedule}.ymd = idDates.ymd
  )`;
  return tx.raw(raw, idDates);
}

// delist any days not listed in ymds
// ( by filling the schedule with nulls )
function delistMissingDays(tx, seriesId, ymds) {
  const now = dt.toTimestamp(); // for sqlite, set the change time manually
  return tx(table.schedule)
    .where('id', seriesId)
    .whereNotIn('ymd', ymds)
    .update({
      is_scheduled: null,
      changed: now,
    });
}

// overwrite an existing schedule with dayData
// dayData is an array of: { ymd, is_scheduled, news }
// the validated data from the client.
function updateDailyStatus(tx, seriesId, dayData) {
  const now = dt.toTimestamp(); // for sqlite, set the change time manually
  const usingSqlite = db.config.type === 'sqlite';
  const withValues = withTable("vals", ['ymd', 'new_status', 'new_news', 'new_changed'], dayData.length);
  const vals = dayData.flatMap(sched => [sched.ymd, sched.is_scheduled, sched.news, now])
  return tx.raw(withValues + `
  update ${table.schedule}
  ${!usingSqlite ? `join vals`: ""}
  set
    is_scheduled = vals.new_status,
    news = vals.new_news,
    changed = vals.new_changed
  ${usingSqlite ? `from vals`: ""}
  where ${table.schedule}.id = ${seriesId}
  and ${table.schedule}.ymd = vals.ymd`, vals);
}

// hides the published series
// ( ex. instead of completely deleting it )
function revokeEntireSeries(tx, id, secret) {
  return tx(table.privateData)
    .where({id, secret})
    .then(rows => {
      if (!rows.length) {
        return false;
      } else {
        return tx(table.series)
          .where({id})
          .update("published", null)
          .then(rows => true);
      }
    }); // end query
}

// promises the total number of removed items when done:
// zero if the series didn't exist or the secret didn't match.
function deleteEntireSeries(tx, id, secret) {
  return tx(table.privateData)
    .where({id, secret})
    .then(rows => {
      if (!rows.length) {
        return 0;
      } else {
        // ex. "cal_series"
        const tableNames = Object.keys(allTables);
        // each del() results in a count of the rows deleted
        const ps = tableNames.map(name => tx(name).del().where('id', id));
        // after deleting everything, sum all of the counts.
        return Promise.all(ps).then(cnt => cnt.reduce((sum, val) => sum + val, 0));
      }
    }); // end query
}

// generate a transient table with the named columns, and a certain number of rows.
// return a string with enough placeholder parameters to hold row * column values.
// ex. `with name(col0, col1, col2) as ( select ?, ? union all select ?, ? )`
// generates a 3 column, 2 row table, and '?' is a placeholder which gets filled elsewhere.
function withTable(name, cols, rowcount) {
  const select = "select " + Array(cols.length).fill("?").join(",");
  return `with ${name} (${cols}) as ( ${
    Array(rowcount).fill(select).join(" union all ")
  } )`;
}

// adds new event data to the db, promising the generated seriesId.
// eventData is a map of group name to table data.
// the tableData can be one row of data, or multiple rows ( an array. )
// each row of data is an object { column_name: column_data }.
// NOTE: this doesn't do any data validation nor any secret testing.
function insertNewData(tx, eventData) {
  // first: insert the series table first
  return tx(table.series).insert(eventData.series).then(row => {
    // the series id is auto-generated by the series table
    const seriesId = row[0];
    // then: insert the other tables other than series.
    const groups = Object.keys(eventData).filter(group => group !== 'series');
    // visit all of them, insert returns a promise
    // make a list of all the promised inserts
    const promises = groups.flatMap(group => {
      // ex. "series" -> "cal_series"
      const tableName = getTableName(group);
      // concat normalizes one or more rows in the data to a list of rows.
      const rows = [].concat(eventData[group]).filter(rowData => {
        // filter out any empty rows out of the inserted data.
        return !isEmptyRow(tableName, rowData);
      });
      return rows.map(rowData => {
        rowData.id = seriesId; // every row in every table references the series
        return tx(tableName).insert(rowData);
      });
    });
    return Promise.all(promises).then(_ => seriesId);
  });
}

function updateOrDelete(tx, tableName, seriesId, rowData) {
  const q = tx(tableName).where('id', seriesId);
  const extraKey = extraKeys[tableName];
  if (extraKey) {
    q.where(extraKey, rowData[extraKey]);
  }
  // for safety, lets only try to delete rows from the special type tables
  if (extraKey && isEmptyData(rowData, [extraKey])) {
    q.del();
  } else {
    q.update(rowData);
  }
  return q;
}

// returns `true` if every value in the passed row data is empty
// where `tableName` is a known table, and `rowData` is a map of { column_name: column_data }.
// used by insertNewData() to skip inserting data which would generate a row of empty data.
// ( ex. a tag with a false value, or an empty ending location. )
function isEmptyRow(tableName, rowData) {
  const extraKey = extraKeys[tableName];
  return isEmptyData(rowData, ['id', extraKey]);
}

// helper for isEmptyRow
// if the named column isnt in the ignore list,
// and it has a non-zero value; the row has data.
function isEmptyData(rowData, ignore = []) {
  const first = Object.keys(rowData).findIndex(colName =>
    !ignore.includes(colName) && !!rowData[colName]);
  return first < 0;
}

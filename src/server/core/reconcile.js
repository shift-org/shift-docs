/**
 * high level functions for creating and updating events in the db.
 * note: all of these assume the incoming data has been validated
 * except for the correct id/password pairing.
 */
const db = require("server/core/db");
const { StatusError } = require("server/support/errors");
const { allTables, extraKeys } = require("server/v2/schema/allTables");
const dt = require("server/util/dateTime");
const misc = require('server/util/misc');

module.exports = {
  newEventData,       // generates a new secret
  updateEventData,    // validates the secret
  updateImageData,    // does not validate the secret
  removeEntireSeries, // validates the secret
  // exported for testing
  isEmptyRow,
  insertNewData       // overwrites the secret
};

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
function updateEventData(tx, seriesId, secret, eventData, dayData) {
  // update_check provides id, secret, published
  // tbd: instead of pre-matching the secret, can you throw if on mismatch
  return tx('update_check')
    .where({id: seriesId, secret})
    .then(rows => {
      if (!rows.length) {
        // note this can also happen when published is null
        // ( for revoking rides without deleting their data  )
        throw new StatusError(`Unknown series ${seriesId} or invalid password.`);
      }
      // we've read the current published value from the db:
      // increment it, and store it into the new series data.
      // not sure if the transaction saves us from race conditions on the counter.
      // (ex. if two requests to update the same event are being processed at the same time)
      // but i don't think it matters much.
      const nextChange = rows[0].published + 1;
      eventData.series.published = nextChange;
      // eventData is a map of table to row data
      // for each table, generate an update statement
      const updates = Object.keys(eventData).flatMap(tableName => {
        const vals = eventData[tableName];
        const rows = [].concat(vals); // normalize into an array
        return rows.map(row => updateOrDelete(tx, tableName, seriesId, row));
      }).concat(writeSchedule(tx, seriesId, dayData));
      // wait on all the table updates including the schedule.
      // after everything: return the id and predicted next published counter
      return Promise.all(updates).then(_ => ({
        seriesId,
        published: nextChange,
      }));
    });
}

// insert or update image data for the indicated series.
// where img = { name, ext: '.ext' }
// does not validate the secret!
function updateImageData(tx, seriesId, img) {
  if (img.name !== ('' + seriesId)) {
    throw new Error(`Image for series '${seriesId}' had an unexpected name: '${img.name}'`);
  } else if (!('' + img.ext).startsWith('.')) {
    throw new Error(`Image for series '${seriesId}' had an unexpected extension: '${img.ext}'`)
  }
  const data = {
    id: seriesId,
    img_version: 1,
    img_ext: img.ext.slice(1),
  }
  return tx('image')
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
  insert into schedule(id, ymd, changed)
  ${withIdDates}
  select * from idDates
  where not exists ( 
    select 1 from schedule
    where schedule.id = idDates.id
    and schedule.ymd = idDates.ymd
  )`;
  return tx.raw(raw, idDates);
}

// delist any days not listed in ymds
// ( by filling the schedule with nulls )
function delistMissingDays(tx, seriesId, ymds) {
  const now = dt.toTimestamp(); // for sqlite, set the change time manually
  return tx('schedule')
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
  const withValues = withTable("vals", ['ymd', 'is_scheduled', 'news', 'changed'], dayData.length);
  const vals = dayData.flatMap(sched => [sched.ymd, sched.is_scheduled, sched.news, now])
  return tx.raw(withValues + `
  update schedule
  ${!usingSqlite ? `join vals`: ""}
  set
    is_scheduled = vals.is_scheduled,
    news = vals.news,
    changed = vals.changed
  ${usingSqlite ? `from vals`: ""}
  where schedule.id = ${seriesId}
  and schedule.ymd = vals.ymd`, vals);
}

// promises the total number of removed items when done:
// zero if the series didn't exist or the secret didn't match.
function removeEntireSeries(tx, id, secret) {
  return tx('private')
    .where({id, secret})
    .then(rows => {
      if (!rows.length) {
        return 0;
      } else {
        const tableNames = Object.keys(allTables);
        // each del() results in a count of the rows deleted
        const ps = tableNames.map(name => tx(name).del().where('id', id));
        // after deleting everything, sum all of the counts.
        return Promise.all(ps).then(cnt => cnt.reduce((sum, val) => sum + val, 0));
      }
    }); // end query
}

// return a string which represents a table containing a bunch of parameters.
// ex. `with name(col0, col1, col2) as ( select ?, ? union all select ?, ? )`
// each '?' is a placeholder which gets filled elsewhere.
function withTable(name, cols, length) {
  const select = "select " + Array(cols.length).fill("?").join(",");
  return `with ${name} (${cols}) as ( ${
    Array(length).fill(select).join(" union all ")
  } )`;
}

// adds new event data to the db, promising the generated seriesId.
// eventData is a map of tableName => tableData
// the tableData can be one row of data, or multiple rows ( an array. )
// each row of data is an object { column_name: column_data }.
// NOTE: this doesn't do any data validation nor any secret testing.
function insertNewData(tx, eventData) {
  // first: insert the series table first
  return tx('series').insert(eventData.series).then(row => {
    // the series id is auto-generated by the series table
    const seriesId = row[0];
    // then: insert the other tables
    // get all those table names
    const otherTables = Object.keys(eventData).filter(tableName => tableName !== 'series');
    // visit all of them, insert returns a promise
    // make a list of all the promised inserts
    const promises = otherTables.flatMap(tableName => {
      // concat normalizes one or more rows in the data to a list of rows.
      const rows = [].concat(eventData[tableName]).filter(rowData => {
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
  const q =  tx(tableName).where('id', seriesId);
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

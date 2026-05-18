/**
 * high level table functions for creating and updating events.
 */
const db = require("server/core/db");
const { newSecret } = require('server/util/misc');
const { allTables, extraKeys } = require("server/v2/schema/allTables");

module.exports = {
  newEvent,
  updateEvent,
  updateImage,
  removeEntireSeries,
  // exported for testing
  isEmptyRow,
  insertEventData
};

// after creating a new event and adding all its info
// promises an object containing { seriesId, password }.
// tx can be either 'db.query' or a knex transaction.
function newEvent(tx, eventData, dayData) {
  const password = newSecret();
  eventData.private.secret = password;
  return insertEventData(tx, eventData).then(seriesId => {
    return updateDays(tx, seriesId, dayData).then(_ => ({
      seriesId,
      password
    }));
  });
}

// after updating all event data and days
// promises an object containing { seriesId, published }.
// intended to be used in a a transaction so that if it fails
// ( ex. due to password mismatch ) nothing gets written to the db.
function updateEvent(tx, seriesId, secret, eventData, dayData) {
  // tbd: instead of pre-matching the secret, can you throw if on mismatch
  return tx('update_check')
    .where({id: seriesId, secret})
    .then(rows => {
      if (!rows.length) {
        // note this can also happen when published is null
        // ( for revoking rides without deleting their data  )
        throw new Error(`Unknown series ${seriesId} or invalid password.`);
      }
      // we've read the current published value from the db:
      // increment it, and store it into the new series data.
      const nextChange = rows[0].published + 1;
      eventData.series.published = nextChange;
      return tables.updateEventData(tx, seriesId, eventData).then(_ => {
        return updateDays(tx, seriesId, dayData);
      }).then(_ => ({
        seriesId,
        published: nextChange,
      }));
    });
}

// insert or update image data
// where img = { name, ext: '.ext' }
function updateImage(tx, seriesId, img) {
  if (img.name !== ('' + seriesId)) {
    throw new Error(`series '${seriesId}' had unexpected image '${img.name}'`);
  } else if (!('' + img.ext).startsWith('.')) {
    throw new Error(`series ${seriesId} had unexpected img extension '${img.ext}'`)
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

// TODO: what happens if something fails?
async function updateDays(tx, seriesId, dayData) {
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
  // manually validate the id
  if (!Number.isInteger(seriesId)) {
    throw new Error(`Invalid id ${seriesId}`);
  }
  const withIdDates = withTable("idDates", ['id', 'ymd'], ymds.length);
  const idDates = ymds.flatMap(ymd => [seriesId, ymd]);
  return tx.raw(`
  insert into schedule(id, ymd)
  ${withIdDates}
  select * from idDates
  where not exists ( 
    select 1 from schedule
    where schedule.id = idDates.id
    and schedule.ymd = idDates.ymd
  )`, idDates);
}

// delist any days not listed in ymds
// ( by filling the schedule with nulls )
function delistMissingDays(tx, seriesId, ymds) {
  return tx('schedule')
    .where('id', seriesId)
    .whereNotIn('ymd', ymds)
    .update('is_scheduled', null);
}

// overwrite an existing schedule with dayData
// dayData is an array of: { date, is_scheduled, news }
function updateDailyStatus(tx, seriesId, dayData) {
  // manually validate the id
  if (!Number.isInteger(seriesId)) {
    throw new Error(`Invalid id ${seriesId}`);
  }
  const usingSqlite = db.config.type === 'sqlite';
  const withValues = withTable("vals", ['ymd', 'is_scheduled', 'news'], dayData.length);
  const vals = dayData.flatMap(sched => [sched.ymd, sched.is_scheduled, sched.news])
  return tx.raw(withValues + `
  update schedule
  ${!usingSqlite ? `join vals`: ""}
  set
    is_scheduled = vals.is_scheduled,
    news = vals.news
  ${usingSqlite ? `from vals`: ""}
  where schedule.id = ${seriesId}
  and schedule.ymd = vals.ymd`, vals);
}

// promises the total number of removed items when done.
function removeEntireSeries(tx, id, secret) {
  // tbd: instead of pre-matching the secret, can you throw if deleting returned 0?
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
function insertEventData(tx, eventData) {
  // first: insert the series table first
  return tx('series').insert(eventData.series).then(row => {
    // the series id is autogenerated by the series table
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


// issues statements to update rows ( or remove them if empty )
// the eventData format matches the .insert() format ( above )
// NOTE: this doesn't do any data validation nor any secret testing.
function updateEventData(tx, seriesId, eventData) {
  const updates = Object.keys(eventData).flatMap(tableName => {
    const vals = eventData[tableName];
    const rows = [].concat(vals); // normalize into an array
    return rows.map(rowData =>
      updateOrDelete(tx, tableName, seriesId, rowData));
  });
  return Promise.all(updates);
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
// used by insertEventData() to skip inserting data which would generate a row of empty data.
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

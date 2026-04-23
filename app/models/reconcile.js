/**
 * high level table functions for creating and updating events.
 */
const crypto = require("crypto");
const db = require("../db");
const tables = require("./tables");

module.exports = {
  newEvent,
  updateEvent,
  updateImage,
  removeEntireSeries,
};

// promises an object containing { seriesId, password }
// tx can be either 'db.query' or a knex transaction.
function newEvent(tx, eventData, dayData) {
  // uuid4 is 36 chars including hyphens 123e4567-e89b-12d3-a456-426614174000
  // the secret format has been 32 chars no hyphens.
  const password = crypto.randomUUID().replaceAll("-" , "");
  eventData.private.secret = password;
  return tables.insertEventData(tx, eventData).then(seriesId => {
    return updateDays(tx, seriesId, dayData).then(_ => ({
      seriesId,
      password
    }));
  });
}

// promises an object containing { seriesId  }
// after updating all event data and days.
// intended to be used in a a transaction so that if it fails
// ( ex. due to password mismatch ) nothing gets written to the db.
function updateEvent(tx, seriesId, secret, eventData, dayData) {
  // tbd: instead of pre-matching the secret, can you throw if on mismatch
  return tx('private')
    .where({id: seriesId, secret})
    .then(rows => {
      if (!rows.length) {
        throw new Error(`Unknown series ${seriesId} or invalid password.`);
      }
      return tables.updateEventData(tx, seriesId, eventData).then(_ => {
        return updateDays(tx, seriesId, dayData);
      }).then(_ => ({
        seriesId
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
        // each del() results in a count of the rows deleted
        const ps = tables.tableNames.map(name => tx(name).del().where('id', id));
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

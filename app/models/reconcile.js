const crypto = require("crypto");
const db = require("../knex");
const { EventStatus, Review  } = require("./calConst");

const Reconcile = {
  newEvent,
  selectEvent,
  updateOverview,
  updateDays,
  deleteDays,
  delistDays,
  removeEntireSeries,
};

module.exports = Reconcile;

// tx can be either 'db.query' or a knex transaction.
// promises an object containing { seriesId, password }
function newEvent(tx, values) {
  // uuid4 is 36 chars including hyphens 123e4567-e89b-12d3-a456-426614174000
  // the secret format has been 32 chars no hyphens.
  const password = crypto.randomUUID().replaceAll("-" , "");
  // highlight is non-nullable; so have to specify some default.
  // FIX: maybe specify some default for mysql so this isn't needed?
  const highlight = 0;
  values.hidden = 1;
  values.password = password;
  values.highlight = 0;
  return tx('calevent')
    .insert(values)
    .then(row => ({
      // this is what we return:
      seriesId: row[0],
      password
    }));
}

// surprisingly, all we really need for updating an event
// is secret validation, hidden, and the change counter ( for saving images )
function selectEvent(tx, seriesId, secret) {
  return tx('calevent')
    .select(
        db.raw('1 + coalesce(changes, 0) as nextChange'), 
        db.raw('not coalesce(hidden, 0) as published'))
    .where('id', seriesId)
    .where('password', secret)
    .first();
}

// promises an array of the number of rows affected.
// ( which should always be [1] )
function updateOverview(tx, seriesId, nextChange, values) {
  // changing values in place avoids a copy of its properties
  // even if its not the friendly approach. 
  values.hidden = 0;
  values.changes = nextChange;
  return tx('calevent') 
    .where('id', seriesId)
    .update(values);
}

async function updateDays(tx, seriesId, status, removeMissing = null) {
  // create an array of just the dates. ex ["YYYY-MM-DD", "YYYY-MM-DD", ...]
  const newDates = status.map(el => el.date);
  // assuming there are some....
  if (newDates.length) {
    // first add any missing dates to the db
    await addMissingDays(tx, seriesId, newDates);
    // and then add the data for all the requested days
    await updateDailyStatus(tx, seriesId, status);
  }
  if (removeMissing) {
    await removeMissing(tx, seriesId, newDates);  
  }
}

// create days for any dates not in the db.
// assumes newDates is an array of validated YYYY-MM-DD strings.
function addMissingDays(tx, seriesId, newDates) {
  // manually validate the id
  if (!Number.isInteger(seriesId)) {
    throw new Error(`Invalid id ${seriesId}`);
  }
  return tx.raw(`
  insert into caldaily(id, eventdate) 
  with dates(id, eventdate) as (${
    // generate parameter placeholders
    newDates.map((at, index) => {
        return (index ? " union all " : "") +
        "select ?, ?"
      }).join("\n")
  })
  select * from dates
  where not exists ( 
    select 1 from caldaily 
    where caldaily.id = dates.id 
    and caldaily.eventdate = dates.eventdate
 )`, newDates.flatMap(at => [seriesId, at]));
}

// delete any days not listed in newDates
function deleteDays(tx, seriesId, newDates) {
  return selectDays(tx, seriesId, newDates)
    .del();
}

// delist any days not listed in newDates
function delistDays(tx, seriesId, newDates) {
  return selectDays(tx, seriesId, newDates)
    .update('eventstatus', EventStatus.Delisted);
}

// internal helper for removing days.
// selects the days of the series ( in YYYY-MM-DD format ) 
// which don't exist in the passed newDates
function selectDays(tx, seriesId, newDates) {
   return tx('caldaily')
    .select('eventdate')
    .where('id', seriesId)
    .whereNotIn('eventdate', newDates);
}

// overwrite all existing data with the newStatus
// newStatus is an array of: { date, state, news }
function updateDailyStatus(tx, seriesId, newStatus) {
  // manually validate the id
  if (!Number.isInteger(seriesId)) {
    throw new Error(`Invalid id ${seriesId}`);
  }
  // GOAL:
  // with status(date, state, news) as 
  // (  SELECT <values of status 0>
  //    UNION ALL SELECT <values of status 1> 
  //    <etc>
  // )
  // update caldaily set
  //   eventstatus = status.state 
  //   newsflash = status.news 
  // from status 
  // where caldaily.id = <seriesId>
  // and eventdate = status.date 
  return tx.raw(`
  with status(at, state, news) as (${
    // generate parameter placeholders
    newStatus.map((status, index) => {
        return (index ? " union all " : "") +
        "SELECT ?, ?, ?"
      }).join("\n")
  })
  update caldaily 
  ${!db.usingSqlite ? `join status`: ""}
  set
    eventstatus = status.state,
    newsflash = status.news 
  ${db.usingSqlite ? `from status`: ""}
  where caldaily.id = ${seriesId}
  and eventdate = status.at`, 
    // fill in all the ? parameters with the values from newStatus
    newStatus.flatMap(status => [status.date, status.state, status.news]));
}

// promises the total number of removed items when done.
// if the event was never published, we can delete it completely;
// otherwise, delist it.
function removeEntireSeries(tx, seriesId, secret) {
  // find the status of the requested event
  return tx('calevent')
    .where('id', seriesId)
    .where('password', secret)
    // zero and null are considered published.
    .select(db.raw('not coalesce(hidden, 0) as published'))
    .then(rows => {
      if (!rows.length) {
        return 0;
      } else {
        const { published } = rows[0];
        if (!published) {
          return _eraseSeries(tx, seriesId);
        } else {
          return _delistSeries(tx, seriesId);
        }
      }
    }); // end query
}

function _eraseSeries(tx, seriesId) {
  return tx('calevent').del().where('id', seriesId).then(a => {
    return tx('caldaily').del().where('id', seriesId).then(b => {
      return a + b;
    });
  });
}

// promise the delisting of all occurrences of this event, 
// and make it inaccessible to the organizer.
function _delistSeries(tx, seriesId) {
  const delistEvt = { review: Review.Excluded, password: "" };
  const delistDay = { eventstatus: EventStatus.Delisted };
  return tx('calevent').where('id', seriesId).update(delistEvt).then(a => {
    return tx('caldaily').where('id', seriesId).update(delistDay).then(b => {
      return a + b;
    });
  });
}

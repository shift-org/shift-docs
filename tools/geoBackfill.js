/**
 * look up map coordinates for existing events.
 * ( new and edited events get looked up when they're saved; see app/util/geocode.js )
 * ex. npm run -w tools geo-backfill
 *     npm run -w tools geo-backfill --from=2026-06-01
 *
 * only looks at events with occurrences on or after the "from" date ( default: today ),
 * and skips events whose location hasn't changed since their last lookup.
 * the public nominatim server allows at most one request per second;
 * so this waits between lookups.
 */
const knex = require("shift-docs/db");
const config = require("shift-docs/config");
const dt = require("shift-docs/util/dateTime");
const geocode = require("shift-docs/util/geocode");
const { CalEvent } = require("shift-docs/models/calEvent");
const { Review } = require("shift-docs/models/calConst");

const args = {
  // --from YYYY-MM-DD
  from: process.env.npm_config_from,
};

const delayMs = 1100;

async function geoBackfill() {
  if (!config.geocoder) {
    throw new Error("the geocoder is disabled ( see SHIFT_GEOCODER_URL )");
  }
  const from = args.from ? dt.fromYMDString(args.from) : dt.getNow().startOf('day');
  if (!from.isValid()) {
    throw new Error(`invalid date: ${args.from}`);
  }
  await knex.initialize();
  const rows = await knex.query('calevent')
    .distinct('calevent.id')
    .join('caldaily', 'caldaily.id', 'calevent.id')
    .where('eventdate', '>=', knex.toDate(from))
    .whereNot('review', Review.Excluded)
    .orderBy('calevent.id');
  console.log(`checking ${rows.length} events from ${dt.toYMDString(from)}`);
  let found = 0, missing = 0, skipped = 0;
  for (const { id } of rows) {
    const evt = await CalEvent.getByID(id);
    const before = evt.geoaddress;
    if (geocode.searchText(evt) === (before || "")) {
      ++skipped;
      continue;
    }
    await geocode.updateEvent(evt);
    if (evt.geoaddress !== before) {
      // store without bumping the change counter:
      // the coordinates aren't part of the ical feed.
      await evt._store();
    }
    if (evt.latitude != null) {
      ++found;
    } else {
      ++missing;
      console.log(`no match for ${id}: ${geocode.searchText(evt)}`);
    }
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  console.log(`found ${found}, no match ${missing}, unchanged ${skipped}`);
}

geoBackfill().catch(e => {
  console.error(e);
  process.exitCode = 1;
}).finally(() => {
  process.exit();
});

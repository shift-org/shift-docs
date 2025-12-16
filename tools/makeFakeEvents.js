/**
 * create one or more fake events.
 * ex. npm run -w tools make-fake-events
 */
const knex = require("shift-docs/db");
const dt = require("shift-docs/util/dateTime");
const { makeFakeData } = require("shift-docs/test/fakeData");

// todo: improve commandline parsing
// this uses npm's command vars ( probably a bad idea )
// maybe use commander?
const args = {
  // --make 1
  // number of unique events to generate
  // ( will generate a random number of days per event )
  make : process.env.npm_config_make ?
         parseInt(process.env.npm_config_make) : 5,
  // --start 1
  // number of days into the future to start creating events
  // where 0 is today, 1 is tomorrow, etc.
  start : process.env.npm_config_start ?
        parseInt(process.env.npm_config_start) : 1,
  // --range 7
  // number of days into the future can events be created
  range : process.env.npm_config_range ?
        parseInt(process.env.npm_config_range) : 7,
};

// do the thing:
async function makeFakeEvents() {
  const firstDay = dt.getNow().add(args.start, 'days');
  const lastDay = firstDay.add(args.range, 'days');
  const numEvents = args.make;
  return knex.initialize().then(_ => {
    return makeFakeData(firstDay, lastDay, numEvents);
  })
  .then(_ => {
    console.log("done");
    // can't use top-level "await" with commonjs modules
    // ( ie. await makeFakeEvents() )
    // and can't seem to use standard es modules with chai-http
    // ( todo: find an alternative to chai? )
    process.exit()
  });
};
makeFakeEvents();

/**
 * create one or more fake events
 */
const { faker } = require('@faker-js/faker');
const knex = require("../knex");
const dt = require("../util/dateTime");
const { Area, Audience, DatesType, EventStatus } = require('../models/calConst');

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
async function run() {
  console.log("generating with:", JSON.stringify(args, null, " "));
  return knex.initialize().then(_ => {
    // start generating events
    let promisedEvents = [];
    const firstDay = dt.getNow().add(args.start, 'days');
    for (let i=0; i< args.make; i++) {
      // always have one event on the day specified;
      // on subsequent events, pick from a range of days.
      let start = !i ? firstDay:
         dt.convert(faker.date.soon({
            refDate: firstDay.toDate(),
            days: args.range,
          }));
      const pendingEvt =
        knex.query('calevent')
        .insert(makeCalEvent()).then(row=> {
          const id= row[0]; // the magic to get the event id.
          const numDays= randomDayCount();
          const list = makeCalDailies(id, start, numDays);
          console.log("making", list.length, "days");
          let promisedDays = list.map(at => {
            return knex.query('caldaily').insert(at);
           });
          return Promise.all(promisedDays);
        });
      promisedEvents.push(pendingEvt);
    };
    // wait on all the days to finish.
    return Promise.all(promisedEvents);
  })
  .then(_ => {
    console.log("done");
    // can't use top-level "await" with commonjs modules
    // ( ie. await run() )
    // and can't seem to use standard es modules with chai-http
    // ( todo: find an alternative to chai? )
    process.exit()
  });
};
run();



function randomDayCount() {
  // some dumb weighted random
  const pick = [1,1,1,1,1,2,2,2,3,3,4,5];
  return faker.helpers.arrayElement(pick);
}

// days is the range of possible days in the future
// returns javascript date
function nextDay(days, refDate) {
  return !refDate? faker.date.soon(days) : faker.date.soon({
    days,
    refDate,
  });
}

function makeCalDailies(eventId, start, numDays) {
  let out = [];
  let active = faker.datatype.boolean(0.8);
  let flash = faker.datatype.boolean(!active? 0.8: 0.3);
  let msg = flash ? (active? faker.vehicle.bicycle() :
    faker.word.adverb() + " cancelled"): null;
  for (let i=0; i<numDays; i++) {
    if (i>0) {
      // 1 to 3 days from the first day
      start = start.add(1 + faker.number.int(3), 'days');
    }
    out.push({
      id          : eventId,
      eventdate   : start.toDate(),
      eventstatus : active? EventStatus.Active : EventStatus.Cancelled,
      newsflash   : msg,
    });
  }
  return out;
}

function capitalize(str, yes= true) {
  const first = str.charAt(0);
  return (yes? first.toUpperCase() : first.toLowerCase() ) + str.slice(1);
}

function makeCalEvent() {
  const title = faker.music.songName() ;
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const organizer = faker.person.fullName({firstName, lastName});
  const email = faker.internet.exampleEmail({firstName, lastName});
  const hideemail = faker.datatype.boolean(0.75) ? 1: 0;
  const printInfo = faker.datatype.boolean(0.5) ? 1: 0;
  const phone = faker.phone.number();
  const weburl = faker.datatype.boolean(0.5) ? null:
      faker.internet.url();
  const webname = faker.datatype.boolean(0.5) ? null:
      faker.word.verb() + " " +
      faker.word.adjective() + " " +
      faker.word.noun();
  const audience = faker.helpers.objectValue( Audience );
  const descr = faker.hacker.phrase();
  // this would normally be the event id; remove if this is a problem.
  const image = faker.datatype.boolean(0.75) ? null: "bike.jpg";
  // "19:00:00"
  const eventtime = (6+ faker.number.int(12)) + ":" +
                (15* faker.number.int(3)) + ":00";
  // in minutes, but sometimes not specified at all
  const eventduration = faker.datatype.boolean(0.25) ? null :
                (6* faker.number.int(3) * 15);
  const timedetails = faker.datatype.boolean(0.75) ? null :
                   faker.lorem.sentences({ min: 1, max: 3 });
  // mostly portland:
  const area = faker.datatype.boolean(0.25) ?
                    faker.helpers.objectValue( Area ) :
                    Area.Portland;
  const highlight = faker.datatype.boolean(0.1) ? 1: 0;
  const safetyplan  = faker.datatype.boolean(0.75) ? 1: 0;
  const loopride = faker.datatype.boolean(0.5) ? 1: 0;
  const locname =  faker.datatype.boolean(0.25) ? null :
                     capitalize(faker.word.adverb()) + " " +
                     capitalize(faker.animal.fish(), false);

  const address = faker.location.streetAddress();
  const locdetails = faker.datatype.boolean(0.25) ? null :
                   faker.company.catchPhrase();
  const locend = faker.datatype.boolean(0.50) ? null :
                     faker.location.streetAddress();

  // constants:
  const changes = 1;
  const hidden = 0; // never hidden
  const password = "12e1c433836d6c92431ac71f1ff6dd97";
  const datestype = DatesType.OneDay;

  return {
    // created,
    // modified,
    changes,
    // id: eventId,
    name: organizer,
    email,
    hideemail,
    printemail: printInfo,
    phone,
    hidephone: hideemail,
    printphone: printInfo,
    weburl,
    webname,
    printweburl: weburl,
    contact: organizer,
    hidecontact : 1,
    printcontact : printInfo,
    title: title,
    tinytitle: title,
    audience,
    descr,
    printdescr: descr,
    image,
    datestype,
    eventtime,
    eventduration,
    timedetails,
    locname,
    address,
    locdetails ,
    locend,
    loopride,
    area,
    highlight,
    hidden,
    password,
    safetyplan,
  };
}
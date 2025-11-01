const db = require("shift-docs/knex");
const { faker } = require('@faker-js/faker');
const config = require("shift-docs/config");
const dt = require("shift-docs/util/dateTime");
const { Area, Audience, DatesType, EventStatus } = require('shift-docs/models/calConst');

// password shared for all fake events
const password = "supersecret";
// number of days within which to create fake events
const fakeRange = 7;

// promise an array of events
//  - firstDay is a dt day
//  - numEvents: a number of events to create
//  - seed: an optional random seed
function makeFakeData(firstDay, lastDay, numEvents, seed) {
  faker.seed(seed);
  const promisedEvents = [];
  for (let i = 0; i< numEvents; i++) {
    // always have one event on the day specified;
    // on subsequent events, pick from a range of days.
    const start = !i ? firstDay:
       dt.convert(faker.date.between({
          from: firstDay.toDate(),
          to: lastDay.toDate(),
        }));
    const title = faker.music.songName();
    const pendingEvt =
      db.query('calevent')
      .insert(makeCalEvent(title)).then(row => {
        const id = row[0]; // the magic to get the event id.
        const numDays = randomDayCount();
        const list = makeCalDailies(id, start, numDays);
        const url = config.site.url("addevent", `edit-${id}-${password}`);
        // when passing a seed (ex. for tests); silence the output.
        if (!seed) {
          console.log(`created "${title}" with ${list.length} days starting on ${start}\n ${url}`);
        }
        let promisedDays = list.map(at => {
          return db.query('caldaily').insert(at);
         });
        return Promise.all(promisedDays);
      });
    promisedEvents.push(pendingEvt);
  };
  // wait on all the days to finish.
  return Promise.all(promisedEvents);   
}

// export!
module.exports = { makeFakeData };

function randomDayCount() {
  // some dumb weighted random
  const pick = [1,1,1,1,1,2,2,2,3,3,4,5];
  return faker.helpers.arrayElement(pick);
}

function randomRideLength() {
  // some dumb weighted random
  const pick = ['0-3', '3-8', '8-15', '15+'];
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
      eventdate   : db.toDate(start),
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

function makeCalEvent(title) {
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
  const locname =  capitalize(faker.word.adverb()) + " " +
                   capitalize(faker.animal.fish(), false);

  const address = faker.location.streetAddress();
  const locdetails = faker.datatype.boolean(0.25) ? null :
                   faker.company.catchPhrase();
  const locend = faker.datatype.boolean(0.50) ? null :
                     faker.location.streetAddress();
  const ridelength = randomRideLength();

  // constants:
  const changes = 1;
  const hidden = 0; // never hidden
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
    printweburl: printInfo,
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
    locdetails,
    locend,
    loopride,
    ridelength,
    area,
    highlight,
    hidden,
    password,
    safetyplan,
  };
}

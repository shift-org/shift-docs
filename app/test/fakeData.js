const { faker } = require('@faker-js/faker');
const db = require("shift-docs/db");
const config = require("shift-docs/config");
const dt = require("shift-docs/util/dateTime");
const tables = require("shift-docs/models/tables");
const { Area, Audience, Distance, LocType, TagName, WebType } = require('shift-docs/models/calConst');

// password shared for all fake events
const password = "supersecret";
// number of days within which to create fake events
const fakeRange = 7;

// writes an array of the fake data format into the db.
// separating generation from insertion prevents race conditions from influencing the generated data.
function insertFakeData(fakeData) {
  return db.query.transaction(tx => _insertData(tx, fakeData));
}

function _insertData(tx, fakeData) {
  const promisedEvents = fakeData.map(data => {
    return tables.insertEventData(tx, data.event).then(id => {
      const promisedDays = data.days.map(at => {
        at.id = id; // assign the id before adding to the db
        return tx('schedule').insert(at);
       });
      return Promise.all(promisedDays);
    });
  });
  // wait on all the events to finish.
  return Promise.all(promisedEvents);
}

// prints an array of fake data format to console.
function logFakeData(data) {
  data.forEach(({event, days}) => {
    const url = config.site.url("addevent", `edit-${event.id}-${event.password}`);
    const start = dt.friendlyDate(days[0].eventdate);
    console.log(`created ${url}\n  "${event.title}" with ${days.length} days starting on ${start}`);
  });
}

// promise an array of {event: {}, days: [{}]}
//  - firstDay is a dt day
//  - numEvents: a number of events to create
//  - seed: an optional random seed
// nextEventId can be a number, in which case it creates events starting with that id.
function generateFakeData(firstDay, lastDay, numEvents, seed, nextEventId = undefined) {
  faker.seed(seed);
  const out = [];
  let nextDayId = nextEventId ? 1 : undefined;
  for (let i = 0; i< numEvents; i++) {
    // always have one event on the day specified;
    // on subsequent events, pick from a range of days.
    const start = !i ? firstDay :
       dt.convert(faker.date.between({
          from: firstDay.toDate(),
          to: lastDay.toDate(),
        }));
    const title = faker.music.songName();
    const event = makeCalEvent(title, nextEventId);
    const numDays = randomDayCount();
    const days = makeCalDailies(start, numDays, nextDayId);
    if (nextEventId !== undefined) {
      nextEventId += 1;
      nextDayId += numDays;
    }
    out.push({
      event,
      days,
    });
  }
  return out;
}

// export!
module.exports = { insertFakeData, generateFakeData, logFakeData };

function randomDayCount() {
  // some dumb weighted random
  const pick = [1,1,1,1,1,2,2,2,3,3,4,5];
  return faker.helpers.arrayElement(pick);
}

function randomRideLength() {
  return faker.helpers.arrayElement(Distance);
}

// days is the range of possible days in the future
// returns javascript date
function nextDay(days, refDate) {
  return !refDate? faker.date.soon(days) : faker.date.soon({
    days,
    refDate,
  });
}

function makeCalDailies(start, numDays, nextPkid = undefined) {
  const out = [];
  const active = faker.datatype.boolean(0.8);
  const flash = faker.datatype.boolean(!active? 0.8: 0.3);
  const msg = flash ? (active? faker.vehicle.bicycle() :
    faker.word.adverb() + " cancelled"): null;
  for (let i=0; i<numDays; i++) {
    if (i>0) {
      // 1 to 3 days from the first day
      start = start.add(1 + faker.number.int(3), 'days');
    }
    out.push({
      ymd  : dt.toYMDString(start),
      news : msg,
      is_scheduled : active ? 1 : 0,  // boolean as a number
      pkid : (nextPkid !== undefined) ? (nextPkid++) : undefined,
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
  const area = faker.datatype.boolean(0.25) ?
                    faker.helpers.objectValue( Area ) :
                    Area.Portland;
  const highlight = faker.datatype.boolean(0.1);
  const safetyplan  = faker.datatype.boolean(0.75);
  const loopride = faker.datatype.boolean(0.5);
  const locname =  capitalize(faker.word.adverb()) + " " +
                   capitalize(faker.animal.fish(), false);

  const address = faker.location.streetAddress();
  const locdetails = faker.datatype.boolean(0.25) ? null :
                   faker.company.catchPhrase();
  const locend = faker.datatype.boolean(0.50) ? null :
                     faker.location.streetAddress();
  const ridelength = randomRideLength();

  // constants:
  return {
    image: {
      img_override: image,
    },
    series: {
      // not directly set: id, created, modified
      published: 1,
      title,
      organizer,
      start_time: eventtime,
      ride_duration: eventduration,
      details: descr,
    },
    location: [{
      loc_type: LocType.Start,
      place_name: locname,
      address: address,
      place_info: locdetails,
      time_info: timedetails,
    }, (locend || eventduration) ? filterObject({
        loc_type: LocType.Finish,
        place_name: locend,
    }) : null].filter(el => el), // removes the finish if it was empty
    private: {
      secret: password,
      private_email: email,
      private_phone: phone,
      private_contact: organizer,
      show_email: hideemail ? 0 : 1,
      show_phone: hideemail ? 0 : 1,
      show_contact: 0,
    },
    print: {
      add_contact: 0,
      add_email: printInfo,
      add_link: printInfo,
      add_phone: printInfo,
      printed_summary: descr,
    },
    tag: [
      tag(TagName.Area, area.data),
      tag(TagName.Audience, audience.data),
      tag(TagName.Distance, ridelength.data),
      tag(TagName.LoopRide, loopride),
      tag(TagName.SafetyPlan, safetyplan),
      tag(TagName.Featured, highlight),
    ].filter(t => !!t.tag_value),
    web: {
      web_type: WebType.Url,
      web_link: weburl,
      web_text: webname,
    }
  };
}

// return a copy of a, omitting keys with empty values.
function filterObject(a) {
  const out = {};
  Object.keys(a).forEach(k => {
    const v = a[k];
    if (v) {
      out[k] = v;
    }
  });
  return out;
}

function tag(a, b) {
  return {
    tag_type: a,
    tag_value: b,
  }
}
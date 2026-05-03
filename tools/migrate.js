/**
 * migrate from old tables to new tables
 * ex. npm run -w tools migrate
 */
const dt = require("shift-docs/util/dateTime");
const path = require('node:path');
const { Area, Audience, Distance, EventStatus, LocType } = require("shift-docs/models/calConst");
const { dumpTableStatements } = require("shift-docs/models/tables");
const db = require("shift-docs/db");
const fs = require("fs");
const assert = require("node:assert");

// return map of { tableName: newTable }
// caller writes to disk.
async function migrate() {
  const out = new Output();

  // tbd: char set?
  const pairs = dumpTableStatements(db);
  pairs.forEach((statement, name) => out.addTable(name, statement));

  const events = await readAllData();
  buildData(out, events);
  console.log(out);

  const outPath = "../services/db";

  Object.keys(out.tables).forEach(name => {
    const tableFile = path.join(outPath, `${name}.data`);
    const rows = out.tables[name].rows;
    const tableData = rows.join(`\n`);
    fs.writeFileSync(tableFile, tableData);
  });

  // const tables = els.join("\n");
  // fs.writeFileSync('./test.sql', tables);
}

function buildData(out, events) {
  for (const id in events) {
    const evt = events[id];
    const days = evt.allDays.filter(at => isScheduled(at) !== undefined);
    if (!days.length) {
      // raw data files don't allow comments
      // could generate a migration file with it though
      out.warn(evt.id, `no had valid days. review:${evt.review} title: "${evt.title}"`);
    } else {
      const diff = evt.allDays.length - days.length;
      if (diff > 0) {
        out.note(evt.id, `removed ${diff} days`);
      }
      seriesTable(out, evt);
      imageTable(out, evt);
      locTable(out, evt);
      printTable(out, evt);
      privateTable(out, evt);
      scheduleTable(out, evt, days)
      tagTable(out, evt);
      webTable(out, evt);
    }
  }
  return out;
}

// return a map of id -> { ...calevent fields..., allDays: [caldaily data, ....])
async function readAllData() {
  const events = {};
  // do this the slow dumb way
  const all = await db.query('calevent').joinRaw('left join caldaily using(id)').orderBy('id', 'eventdate');
  all.forEach(curr => {
    // add it as an event if we haven't seen it before
    const evt = events[curr.id] || curr;
    // add it as a day as well, or add it to other days
    evt.allDays = (evt.allDays || []).concat(curr);
    // and store whatever we did.
    events[curr.id] = evt;
  });
  await db.destroy();
  return events;
}

function seriesTable(out, evt) {
  // zero and null are considered visible.
  const hidden = evt.hidden === 1;
  const published = !hidden ? (evt.changes || 1) : 0;
  //
  let { modified, created } = evt;
  if (dt.convert(modified).isBefore(created)) {
    const swap = modified;
    modified = created;
    created = modified;
  }

  // munge and don't store if we can generate it.
  const munged = (evt.title || "").substring(0, 24).trim();
  const dbtiny = (evt.tinytitle || "").trim();

  out.insert('series', {
    id: evt.id,
    published,
    title: evt.title,
    tiny: eatNone((munged === dbtiny) ? null : dbtiny),
    organizer: evt.name,
    start_time: evt.eventtime,
    ride_duration: evt.eventduration,
    details: evt.descr,
    created: evt.created,
    modified: evt.modified,
  });
}
function imageTable(out, evt) {
  const { image } = evt;
  if (!!image) {
    const img = getImageData(evt.id, image);
    if (!img) {
      out.note(evt.id, `ignored image ${image}`)
    } else {
      out.insert('image', {
        id: evt.id,
        img_version: img.num || 0, // should we allow null here? i dunno.
        img_ext: img.override ? null : img.ext,
        img_override: img.override ? img.override : null,
      });
    }
  }
}
function locTable(out, evt) {
  out.insert('location', {
    id: evt.id,
    loc_type: LocType.Start,
    place_name: evt.locname,
    // only supported for start right now.
    address: evt.address,
    place_info: evt.locdetails,
    time_info: evt.timedetails,
  });
  const locEnd = (evt.locend + '').trim();
  if (locEnd) {
    out.insert('location', {
      id: evt.id,
      loc_type: LocType.Finish,
      place_name: locEnd,
      // only supported for start right now.
      address: null,
      place_info: null,
      time_info: null,
    });
  }
}
function printTable(out, evt) {
  // build the print data
  const print = {
    id: evt.id,
    add_email:    !!evt.printemail,   // false if never set ( null )
    add_phone:    !!evt.printphone,   // false if never set ( null )
    add_link:     !!evt.printweburl,  // false if never set ( null )
    add_contact:  !!evt.printcontact, // false if never set ( null )
    printed_summary: eatNone(evt.printdescr || null),
  };
  if (hasData(print)) {
    out.insert('print', print);
  }
}
function privateTable(out, evt) {
  out.insert('private', {
    id: evt.id,
    secret: evt.password || null,
    private_email: evt.email || null,
    private_phone: evt.phone || null,
    private_contact: evt.contact || null,
    show_email: evt.hideemail === 0,
    show_phone: evt.hidephone === 0,
    show_contact: evt.hidecontact === 0,
  });
}
function scheduleTable(out, evt, days) {
  for (const at of days) {
    if (!at.pkid) {
      throw new Error("pkid");
    }
    const scheduled = isScheduled(at);
    assert(scheduled !== undefined);
    out.insert('schedule', {
      id: at.id,
      ymd: at.eventdate,
      is_scheduled: scheduled,
      pkid: at.pkid,
      added: evt.created,
      changed: evt.modified,
      news: at.newsflash || null,
    });
  }
}
function tagTable(out, evt) {
  const tags = {};
  // note: there are 9 rides from 2023 with no audience and no area
  // two of which seem to be tests... dunno what's best for them.
  tags.area = evt.area ? Area.keyToValue(evt.area) : Area.Portland.toString();
  if (!tags.area) {
    const msg = out.note(evt.id, `unknown area ${evt.area}`)
    throw new Error(msg);
  }
  //
  tags.audience = evt.audience ? Audience.keyToValue(evt.audience) : Audience.General.toString();
  if (!tags.audience) {
    const msg = out.note(evt.id, `unknown audience ${evt.audience}`)
    throw new Error(msg);
  }
  // many rides have a null ridelength
  const dist = Distance.keyToValue(evt.ridelength);
  if (dist) {
    tags.distance = dist;
  } else if (evt.ridelength) {
    out.note(evt.id, `unknown ride length ${evt.ridelength}`)
  }
  // false zero or null
  if (!!evt.loopride) {
    tags.loop = "true";
  }
  if (!!evt.safetyplan) {
    tags.safety = "true";
  }
  if (!!evt.highlight) {
    tags.featured = "true";
  }
  for (const key in tags) {
    const value = tags[key];
    // console.log(`tag ${evt.id} ${key} ${value}`);
    out.insert('tag', {
      id: evt.id,
      tag_name: key,
      tag_value: value,
    });
  }
}
function webTable(out, evt) {
  if (evt.weburl || evt.webname) {
    out.insert('web', {
      id: evt.id,
      web_type: 'url',
      web_text: evt.webname || null,
      web_link: evt.weburl,
    });
  }
}
// ---- helpers
function eatNone(str) {
  return str === "none" ? null : str;
}
// does the passed data have an valid values other than 'series'
function hasData(d, ignore = []) {
  const keys = Object.keys(d);
  return keys.find(k => d[k] && k !== 'id' && !ignore.includes(k));
}

// returns either {override} or {ext, num}
function getImageData(id, image) {
  // match 123.jpg or 123-456.jpg
  // excludes uppercase extensions
  // the current 'uploader' always uses lowercase extensions.
  const match = image.match(/^(\d+)(-\d+)?\.([a-z]+)$/);
  if (!match) {
    return getImageOverride(image);
  } else {
    const [ _fullstring, name, dashnum, ext ] = match;
    if (isValidExt(ext)) {
      // loose compare b/c regex returns strings; but the series is a number
      return (name != id) ? 
        getImageOverride(image) : {
          ext, // ex. "png"
          num: dashnum ? parseInt(dashnum.slice(1)) : null,
        };
    }
  }
}
function getImageOverride(image) {
  const baseName = path.basename(image);
  const ext = path.extname(image);
  // there are a couple of files with empty extensions:
  // ex "714." -- lets just drop those.
  const override = ext && ext.length > 1 && baseName;
  return override && { override };
}
// ex. "png"
function isValidExt(ext) {
  // NOTE: this drops a random cfm file;
  const validExts = ['gif', 'png', 'jpg','jpeg','pjpeg', 'pjp', 'jfif'];
  return validExts.includes(ext.toLowerCase());
}
function isScheduled(at) {
  // there are legacy values such as 'E', or 'S' which don't display correctly
  return EventStatus.keyToValue(at.eventstatus);
}

// --------------------
// records output destined for the migration file
class Output {
  tables = {};
  comments = [];

  addTable(name, statement) {
    this.tables[name] = {
      create: statement,
      rows: [],
    }
  }
  insert(name, cols) {
    const t = this.tables[name];
    if (!t) {
      throw new Error(`unknown table ${name}`)
    }
    const row = Object.values(cols).map(Output.formatValue).join("\t");
    t.rows.push(row);
  }
  warn(id, msg) {
    this.comments.push(`SKIPPING: event ${id} ${msg}`);
    return msg;
  }
  note(id, msg) {
    this.comments.push(`note: event ${id} ${msg}`);
    return msg;
  }
  // transform a db value into a mysql escaped form
  // (safe for the text file output)
  static formatValue(v) {
    if (v === undefined) {
      throw new Error('invalid value');
    }
    if (v === null) {
      return "NULL";
    }
    if (typeof(v) !== 'string') {
      return v.toString(); // presumably a number
    }
    // surely there are better ways
    const replaceWhat = [ "\\", "\n", "\t"];
    const replaceWith = [ "\\\\", "\\n", "\\t"];
    return replaceWhat.reduce( (val, el, i) => val.replaceAll(el, replaceWith[i]), v);
  }
}

// --------------------
// boilerplate
async function runTool() {
  return db.initialize("migrate")
    .then(migrate)
    .then(_ => {
      console.log("done");
      // can't use top-level "await" with commonjs modules
      // ( ie. await makeFakeEvents() )
      process.exit()
    });
};
runTool();



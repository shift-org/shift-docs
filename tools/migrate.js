/**
 * migrate from old tables to new tables
 * ex. npm run -w tools sqlite-migrate
 * ex. ./shift compose exec node npm run -w tools mysql-migrate
 *  no such file or directory, open '../services/db/tmp/reorg.sql'
 */
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert");

const db = require("server/core/db");
const { allTables, setupStatements } = require("server/v2/schema");
const dt = require('server/util/dateTime');
const { newSecret } = require("server/util/misc");
const { Area, Audience, Distance, EventStatus, Showable, LocType } = require("server/v2/model/shorthands");

// return map of { tableName: newTable }
// caller writes to disk.
async function migrate() {
  const out = new Output();
  const tableNames = Object.keys(allTables);

  const statements = setupStatements(db);
  tableNames.forEach(name => out.addTable(name));

  const events = await readAllData();
  rewriteExceptions(events);
  buildData(out, events);

  // write migration:
  const mainFile = db.config.type === "sqlite" ? path.join(`../services/db/tmp/reorg.sql`) : "/dev/stdout";

  // use select statements:
  // INSERT INTO Student (id, name, national_id)
  // VALUES (1001, 'John Liu', '123345566'),
  //        (1010, 'Samantha Prabhu', '3217165566');
  let values = "";
  tableNames.forEach(name => {
    const cols = Object.keys(allTables[name]);
    values += `INSERT INTO ${name} (${cols.join(', ')})\nVALUES\n`;
    const rows = out.tables[name].rows
    const data = rows.forEach((row, i) => {
      if (i > 0) {
        values += ",\n";
      }
      values += "(";
      const parts = cols.forEach((col, i) => {
        if (i > 0) {
          values += ",";
        }
        values += formatValue(row[col]);
      });
      values += ")";
    });
    values += ";\n";
  });

  const comments = out.comments.map(c => `-- ${c}`).join("\n");
  const migration = statements.join(';\n') + "\n\n" +
                    values + "\n" +
                    comments;
  fs.writeFileSync(mainFile, migration);

  // alt: use data files for "load data"
  // Object.keys(out.tables).forEach(name => {
  //   const tableFile = path.join(outPath, `${name}.data`);
  //   const rows = out.tables[name].rows;
  //   const tableData = rows.join(`\n`);
  //   fs.writeFileSync(tableFile, tableData);
  // });
}

// exceptions were copies of the event data for a particular day.
// there's only about 50 of them
// the new db will treat those as completely separate events.
// the copies of those will be given the password of the original
// to relate the two events.
function rewriteExceptions(events) {
  for (const id in events) {
    const evt = events[id];
    evt.allDays.forEach(at => {
      if (at.eventstatus === 'E') {
        const og = events[at.id];
        const cp = events[at.exceptionid];
        if (!cp) {
          // there's exactly one exception which doesn't have an event:
          // 2751 -- maybe the event got deleted?
          at.eventstatus = 'A';
        } else {
          // most of these don't have passwords; not sure why.
          // (too old?) give them one to be able to relate things.
          if (!og.password) {
            og.password = newSecret();
          }
          cp.password = og.password;
          at.id = at.exceptionid;
          at.eventstatus = 'A';
        }
      }
    });
  }
}

// review:
// "A" means the administrator has approved it for inclusion the the printed Pedalpalooza calendar,
// "E" means the administrator has decided to exclude it from the printed calendar,
// "I" means it needs to be inspected,
// "R" means the event organizer did change it in response to that message.
//  "S" means a message has been sent to the event organizer asking them to change it,


function buildData(out, events) {
  for (const id in events) {
    const evt = events[id];
    const invalid = evt.allDays.length == 1 && evt.allDays[0].pkid === null;
    if (invalid) {
      // TBD: we could keep these i suppose.
      // a series ith no days.
      out.note(evt.id, `no had days. review:${evt.review} title: "${evt.title}"`);
    } else {
      const days = evt.allDays.filter(at => isScheduled(at) !== undefined);
      const skips = evt.allDays.filter(at => ['S', 'D'].includes(at.eventstatus)).length;

      const diff = evt.allDays.length - days.length;
      if (diff > 0 && diff !== skips) {
      evt.allDays.forEach(at => {
        console.log(at);
      });
       const err = out.warn(evt.id, `REMOVED ${diff} days; ${skips} skipped.`);
       throw new Error(err);
      }
      seriesTable(out, evt);
      imageTable(out, evt);
      locTable(out, evt);
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
    organizer: evt.name,
    start_time: evt.eventtime,
    ride_duration: evt.eventduration,
    tiny_title: eatNone((munged === dbtiny) ? null : dbtiny),
    summary: eatNone(evt.printdescr || null),
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
      // there are a few files like "6461." not sure what to think about that.
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
function privateTable(out, evt) {
  const [showEmail, showPhone, showContact] = ["email", "phone", "contact"].map(field => {
    const visible = evt[`hide${field}`] === 0; // exactly zero
    const printable = !!evt[`print${field}`]; // false if never set (ie. null)
    return Showable.combine(visible, printable);
  });
  out.insert('private', {
    id: evt.id,
    secret: evt.password || null,
    private_email: evt.email || null,
    private_phone: evt.phone || null,
    private_contact: evt.contact || null,
    show_email: showEmail.value,
    show_phone: showPhone.value,
    show_contact: showContact.value,
  });
}
function scheduleTable(out, evt, days) {
  for (const at of days) {
    if (!at.pkid) {
      throw new Error("pkid");
    }
    const scheduled = isScheduled(at);
    assert(scheduled !== undefined);
    if (evt.modified < evt.created) {
      const swap = evt.created;
      evt.created = evt.modified;
      evt.modified = swap;
    }
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
    // dunno why but series 7283 has a length of "12"
    // nothing else is like that.
    if (evt.ridelength == 12) {
      evt.ridelength = '8-15';
    } else {
     out.note(evt.id, `unknown ride length ${evt.ridelength}`);
    }
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
    const values = tags[key];
    // console.log(`tag ${evt.id} ${key} ${values}`);
    out.insert('tag', {
      id: evt.id,
      tag_type: key,
      tag_value: values,
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
      printable: !!evt.printweburl,  // false if never set ( null )
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
  // the complete set of event status are:
  // A, C, D, E, S. none were null.
  // we only care about "active" and "cancelled"
  // exclusions get rewritten into regular events.
  // we dont need to remember deleted data
  // skips were an artifact of scheduling.
  return EventStatus.keyToValue(at.eventstatus);
}

// --------------------
// records output destined for the migration file
class Output {
  tables = {};
  comments = [];

  addTable(name) {
    this.tables[name] = {
      rows: [],
    }
  }
  insert(name, cols) {
    const t = this.tables[name];
    if (!t) {
      throw new Error(`unknown table ${name}`)
    }
    t.rows.push(cols);
  }
  warn(id, msg) {
    this.comments.push(`WARNING: event ${id} ${msg}`);
    return msg;
  }
  note(id, msg) {
    this.comments.push(`note: event ${id} ${msg}`);
    return msg;
  }
}

// transform a db values into a mysql escaped form
// (safe for the text file output)
function formatValue(v) {
  if (v === undefined) {
    throw new Error('invalid values');
  }
  if (v === null) {
    return "NULL";
  }
  if (v instanceof Date) {
    const timestamp = dt.toTimestamp(v);
    return `'${timestamp}'`;
  }
  if (typeof(v) !== 'string') {
    return v.toString(); // presumably a number
  }
  // surely there are better ways
  // note: both sqlite and mysql support single-quoted string literals
  // with any single-quotes doubled up to indicate escaped single-quotes.
  const replaceWhat = ["\r", "\\", "\n", "\t", "'"];
  const replaceWith = ["", "\\\\", "\\n", "\\t", "''"];
  const escaped = replaceWhat.reduce( (val, el, i) => val.replaceAll(el, replaceWith[i]), v);
  // quote the escaped string
  return `'${escaped}'`
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
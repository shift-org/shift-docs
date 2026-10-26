
 /**
 * Generate a mysql migration file to move from old tables to new tables.
 * WARNING: this drops all data from the new table schema.
 *
 * Example with sqlite:
 *  ex. > npm run -w tools sqlite-migrate
 *
 * Example of running the script inside the docker container:
 *  ex. > ./shift compose exec node npm run --silent -w tools mysql-migrate > reorg.sql
 *  > ./shift mysql-pipe < reorg.sql
 *
 * Example via external communication with docker:
 * > npm run --silent -w tools mysql-migrate -- -db=mysql:54166  > reorg.sql
 *
 *  note, the first few lines may sometimes contain stray commandline logging.
 */
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert");

const db = require('shift-docs/db'); //
const { allTables, setupStatements } = require('shift-docs/schema');
const dt = require('shift-docs/util/dateTime');
const { newSecret } = require('shift-docs/util/misc');
const { Area, Audience, Distance, EventStatus, Showable, LocType } = require('shift-docs/models/newConst');

// return map of { tableName: newTable }
// caller writes to disk.
async function migrate(outFile = "/dev/stdout") {
  const out = new Output();
  const tableNames = Object.keys(allTables);

  const statements = setupStatements(db);
  tableNames.forEach(name => out.addTable(name));

  const events = await readAllData(); // an object with id keys
  rewriteExceptions(out, events);
  buildData(out, events);

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
        values += formatValue(col, row[col]);
      });
      values += ")";
    });
    values += ";\n";
  });

  const comments = out.comments.map(c => `-- ${c}`).join("\n");
  const migration = statements.join('\n') + "\n\n" +
                    values + "\n" +
                    comments;
  fs.writeFileSync(outFile, migration);

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
function rewriteExceptions(out, events) {
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
          out.note(at.id, `setting E(xception) ${at.exceptionid} to A(ctive)`);

          // most of these don't have passwords; not sure why.
          // (too old maybe?) give them one to be able to relate things.
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
// "S" means a message has been sent to the event organizer asking them to change it,
function buildData(out, events) {
  for (const id in events) {
    const evt = events[id];
    const invalid = evt.allDays.length == 1 && evt.allDays[0].pkid === null;
    if (invalid) {
      // TBD: keep series with no days?
      out.note(evt.id, `skipping because it no had scheduled days. review: ${evt.review} title: "${evt.title}"`);
    } else {
      const days = evt.allDays.filter(at => isScheduled(at) !== undefined);
      const skips = evt.allDays.filter(at => ['S', 'D'].includes(at.eventstatus)).length;

      const diff = evt.allDays.length - days.length;
      if (diff > 0 && diff !== skips) {
        evt.allDays.forEach(at => console.log(at));
        out.error(evt.id, `REMOVED ${diff} days; ${skips} skipped.`);
      }
      reorderTimes(evt);
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
    // add a copy opf it as a day as well, or add it to other days
    // ( this is a bit overkill: we only need the caldaily fields... oh well. )
    evt.allDays = (evt.allDays || []).concat(Object.assign({}, curr));
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

  // munge and don't store if we can generate it.
  const munged = nullString(evt.title, 24);
  const dbtiny = nullString(evt.tinytitle);
  const summary = nullString(evt.printdescr);

  // a few rides have the text "none" for the tiny title or summary.
  function eatNone(str) {
    return str === "none" ? null : str;
  }

  out.insert('cal_series', {
    id: evt.id,
    published,
    title: evt.title,
    organizer: evt.name,
    start_time: evt.eventtime,
    scheduled_duration: evt.eventduration,
    tiny_title: eatNone((munged === dbtiny) ? null : dbtiny),
    summary: eatNone(summary),
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
      out.note(evt.id, `invalid image ${image}`)
    } else {
      out.insert('cal_image', {
        id: evt.id,
        img_version: img.num || 0, // should we allow null here? i dunno.
        img_ext: img.override ? null : img.ext,
        img_override: img.override ? img.override : null,
      });
    }
  }
}

function locTable(out, evt) {
  out.insert('cal_location', {
    id: evt.id,
    loc_type: LocType.Start,
    place_name: evt.locname,
    // only supported for start right now.
    address: evt.address,
    place_info: evt.locdetails,
    time_info: evt.timedetails,
  });

  // only write the loc end if needed
  const locEnd = nullString(evt.locend);
  if (locEnd) {
    out.insert('cal_location', {
      id: evt.id,
      loc_type: LocType.Finish,
      place_name: locEnd,
      // these fields only supported for loc start right now.
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
  const email = nullString(evt.email);
  if (email === null) {
    // ride 732, joe the plubmer, has a null email
    out.note(evt.id, `has a null email`);
  }
  out.insert('cal_private', {
    id: evt.id,
    secret: nullString(evt.password),
    private_email: email,
    private_phone: nullString(evt.phone),
    private_contact: nullString(evt.contact),
    show_email: showEmail.value,
    show_phone: showPhone.value,
    show_contact: showContact.value,
  });
}
// created and modified times can be a little funky.
function reorderTimes(evt) {
  const { created, modified } = evt;
  // console.log("created", dt.icalFormat(created), "modified", dt.icalFormat(modified));
  if (dt.convert(modified).isBefore(dt.convert(created))) {
    evt.created = modified;
    evt.modified = created;
  }
}
function scheduleTable(out, evt, days) {
  for (const at of days) {
    if (!at.pkid) {
      out.error(evt.id, "missing pkid");
    }
    const scheduled = isScheduled(at);
    assert(scheduled !== undefined);
    out.insert('cal_schedule', {
      id: at.id,
      ymd: at.eventdate,
      is_scheduled: scheduled,
      pkid: at.pkid,
      added: evt.created,
      changed: evt.modified,
      news: nullString(at.newsflash),
    });
  }
}
function tagTable(out, evt) {
  const tags = {};
  // note: there are 9 rides from 2023 with no audience and no area
  // two of which seem to be tests... dunno what's best for them.
  tags.area = evt.area ? Area.findShorthand(evt.area)?.value : Area.Portland.toString();
  if (!tags.area) {
    out.error(evt.id, `unknown area ${evt.area}`);
  }
  //
  tags.audience = evt.audience ? Audience.findShorthand(evt.audience)?.value : Audience.General.toString();
  if (!tags.audience) {
    out.error(evt.id, `unknown audience ${evt.audience}`);
  }
  // many rides have a null ridelength
  const dist = Distance.findShorthand(evt.ridelength)?.value;
  if (dist) {
    tags.distance = dist;
  } else if (evt.ridelength) {
    // dunno why but series 7283 has a length of "12"
    // nothing else is like that.
    if (evt.ridelength == 12) {
      const forcedValue = '8-15';
      out.note(evt.id, `rewriting ride length '${evt.ridelength}' as '${forcedValue}'`);
      evt.ridelength = forcedValue;
    } else {
      out.error(evt.id, `unknown ride length '${evt.ridelength}'`);
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
    out.insert('cal_tag', {
      id: evt.id,
      tag_type: key,
      tag_value: values,
    });
  }
}
function webTable(out, evt) {
  const name = nullString(evt.webname);
  const url = nullString(evt.weburl);
  if (name || url) {
    const visible = true;
    const printable = !!evt.printweburl; // false if never set ( null )
    const show = Showable.combine(visible, printable);
    out.insert('cal_web', {
      id: evt.id,
      web_type: 'url',
      web_text: name,
      web_link: url,
      show_weburl: show.value,
    });
  }
}
// ---- helpers
// turn null, or empty strings into null
// ( where empty means: only spaces or no text at all )
// clip optionally caps the string to the passed number of characters
function nullString(v, clip) {
  return (v || "").substring(0, clip).trim() || null;
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
  return EventStatus.findShorthand(at.eventstatus)?.value;
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
  note(id, msg) {
    this.comments.push(`note: event ${id} ${msg}`);
    return msg;
  }
  warn(id, msg) {
    this.comments.push(`WARNING: event ${id} ${msg}`);
    return msg;
  }
  error(id, msg) {
    const comment = `ERROR: event ${id} ${msg}`;
    this.comments.push(comment);
    throw new Error(comment);
  }
}

// transform a db values into a mysql escaped form
// (safe for the text file output)
function formatValue(columnName, v) {
  if (v === undefined) {
    throw new Error('invalid values');
  }
  if (v === null) {
    return "NULL";
  }
  if (v instanceof Date) {
    if (columnName === 'ymd') {
      const ymd = dt.toYMDString(v);
      return `'${ymd}'`;
    } else {
      const timestamp = dt.toTimestamp(v);
      return `'${timestamp}'`;
    }
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
      // can't use top-level "await" with commonjs modules
      // ( ie. await makeFakeEvents() )
      process.exit()
    });
};
runTool();
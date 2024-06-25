/**
 * read a mysql dump into a sqlite db.
 * exceptions if it cant find the file.
 * paths are relative to the root shift-docs directory
 *
 * ex. npm run -w tools import-mysql --in="/Users/ionous/Downloads/prod.mysql" --out="./bin/test.db"
 */
const path = require("path");
const fs = require('fs');
const { faker } = require('@faker-js/faker');
const config = require("shift-docs/config");
const knex = require('knex');
const tables = require("shift-docs/models/tables"); // for sqlite 3
const process = require('process');

// ----------------------------------------------------------------
// command line arguments
const args = {
  // --in ./prod.mysql
  // paths are relative to the root shift-docs directory
  in : process.env.npm_config_in || "<missing in file>",
  // --out ./sqlite.db
  // if not specified, generates a random file in the bin directory.
  out: process.env.npm_config_out ||
      path.join("./bin/", faker.system.commonFileName('db'))
};

// ----------------------------------------------------------------
// the main import routine
async function importMysql() {
  const inFile = path.resolve(config.appPath, "..", args.in);
  if (!fs.existsSync(inFile)) {
    console.error(`can't find file to import ${inFile}`);
    return;
  }
  const outFile= path.resolve(config.appPath, "..", args.out);
  if (fs.existsSync(outFile)) {
    console.error(`this wont overwrite existing files, and ${outFile} already exists`);
    return;
  }
  console.log("importing from", inFile);
  console.log("exporting to", outFile);
  const q = await knex({
    client: "sqlite3",
    connection: outFile,
    useNullAsDefault: true,
  });

  // make sure the tables exist in the output
  // alt: could use the dump to create the tables
  console.log("creating tables...");
  await tables.create(q, false);

  console.log("importing data...");
  await importDump(q, inFile);

  console.log("anonymizing data...");
  await q.transaction(anonymize);
}

importMysql().catch(e => {
  console.error(e);
}).finally(_=> {
   process.exit();
});

// ----------------------------------------------------------------
// support functions:
// ----------------------------------------------------------------


// ----------------------------------------------------------------
async function importDump(q, inFile) {
  const file = await fs.promises.open(inFile);
  for await (const line of file.readLines()) {
    await importLine(q, "calevent", line) ||
          importLine(q, "caldaily", line);
  }
}

// ----------------------------------------------------------------
async function anonymize(q) {
  return await q("calevent").select('id', 'email', 'phone', 'contact').then(allEvents=> {
    const ps = allEvents.map(evt => {
      // if there isn't an email, etc. specified; keep the blank entry.
      return q("calevent").where({ id: evt.id }).update({
          email: evt.email ? faker.internet.email() : evt.email,
          phone: evt.phone ? faker.phone.number() : evt.phone,
          contact: evt.contact ? faker.person.fullName() : evt.contact,
        })
    });
    return Promise.all(ps);
  });
}

// ----------------------------------------------------------------
// read lines from the dump that insert into the db
async function importLine(q, name, line) {
  const ins = `INSERT INTO \`${name}\``;
  if (line.startsWith(ins)) {
    line = line.substring(ins.length);
    const text = q.raw(name +  descape(line))
    return q.insert(text);
   }
}

// slow version that attempts, if somewhat incorrectly,
// to separate each chunk of values into a separate insert;
// useful for debugging.
async function xinsert(q, name, line) {
  const start = `INSERT INTO \`${name}\` VALUES `;
  if (line.startsWith(start)) {
    line = line.substring(start.length);
    const test = line.split("),(");
    for (let i = 0; i< test.length; i++) {
      const text = q.raw(name + " values " +
      (!test[i].startsWith( "(")? "(": "" ) +
        descape(test[i]) +
      (!test[i].endsWith( ")")? ")": "" ));
      await q.insert(text);
   }
  }
}

// ----------------------------------------------------------------
// replace pairs of an actual backslash and other character
// with the single character that they represent.
// ( mysql takes some liberties with the standard )
//
// note: some of these are, i think, impossible for shift
// and since i dont know what they'd be replaced by, i've left them as is.
// https://dev.mysql.com/doc/refman/8.0/en/string-literals.html#character-escape-sequences
function descape(str) {
  // \0 leave                 // \0   An ASCII NUL (X'00') character
  str = str.replaceAll("\\'", "''")     // \'   A single quote (') character
  str = str.replaceAll('\\"', '"')     // \"   A double quote (") character
  //  \b leave                // \b   A backspace character
  str = str.replaceAll('\\r\\n', "\n") // replace a windows newline with a single real newline
  str = str.replaceAll('\\n', "\n")    // \n   A newline (linefeed) character
  // \r leave                 // \r   A carriage return character
  str = str.replaceAll('\\t', "\t")    // \t   A tab character
  // \Z leave                 // \Z   ASCII 26 (Control+Z); END-OF-FILE
  str = str.replaceAll('\\\\', "\\")   // \\   A backslash (\) character

  // i believe these only get escaped within select statements:
  // \%  see note following the table
  // \_   see note following the table
  return str;
}

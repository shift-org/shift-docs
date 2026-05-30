const TableMaker = require('server/util/tableMaker');

// some ugliness to allow declaration of all the table and column names
const make = TableMaker.prototype;
const allTables = {
  series: {
    id: make.primaryKey,
    published: make.integer, // a counter of the number of times published
    title: [make.string, {width: 256}],
    organizer: [make.string, {width: 256}],
    start_time: [make.string, {width: 10, required: true}],
    ride_duration: make.integer,  // in minutes
    tiny_title: [make.string, {width: 50}],
    summary: [make.string, {width: 812} ], // was: printdescr
    details: [make.string, {width: 6500}], // there's a few in the 6k range
    created: make.createdTime,
    modified: make.modifiedTime,
  },
  image: {
    id: make.dependentKey,
    img_version: make.integer, // often null for old data where there is no version number.
    img_ext: [make.string, {width: 8} ], // ex. "png" (lowercase, no leading dot)
    img_override: [make.string, {width: 64}],
    //img_alt: [string, 512] -- future
  },
  location: {
    id: [make.dependentKey, 'loc_type'],
    loc_type: [make.string, {width: 32, required: true}],
    place_name: [make.string, {width: 256}],
    address: [make.string, {width: 256}],
    place_info: [make.string, {width: 256}],
    time_info: [make.string, {width: 256}],
  },
  private: {
    id: make.dependentKey,
    // passwords are generally 33 chars (32 plus the null terminator. )
    // max 48 here for ... padding?
    secret: [make.string, {width: 48}],
    private_email: [make.string, {width: 256}],
    // some people have a short description here in phone
    private_phone: [make.string, {width: 64} ],
    private_contact: [make.string, {width:  256}],
    // one of the calConst.Showable(s)
    show_email: [make.string, {width:  12}],
    show_phone: [make.string, {width:  12}],
    show_contact: [make.string, {width:  12}],
  },
  schedule: {
    // ideally id + ymd would be the primary key
    id: [make.uniqueIndex, 'ymd'],
    ymd: [make.string, {width: 12, required: true}],
    // defaults to 0, and can be set to null
    is_scheduled: [make.boolflag, {default: 0, required: false}],
    // unfortunately, for backwards compat, pkid has to be the key
    pkid: make.primaryKey,
    // create/modified times for the scheduled days
    // uses different names than the series to avoid query conflicts
    added: make.createdTime,
    changed: make.modifiedTime,
    news: [make.string, {width: 1024}],
  },
  tag: {
    id: [make.dependentKey, 'tag_type'],
    tag_type: [make.string, {width: 32, required: true}],
    tag_value: [make.string, {width: 128, required: true}],
  },
  web: {
    id: [make.dependentKey, 'web_type'],
    web_type: [make.string, {width: 32, required: true}],
    web_text: [make.string, {width: 256}],
    web_link: [make.string, {width: 512}],
    printable: make.boolflag,
  },
};

// certain tables have extra keys
// todo: a nicer way to handle this?
const extraKeys = {
  location: "loc_type",
  tag: "tag_type",
  web: "web_type",
};

module.exports = { allTables, extraKeys };
/**
 * geo coding experiment
 * https://osmfoundation.org/wiki/Licence/Attribution_Guidelines
 *
 * ex. npm run -w tools geo --in="Wilshire Park. Portland, OR."
 *     npm run -w tools geo --street="915 SE Hawthorne Blvd"
 *     npm run -w tools geo --db="../bin/prodlike.db" --date="2024-06-01" --out="../out.sql"
 */
const fsp= require('fs').promises;
const https = require('node:https');
const path = require('node:path');
const knex = require('knex');           // the raw knex, and not the shift-docs wrapper
const sqlstring = require('sqlstring'); // part of mysql/2; note: "sql-escape-string" works better for reimport into sqlite ( because sqlstring assumes backslash escaping; which std sql doesnt allow )
const dt = require("shift-docs/util/dateTime");
const nunjucks = require("shift-docs/nunjucks");
const { Area, Review } = require('shift-docs/models/calConst');

// https://nominatim.org/release-docs/develop/api/Overview/
const nominatim = {
  // search: "https://nominatim.openstreetmap.org/search?",
  search: "http://localhost:8080/search?",
};

// ----------------------------------------------------------------
// command line arguments
const args = {
  db : process.env.npm_config_db,
  date:process.env.npm_config_date,
  out:process.env.npm_config_out,

  // --in "search string"
  // paths are relative to the root shift-docs directory
  in : process.env.npm_config_in,
  // --amenity "search string"
  amenity : process.env.npm_config_amenity,
  // --street "search string"
  street : process.env.npm_config_street,
};

// the tool function:
async function geoSearch()  {
  if (args.db) {
    await geoImport(args.db, args.out, args.date);
  } else if (args.in) {
    await cmdQuery({
      q: safe(args.in)
    });
  } else {
    await cmdQuery({
      // structured query:
      amenity: safe(args.amenity), //   name and/or type of POI
      street: safe(args.street), //  housenumber and streetname
      "city": "portland",
      "state": "or",
      "country": "us"
      // county
      // postalcode
    });
  }
}

// ----------------------------------------------------------------
// import functions:
async function geoImport(inFile, outFile, date= "2024-06-01") {
  // local prefix is the root json file when running with npm
  const inPath= path.join(process.env.npm_config_local_prefix, inFile);
  const outPath= path.join(process.env.npm_config_local_prefix, outFile);
  console.log("importing from", inPath);
  console.log("writing to", outPath);
  //
  const q = await knex({
    client: "sqlite3",
    connection: inPath,
    useNullAsDefault: true,
  });
  // uses a raw query because i can't for the life of me figure out how to
  // specify the distinct without confusing knex about which table "id" comes from.
  //
  // skips deleted rides... and washingtonians
  // note: if washington is added "area" will likely
  // have to be incorporated into most queries
  // ex. +". Portland, OR."
  const events= await q.raw(`
    select distinct id, title, locname, address
    from calevent
    join caldaily
    using (id)
    where eventdate >= "${date}"
    and review != "${Review.Excluded}"
    and area != "${Area.Vancouver}"
    order by id
    `);
  console.log(`**** ${events.length} ****`);
  // loop manually because we're using "await"
  let successCount = 0; // the number of successful queries
  for (let i=0; i < events.length; ++i) {
    const evt = events[i];
    let res = await importQuery(evt.address);
    if (!res) {
      res = await importQuery(evt.locname);
    }
    const str = res ? sqlstring.escape( compact(res) ) : "";
    if (str.length > 225) {
      console.error("too long:", str);
      throw new Error("str too long");
    }
    evt.str= str;
    evt.count = successCount;
    if (res) {
      ++successCount;
    }
    events[i]= evt; // rewrite
    process.stdout.write(".");
  }
  console.log(`\n**** ${successCount} ****`);
  var res= nunjucks.renderString(sqlTemplate, {events});
  return await fsp.writeFile(outPath, res);
}

// returns an object or false
async function importQuery(words) {
  if (!words) {
    return false;
  }
  const qs= makeQueries({q:safe(words)}, searchParams);
  const url = nominatim.search + qs.join("&");
  // console.log("requesting", url);
  const res = await fetch(url, { headers: searchHeaders });
  if (!res.ok) {
    console.error(res.status, res.body);
    throw new Error(res.status);
  }
  // gives us an array of one result ( or none )
  const places = await res.json();
  return places.length ? chopData(places[0]) : false;
}

// we have to fit into `external` varchar(250) DEFAULT NULL
function chopData(obj) {
  const { lat: y, lon: x, display_name:n } = obj;
  if (x === undefined || y === undefined) {
    console.error("missing coordinates", pretty(obj));
  } else if (n === undefined) {
    console.error("missing display_name", pretty(obj));
  } else {
    return { x,y,n };
  }
}
// ----------------------------------------------------------------
// search functions:

async function cmdQuery(query) {
  const qs= makeQueries(query, searchParams);
  const url = nominatim.search + qs.join("&");
  console.log("requesting:", url);
  const res = await fetch(url, { headers: searchHeaders  });
  if (!res.ok) {
    console.error(res.status, res.body);
  } else {
    const js = await res.json(); // a promise of a pojo.
    console.log( pretty(js) );
  }
}

const searchHeaders =  {
  // a custom user-agent is required by the api to identify the user.
  'User-Agent': 'Shift2Bikes/1.0 (https://www.shift2bikes.org/)',
  // tbd: maybe pull this from the user's request?
  'Accept-Language': 'en-US,en;q=0.9',
};

const searchParams = {
    format: "jsonv2",    // -- one of: xml, json, jsonv2, geojson, geocodejson
    // json_callback:    // -- for jsonp: a function name
    limit:  "1",         // -- number of results: max 40
    // addressdetails:   // -- (0,1): address breakdown; content depend on 'format'
    // extratags:        // -- (0,1): info supplied by users: ex. wikipedia link, opening hours, etc.
    // namedetails:      // -- (0,1): other names for the locations: language variants, etc.
    // accept-language:  // -- the default uses the header 'Accept-Language'
    countrycodes: "us",  // -- filter specific comma-separated countries.
    // layer:            // -- filter comma-separated results
    // featureType:      // -- filter when layer includes 'address' either: country, state, city, or settlement
    // exclude_place_ids:// -- reject specific earlier results
    // viewbox:          // -- a search area <x1>,<y1>,<x2>,<y2> in longitude
    // bounded:          // -- modify 'viewbox'. 0: boost results in the box; 1: filter to only the box.
    // polygon_*:        // -- various options to control the returned geometry (if any)
    email: "bikecal@shift2bikes.org", // -- "If you are making large numbers of request please include an appropriate email address to identify your requests."
    // dedupe:           // -- (1,0): filter duplicate entries representing the same location.
    // debug:            // -- (0,1): forces html output; includes data on Nominatim's "search loop" and SQL queries.
  };

// ----------------------------------------------------------------
// support functions:

function pretty(js) {
  return JSON.stringify(js, null, " ");
}
function compact(js) {
  return JSON.stringify(js);
}

// uri encode the passed string, but not if its undefined; otherwise you get "undefined". ugh.
function safe(str) {
  return str && encodeURIComponent(str);
}

// given a list of query objects, return a single array of "key=value" strings
function makeQueries(...listOfParams) {
  return listOfParams.reduce((sum, params) => sum.concat(makeQuery(params)), []);
}

// give a single query object, return an array of "key=value" strings
function makeQuery(params) {
  return Object.keys(params)
    .filter((key) => params[key]) // remove any blank entries
    .map(key=> key + "=" + params[key]);
}

// ----------------------------------------------------------------
// { evt, str, count };
const sqlTemplate =
`WITH geo(id, _ext) AS
(
{%- for evt in events -%}
  {%- if evt.str %}
  -- OK: {{ evt.title | safe }}
    {#- add separator before each new valid entry -#}
    {%- if evt.count %}
  UNION ALL{%- endif %}
  SELECT '{{ evt.id }}', {{ evt.str | safe }}
  {%- else %}
  -- MISSING: {{ evt.id }}, {{ evt.title | safe }}
  --   location: {{ evt.locname | safe }}
  --   address:  {{ evt.address | safe }}
  {%- endif -%}
{% endfor -%}
)
update calevent
set external = _ext
from geo
where geo.id = calevent.id;
`;

// this didnt quite work...
const backupSqlTemplate =
`INSERT INTO calevent (id, external)
VALUES
{%- for evt in events -%}
  {%- if evt.str -%}
    {#- add a comma before each new valid entry -#}
    {%- if evt.count %},{%- endif %}
  -- OK: {{ evt.id }}, {{ evt.title | safe }}
    ( '{{ evt.id }}', {{ evt.str | safe }} )
  {%- else %}
  -- MISSING: {{ evt.id }}, {{ evt.title | safe }}
  --   location: {{ evt.locname | safe }}
  --   address:  {{ evt.address | safe }}
  {%- endif -%}
{% endfor -%}
ON DUPLICATE KEY
UPDATE external = VALUES(external);
`;

// ----------------------------------------------------------------
// run the tool
geoSearch().catch(e => {
  console.error(e);
}).finally(_=> {
   process.exit();
});

// ----------------
// layers
// the events page says "Provide either a street address or cross streets."
// but lots of people give the names of parks, etc.
// ----------------
// - address: points with house numbers, streets, places (suburbs, villages, cities, states etc.)
// - poi: restaurants, shops, hotels but also recycling bins, guideposts, and benches.
// - railway: only very few railway features are imported into the database.
// - natural: rivers, lakes and mountains
// - manmade: a catch-all for other features.
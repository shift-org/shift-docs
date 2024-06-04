/**
 * geo coding experiment
 * https://osmfoundation.org/wiki/Licence/Attribution_Guidelines
 *
 * ex. npm run -w tools geo --q="Wilshire Park, Portland OR"
 *     npm run -w tools geo --street="915 SE Hawthorne Blvd"
 */
const https = require('node:https');

// https://nominatim.org/release-docs/develop/api/Overview/
const nominatim = {
  search: "https://nominatim.openstreetmap.org/search?",
};

// ----------------------------------------------------------------
// command line arguments
const args = {
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
  const query=  args.in? {
    // free form query:
    q: safe(args.in),
  } : {
    // structured query:
    amenity: safe(args.amenity), //   name and/or type of POI
    street: safe(args.street), //  housenumber and streetname
    "city": "portland",
    "state": "or",
    "country": "us"
    // county
    // postalcode
  };
  const params = {
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
  const qs= makeQueries(query,params);
  const url = nominatim.search + qs.join("&");
  console.log("requesting:", url);

  const res = await fetch(url, {
    headers: {
      // a custom user-agent is required by the api to identify the user.
      'User-Agent': 'Shift2Bikes/1.0 (https://www.shift2bikes.org/)',
      // tbd: maybe pull this from the user's request?
      'Accept-Language': 'en-US,en;q=0.9',
    }
  });
  console.log(res.status);
  if (!res.ok) {
    console.warn(res.body);
  } else {
    const json = await res.json(); // a promise of a pojo.
    console.log( JSON.stringify(json, null, " ") );
  }
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
const API_BASE_URL = window.location.origin;
// can be used to point to production data for local testing
// todo: make this env configurable instead?
// const API_BASE_URL = "https://api.shift2bikes.org";

const API_VERSION = '3';

class Endpoint {
  constructor(endpoint) {
    this.endpoint = endpoint;
  }

  Build(pairs={}) {
    const url = new URL(this.endpoint, API_BASE_URL);
    for (const [key, value] of Object.entries(pairs)) {
      if (value) {
        url.searchParams.set(key, value);
      }
    }
    return url.toString();
  }
}

// export an object with the following keys:
export default {
  VERSION: API_VERSION,
  
  DeleteEvent: new Endpoint('/api/delete_event.php'),
  Events:  new Endpoint('/api/events.php'),
  Ics: new Endpoint('/api/ics.php'),
  Manage: new Endpoint('/api/manage_event.php'),
  Retrieve: new Endpoint('/api/retrieve_event.php'),
  Search: new Endpoint(`/api/search.php`),

  HEADERS: {
    'Accept': 'application/json',
    'Api-Version': API_VERSION
  },
};
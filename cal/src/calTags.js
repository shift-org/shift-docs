/**
 * icon related code
 * ported from the jquery helpers.js
 */
import icons from './icons.js';

class Tag {
  constructor(key, text, desc, icon) {
    this.key = key;
    this.text = text;
    this.desc = desc || text; // TODO: where does text appear
    this.icon = icon || icons[text.toLowerCase()];
  }
}

function arrayToObject(...args) {
  let res = args.reduce((obj, a) => { 
    obj[a.key] = a;
    return obj;
  }, {});
  return res;
}

const Areas = arrayToObject(
  new Tag(
    'P' , 'Portland',
  ),
  new Tag(
    'V' , 'Vancouver', 
  ),
  new Tag(
     'W' , 'Westside',
  ),
  new Tag(
    'E' , 'East Portland'
  ),
  new Tag(
    'C' , 'Clackamas', 
  )
); 

const Audiences = arrayToObject(
  new Tag(
    'G', 'General Audience',
    'For adults, but kids welcome'
  ),
  new Tag(
    'F', 'Family Friendly',
    'Adults bring children',
    icons.familyFriendly
  ),
  new Tag(
    'A', '21+ Only', 
    'Adults only',
    icons.adultsOnly
  )
);

export default {
  buildEventTags(evt) {
    const DEFAULT_AREA = 'P';
    const DEFAULT_AUDIENCE = 'G';

    const a = Areas[evt.area || DEFAULT_AREA];
    const u = Audiences[evt.audience || DEFAULT_AUDIENCE];
    const tags = {};
    if (evt.cancelled) {
      tags.cancelled = {
        short: 'cancelled',
        text: 'Cancelled',
        icon: icons.cancelled
      };
    } else {
      if (u.key !== DEFAULT_AUDIENCE) {
        tags.audience = {
          short: u.key.toLowerCase(), // ex. 'g'      
          text: u.text,
          icon: u.icon,
        };
      }
      if (a.key !== DEFAULT_AREA) {
        tags.area = {
          short: a.key.toLowerCase(), // ex. 'p'
          text: a.text,
          icon: a.icon,
        };
      }
      if (evt.safetyplan) {
        tags.safety = {
          short: evt.safetyplan ? "yes" : "no",
          text: evt.safetyplan ? "Safety Plan" : "No COVID plan",
          icon: icons.safetyPlan,
          link: "/pages/public-health/#safety-plan"
        };
      }
    }
    return Object.keys(tags).length ? tags : null;
  }
}

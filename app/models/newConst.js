//
// Common values used by the calendar.
//
const { Shorthand } = require('shift-docs/util/shorthand.js');

// example usage:
// Area.Portland.key   = "P"        - sent b/t client and server.
// Area.Portland.value = "Portland" - stored in the db.
// Area.Portland.label = "Portland" - displayed to the user ( and for logging. )
class Area {
  // key is first letter; the first word is both the value and label.
  static Portland  = Shorthand.Enum('Portland');
  static Clackamas = Shorthand.Enum('Clackamas');
  static Eastside  = Shorthand.Enum('Eastside');
  static Vancouver = Shorthand.Enum('Vancouver');
  static Westside  = Shorthand.Enum('Westside');

  // ex. transform 'P' into the Portland Shorthand object.
  static findShorthand(key) { return Shorthand.findShorthand(Area, key); }
}

class Audience {
  // key is first letter; value is the first word; finally, the label.
  static General = Shorthand.Enum('General', "General - For adults, but kids welcome");
  static Family  = Shorthand.Enum('Family', "Family Friendly - Adults bring children");
  static Adult   = Shorthand.Enum('Adult', "21+ Only - Adults only");

  // ex. transform 'G' into the General Shorthand object.
  static findShorthand(key) { return Shorthand.findShorthand(Audience, key); }
}

// the status of a single instance of an event on a given day.
class EventStatus {
  // key, value, label.
  static Active    = new Shorthand('A', 1, 'Active');
  static Cancelled = new Shorthand('C', 0, 'Cancelled');
  static Delisted  = new Shorthand('D', null, 'Delisted');

  // transform 'A', 'C', 'D' into the Active, Cancelled, Delisted Shorthand object.
  static findShorthand(key) { return Shorthand.findShorthand(EventStatus, key); }
}

// an array of common ride distances
const Distances = [
  // key, value. label.
  new Shorthand('--', null, 'Unspecified'),

  // the key and value are the same, followed by the label.
  new Shorthand('0-3', '0-3 miles'),
  new Shorthand('3-8', '3-8 miles'),
  new Shorthand('8-15','8-15 miles'),
  new Shorthand('15+', '15+ miles'),
];

class Distance {
  // finds a shorthand from distances or undefined if not found.
  static findShorthand(key) {
    const at = Distances.findIndex(n => n.key === key);
    return at < 0 ? undefined : Distances[at];
  }
}

class EventsRange {
  static MaxDays = 100;
}

class EventSearch {
  static Limit = 25;
}

// the loc_type of the location table
class LocType {
  static Start = 'start';
  static Finish = 'finish';
}

// Controls the sharing of organizer email, phone, and contact info.
class Showable {
  // should not be visible online nor printable in the calendar.
  static Private   = new Shorthand('private', "Keep private");
  // can be shared freely online and in the print calendar.
  static Public    = new Shorthand('public', "Share online and in print");
  // can be seen online.
  static Visible   = new Shorthand('visible', "Share online, but not in the printed calendar");
  // can be printed in physical calendar.
  static Printable = new Shorthand('printable', "Share in the printed calendar, but not online");

  static combine(visible, printable) {
    if (!visible && !printable) {
      return Showable.Private;
    } else if (visible && printable) {
      return Showable.Public;
    } else if (visible) {
      return Showable.Visible;
    } else if (printable) {
      return Showable.Printable;
    }
  }

  // ex. transform 'private' into the Showable.Private object.
  static findShorthand(key) { return Shorthand.findShorthand(Showable, key); }
}

// the tag_type of the tag table
class TagName {
  static Area       = 'area';
  static Audience   = 'audience';
  static Distance   = 'distance';
  static Featured   = 'featured';
  static LoopRide   = 'loopride'; // note= 'loop' is a reserved mysql word
  static SafetyPlan = 'safety';
}

// the web_type of the web table
class WebType {
  static Url = 'url';
}

//
module.exports = {
  Area,
  Audience,
  Distance,
  Distances,
  EventsRange,
  EventSearch,
  EventStatus,
  LocType,
  Showable,
  TagName,
  WebType,
};

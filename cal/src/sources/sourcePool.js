// maps name -> getRange function
const sources = {};

export default {
  // sources is an array of objects containing name and getRange(start, end);
  // each getRange() should return the promise of array of 'records':
  //    [{uid, type, moment, title}]
  //
  // at a minimum, each record should contain:
  //    uid: some id unique per type
  //    type: used by the display to know how to render the record
  //    moment: a dayjs object
  //
  // optional fields include:
  //    title: a string
  //    nudge: a number for disambiguation of records on the same day.
  register(...sourceList) {
    sourceList.forEach(src => {
      const { name } = src;
      if (name in sources) {
        throw new Error(`${name} already registered`); 
      }
      sources[name] = src;
    });
  },
  // call "getRange(start,end)" on all sources
  // returns a sorted array of records inclusive of those dates.
  async getRange(start, end) {
    // get all the promises of data
    const promises = [];
    for (const key in sources) {
      const source = sources[key];
      const promise = source.getRange(start, end);
      promises.push(promise);
    };
    // wait on their results in parallel
    // ( each result is an array )
    const recordSets = await Promise.all(promises);
    // combine the arrays into one array
    // and sort.
    return recordSets.flat().sort(compareItems);
  }
}

// returns an int a<b: -1; a>b: +1; a==b: 0
// ideally, this never returns 0 unless the records are the same record.
function compareItems(a, b) {
    if (a.moment.isBefore(b.moment)) {
      return -1;
    } else if (a.moment.isAfter(b.moment)) {
      return 1; 
    } else {
      const an = a.nudge || 0;
      const bn = b.nudge || 0;
      if (an < bn) {
        return -1;
      } else if (an > bn) {
        return 1; 
      } else {
        // alphabetical comparison ( instead of ascii )
        return a.type.localeCompare(b.type) || a.uid.localeCompare(b.uid);
      }
    }
}
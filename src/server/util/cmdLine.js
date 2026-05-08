
// a simple helper to parse key=value parameters passed via the command line.
// adds the user specified values to a '.options' member
// ex. `-hello=world` becomes `.options.hello === 'world`
class CommandLine {
  // pass valid command line options as a map of name to documentation.
  // will throw if the user has specified an option that isn't part of the known set
  constructor(known) {
    const pairs = process.argv
      .filter(arg => arg.startsWith('-') && !arg.startsWith('--'))
      .map(arg => {
        const match = arg.slice(1).match(/^(\w+)=(.+)|(\w+)$/);
        // an argument '-a=b' gets split into key, value
        // an argument '-c' gets assigned to flag
        const [str, key, value, flag] = (match || [arg]);
        // return them both as pairs to generate the options
        return (key !== undefined) ? [key, value] :
               (flag !== undefined) ? [flag, 'true'] :
               [str];
    });
    // note: allows unknown options
    // ( ex. so test runner and tests can have overlapping command lines )
    this.known = known;
    this.options = Object.fromEntries(pairs);
  }
  // read a true/false style option.
  // or undefined if no such option was specified.
  bool(key) {
    if (!(key in this.known)) {
      console.error(`unknown key ${key}.`);
      this.listKnown(this.known, console.error);
      throw new Error("unexpected boolean key");
    }
    const value = this.options[key];
    if (value) {
      const map = {
        '0': false, 'false': false,
        '1': true, 'true': true,
      };
      const res = map[value];
      if (res === undefined) {
        console.error(`CommandLine had '${value}' when a boolean value for '${key}' was expected`);
        throw new Error("unexpected boolean value");
      }
      return res;
    }
  }
}

function listKnown(known, out) {
  out(`CommandLine options:`);
  Object.keys(known).forEach(key => {
    const value = known[key];
    out(`* ${key} = ${value}`);
  });
}

function quote(list) {
  return list.map(quote => `'${quote}'`).join(", ")
}

module.exports = {
  CommandLine
};

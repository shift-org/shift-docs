
// helper for the constants 
class Shorthand {
  // key: sent b/t client and server.
  // value: how it appears in the db.
  // label: human friendly display name.
  constructor(...keyValueLabel) {
    // key is always the first argument
    this.key = keyValueLabel[0];
    // value is the middle argument; otherwise the first.
    this.value = keyValueLabel[keyValueLabel.length < 3 ? 0 : 1];
    // label is always the last argument
    this.label = keyValueLabel[keyValueLabel.length - 1];
  }
  toString() {
    return this.key;
  }

  // create a shorthand based on the first letter of the value.
  // ex. the key of "Portland" becomes "P"
  // a label can be specified, otherwise its also the value.
  static Enum(value, label)  {
    return new Shorthand(value[0], value, label ?? value);
  }

  // given a class containing a bunch of shorthand members
  // return the shorthand that was created for it.
  static findShorthand(cls, key) {
    for (const name in cls) {
      const short = cls[name]
      if (short.key === key) {
        return short;
      }
    }
  }
}

module.exports = { Shorthand };
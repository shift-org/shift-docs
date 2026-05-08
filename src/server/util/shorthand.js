
// helper for the constants 
class Shorthand {
  // key: sent b/t client and server.
  // label: human friendly display name
  // value: how it appears in the db
  // both label and value will use the key if left undefined.
  constructor(key, label, value) {
    this.key = key;
    this.label = label !== undefined ? label : key;
    this.value = value !== undefined ? value : key;
  }
  toString() {
    return this.key;
  }

  // create an enum-like value.
  // the name gets stored directly in the db.
  // the first letter gets used as the shorthand key.
  // ex. "P", and "Portland"
  static Enum(name, label)  {
    return new Shorthand(name[0], label || name, name);
  }

  // given a class containing a bunch of shorthand members
  // turn a 'key' name into its db 'value'
  static keyToValue(cls, key) {
    for (const name in cls) {
      const short = cls[name]
      if (short.key === key) {
        return short.value;
      }
    }
  }
}

module.exports = Shorthand;
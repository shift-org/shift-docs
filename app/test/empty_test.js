const tables = require("../models/tables");
const { LocType } = require("../models/calConst");
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

// tests for the function isEmptyRow
describe("empty row validation", () => {
  it('should be empty', () => {
    const tags = [
      tag("bool", false),
      tag("int", 0),
    ];
    tags.forEach(tag => {
      const empty = tables.isEmptyRow('tag', tag);
      assert.equal(empty, true);
    });
    const locations = [{
      id: 5,
      loc_type: LocType.Finish,
    }, {
      id: 12,
      loc_type: LocType.Finish,
    }];
    locations.forEach(loc => {
      const empty = tables.isEmptyRow('location', loc);
      assert.equal(empty, true);
    });
  });
  it('should not be empty', () => {
    const tags = [
      tag("bool", "true"),
      tag("int", 1),
    ];
    tags.forEach(tag => {
      const empty = tables.isEmptyRow('tag', tag);
      assert.equal(empty, false);
    });
    const locations = [{
      loc_type: LocType.Finish,
      place_name: "hello"
    }];
    locations.forEach(loc => {
      const empty = tables.isEmptyRow('location', loc);
      assert.equal(empty, false);
    });
  });
});

function tag(a, b) {
  return {
    tag_type: a,
    tag_value: b,
  }
}

const { allTables, extraKeys } = require("server/v2/schema/allTables");
const allViews = require("server/v2/schema/allViews");
const { setupTables, setupStatements } = require("server/v2/schema/setup");

// allows require("server/v2/schema") to access any export
module.exports = {
  allTables,
  allViews,
  extraKeys,
  setupTables,
  setupStatements,
}
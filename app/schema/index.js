const { allTables, extraKeys } = require('shift-docs/schema/allTables');
const { setupTables, setupStatements } = require('shift-docs/schema/setup');

// allows require('shift-docs/schema') to access any export
module.exports = {
  allTables,
  extraKeys,
  setupTables,
  setupStatements,
}
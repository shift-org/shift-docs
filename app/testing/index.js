const { faker } = require("@faker-js/faker");
const db = require('shift-docs/db');
const dt = require('shift-docs/util/dateTime');
const config = require('shift-docs/config');
const { setupTables } = require('shift-docs/schema');
// internal testing files:
const expect = require('./expect.js');
const expectedResults = require('./expectedResults.js');
const user = require('./user.js');
const { createTestData } = require('./testdb.js');
const { generateFakeData, insertFakeData } = require("shift-docs/testing/fakeData");

const localExports = {

  // dictionary of source data
  user,
  // dictionary of expected data
  expectedResults,

  // function to check for html errors
  expectError: expect.error,

  // function to check for html success
  expectOkay: expect.okay,

  // where format is the desired output, ex. "json"
  configure(format) {
    expect.expectedFormat = format;
  },
  reset() {
    // todo: figure out how to link this into the sandbox/sandbox.reset
    this.configure();
    return db.destroy();
  },

  reset() {
    // todo: figure out how to link this into the sandbox/sandbox.reset
    this.configure();
    return db.destroy();
  },
  // setup the test db without adding any data
  async initTestDB(name) {
    await db.initialize(name);
    await setupTables(db, {drop: true});
  },
  // add small set of manually defined test data
  async createTestData(scheduledEvents = false) {
    faker.seed(23204); // uses lorem generator
    await createTestData(db, scheduledEvents);
  },
  // initialize the test db and add a small set of manually defined test data
  async setupTestData(name, scheduledEvents = false) {
    await this.initTestDB(name);
    await this.createTestData(scheduledEvents);
  },
  // uses faker to setup a large amount of test data
  async setupFakeData(name) {
    await this.initTestDB(name);
    const firstDay = dt.fromYMDString("2002-08-01");
    const lastDay  = dt.fromYMDString("2002-08-31");
    const numEvents = 46;
    faker.seed(23204); // keeps the generated data stable.
    const fakeData = generateFakeData(firstDay, lastDay, numEvents);
    return insertFakeData(db, fakeData);
  },

  // return all data including private data
  findSeries(seriesId) {
    return db
      .query('view_private_events')
      .where('id', seriesId);
  },

  // create a fake database of cal events and dailies:
  fakeNow(sinon) {
    // fake now to be 5th day of august 2002
    sinon.stub(dt, 'getNow').callsFake(() => {
      return dt.fromYMDString('2002-08-05');
    });
  },
  // changes how absolute urls are generated
  // to prefix them with "shift.com" even though generated from localhost
  fakeSiteUrl(sinon, path = "https://shift2bikes.org") {
    sinon.stub(config.site, 'url').callsFake((...parts) => {
      return [path, ...parts].join("/");
    });
  },
};

module.exports = localExports;

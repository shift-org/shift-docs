//
// A custom wrapper for running multiple tests.
//
// Rationale: node's test runner ignores multiple files when using its only and pattern filters.
// https://github.com/nodejs/node/issues/51384
//
const fs = require('fs');         // search for test files
const path = require('path');     // building paths to run those files
const shell = require('shelljs'); // runs node from node; what could be simpler :sob:.
const { CommandLine } = require('../util/cmdLine.js');
const { globalSetup, globalTeardown } = require('./db_setup.js');

const cmdLine = new CommandLine({
  only: `flag to invoke --test-only`,
  pattern: `regex for --test-name-pattern`,
});

// arguments to pass to node for each test
const testArgs = [
  `--trace-warnings`,
  `--test-concurrency=1`,
  // normally we'd let node handle the global setup ( ex. starting docker )
  // however, when running multiple tests, the setup should only happen once.
  //`--test-global-setup=test/db_setup.js`
];

// the custom test runner
async function runTests() {
  const startingDir = process.cwd(); // ex. /Users/ionous/dev/shift/real-shift/app
  const originalCmdLine = process.argv.slice(2); // skip 0 (bin/node) and 1 (testRunner.js)
  await globalSetup();
  _runTests(startingDir, testArgs, originalCmdLine, cmdLine.options);
  await globalTeardown();
}
runTests();

// helpers:
function _runTests(dir, args, orig, { only, pattern }) {
  if (only && pattern) {
    throw new Error(`The test runner expects at most one option. Both only and pattern were specified.`);
  }
  const files = findTestFiles(dir);
  if (!only && !pattern) {
    // the regular test command can handle processing multiple files
    test([`--test`].concat(args, files, '--', orig));

  } else if (only) {
    // find will stop running tests when something returns a non-zero error code.
    files.find(f => test([`--test-only`].concat(args, f,'--', orig)) !== 0 );

  } else if (pattern) {
    // find will stop running tests when something returns a non-zero error code.
    files.find(f => test(args.concat(`--test-name-pattern="${pattern}"`, f)) !== 0 );
  }
}

// return an array of filenames to test
// (returned paths are relative to dir)
function findTestFiles(dir) {
   const entries = fs.readdirSync(dir, {
    withFileTypes: true,
    recursive: true,
  });
  return entries.filter(f => f.name.endsWith("_test.js"))
    .map(f => path.relative(dir, path.resolve(f.parentPath, f.name)));
}

function test(parts) {
  const cmdLine = `node ${parts.join(' ')}`;
  shell.echo(cmdLine);
  // note: shell.cmd is safer, but i can't get it to work with quoted text options. :shrug:
  // ex. --test-name-pattern="date time" looks correct when echo'd but doesn't pass the pattern to node.
  return shell.exec(cmdLine).code;
}
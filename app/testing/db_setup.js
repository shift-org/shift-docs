//
// > npm test -db=mysql -db_debug=true
//
const shell = require( 'shelljs');  // cross-platform shell interaction
const { setTimeout } = require('node:timers/promises');
const db  = require('../db');

// re: Unknown cli config "--db". This will stop working in the next major version of npm.
// the alternative is ugly; tbd but would rather wait till it breaks.
// const custom = process.argv.indexOf("--");
// if (custom >= 0) {
//   console.log(process.argv.slice(custom+1));
// }

function shutdownMysql() {
  console.log(`shutting down up docker mysql...`);
  const code = shell.exec("docker stop test_shift", {silent: true}).code;
  console.log(`docker shutdown ${code}.`);
}

async function startupMysql(connect) {
  console.log(`setting up docker mysql...`);
  // ex. if a test failed and the earlier run didn't exit well.
  const alreadyExists = shell.exec("docker start test_shift", {silent: true}).code === 0;
  if (alreadyExists) {
    // maybe an earlier test failed in some way.
    console.log("docker test_shift already running. reusing the container.");
  }

  // setup docker mysql
  // https://dev.mysql.com/doc/refman/8.4/en/docker-mysql-more-topics.html
  // https://docs.docker.com/reference/cli/docker/container/run/
  // https://hub.docker.com/_/mysql/
  if (!alreadyExists && shell.exec(lines(
    `docker run`,
    `--name test_shift`,                  // container name
    `--detach`,                           // keep running the container in the background
    `--rm` ,                              // cleanup the container after exit
    `-p ${connect.port}:3306`,         // expose mysql's internal 3306 port as our custom port
    `-e MYSQL_RANDOM_ROOT_PASSWORD=true`, // alt:  MYSQL_ROOT_PASSWORD
    `-e MYSQL_DATABASE=${connect.name}`,
    `-e MYSQL_USER=${connect.user}`,
    `-e MYSQL_PASSWORD=${connect.pass}`,
    `mysql:8.4.7`,                       // fix? pull from env somewhere.
    `--disable-log-bin=true`,
  `--character-set-server=utf8mb4`,
    `--collation-server=utf8mb4_unicode_ci`)).code !== 0) {
    shell.echo('docker run failed');
    shell.exit(1);
  }
}

async function initConnection() {
  // configure the connection
  await db.initialize("test setup");

  // wait for an empty query to succeed.
  // ( mysql takes time to start up )
  for (let i = 0; i < 5; i++) {
    try {
      await db.query.raw("select 1");
      break;
    } catch(e) {
      if (e.message === `Connection lost: The server closed the connection.`) {
        console.log(`Waiting for mysql to start...`);
      } else {
        throw e;
      }
    }
    console.log(`waiting ${i} seconds....`);
    await setTimeout(i * 1000);
  }
}

// helpers
function env_default(field, def) {
  return process.env[field] ?? def;
}
function lines(...lines) {
  return lines.join(" ");
}

async function globalSetup() {
  if (db.config.type === 'mysql') {
    await startupMysql(db.config.connect);
  }
  await initConnection();
}

async function globalTeardown() {
  await db.destroy();
  if (db.config.type === 'mysql') {
    shutdownMysql();
  }
}

// https://nodejs.org/api/test.html#global-setup-and-teardown
module.exports = { globalSetup, globalTeardown };
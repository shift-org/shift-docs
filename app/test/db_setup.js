// Configures mysql while testing.
//
// > npm test -db=mysql -db_debug=true
//
const shell = require('shelljs');  // talks to docker in a cross-platform way.
const { setTimeout } = require('node:timers/promises'); // mysql takes time to start.
const db = require('../db');

const dockerImage = `mysql:8.4.7`;  // fix? pull from env somewhere.

function shutdownMysql() {
  console.log(`shutting down up docker...`);
  const code = shell.exec("docker stop test_shift", {silent: true}).code;
  console.log(`docker shutdown ${code === 0 ? 'successfully' : code}.`);
}

async function startupMysql(connect) {
  console.log(`setting up docker image ${dockerImage}...`);
  // ex. if a test failed and the earlier run didn't exit well.
  const alreadyExists = shell.exec("docker start test_shift", {silent: true}).code === 0;
  if (alreadyExists) {
    // maybe an earlier test failed in some way.
    console.log("docker test_shift already running. reusing the container.");
  }

  // setup docker mysql for testing
  // https://dev.mysql.com/doc/refman/8.4/en/docker-mysql-more-topics.html
  // https://docs.docker.com/reference/cli/docker/container/run/
  // https://hub.docker.com/_/mysql/
  if (!alreadyExists && shell.exec(join(
    `docker run`,
    `--name test_shift`,                  // container name
    `--detach`,                           // keep running the container in the background
    `--rm` ,                              // cleanup the container after exit
    `-p ${connect.port}:3306`,            // expose mysql's internal 3306 port as our custom port
    `-e MYSQL_RANDOM_ROOT_PASSWORD=true`, // alt:  MYSQL_ROOT_PASSWORD
    `-e MYSQL_DATABASE=${connect.name}`,
    `-e MYSQL_USER=${connect.user}`,
    `-e MYSQL_PASSWORD=${connect.pass}`,
    dockerImage,
    `--disable-log-bin=true`,
  `--character-set-server=utf8mb4`,
    `--collation-server=utf8mb4_unicode_ci`)).code !== 0) {
    shell.echo('docker run failed');
    shell.exit(1);
  }
}

async function initConnection() {
  // configure a connection
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

  await db.destroy();
}

// helper to read environment variables
function env_default(field, def) {
  return process.env[field] ?? def;
}

// helper to turn lines of quoted text into a single string
function join(...lines) {
  return lines.join(" ");
}

// when testing, called once before any tests start
async function globalSetup() {
  console.log("global setup using: ", JSON.stringify(db.config, null, " "));
  if (db.config.type === 'mysql') {
    await startupMysql(db.config.connect);
  }
  await initConnection();
}

// when testing, called once after all tests have completed
async function globalTeardown() {
  if (db.config.type === 'mysql') {
    shutdownMysql();
  }
}

// https://nodejs.org/api/test.html#global-setup-and-teardown
module.exports = { globalSetup, globalTeardown };
# Overview

The purpose of the Shift/Pedalpalooza Calendar is to empower citizens to create and view bike events and to spread bike fun.

You can see the production site here: [https://www.shift2bikes.org](https://www.shift2bikes.org)

# Software

The calendar is split into two main parts: a frontend, and a backend. The frontend is what most people think of the as the Shift website: it includes all of the webpages and static content. The backend holds all of the user submitted rides, and sends emails to users when they create new rides.

The frontend uses:

- [Hugo](https://gohugo.io), using:
  - the theme "s2b_hugo_theme", ported from the ["Universal"](https://themes.gohugo.io/hugo-universal-theme/) theme
  - the content from the [legacy Shift website](https://old.shift2bikes.org)
- [Netlify web hosting](https://www.netlify.com) to serve the content
  - the [Netlify CMS](https://www.netlifycms.org) for editing static pages in Markdown

The backend uses:
- [Docker](https://www.docker.com/)
- [Nginx](https://nginx.org/en/)
- [MySQL](https://www.mysql.com/)
- [Node.js](https://www.nodejs.org/), and a variety of npm modules.

## Contributing

- If you want to change something about the site configuration or theme, [pull requests](https://help.github.com/articles/creating-a-pull-request/) are welcome.  Once you create a PR, you can immediately check out a link to the [build status, log, and a preview of your changes](https://app.netlify.com/sites/shift-docs/deploys).
- If you only want to edit CONTENT rather than any code or site styling, (including creating new pages), [this doc shows how to easily do so without writing code](/docs/UPDATING.md).

# Local development with Docker

Docker runs the production backend, and Netlify runs the frontend. When developing locally, however, you can use Docker to run both. The following steps assume a Linux, or MacOs development environment.

1. Install Docker: [https://docs.docker.com/get-docker/](https://docs.docker.com/get-docker/)
1. Install Node: https://nodejs.org/en/download
2. Download source code: `git clone https://github.com/shift-org/shift-docs.git`
3. Start your local server: `cd shift-docs ; ./shift up` ( On Windows, use `npm run up` )
4. Optionally, watch for content changes: `./shift watch` ( On Windows, use `npm run watch` )
5. Visit `https://localhost:4443/` . If this leads to an SSL error in chrome, you may try flipping this flag:  chrome://flags/#allow-insecure-localhost

Note that no changes **inside** the Docker containers should ever be needed. The containers read from your **local** filesystem, so updating the files on your machine will automatically update docker too. ( Sometimes after a `./shift down`, `./shift up` to restart the server. )

So now you can hopefully access the site.  But for a real end-to-end test of your setup, you'll need to create an event:

1. Visit https://localhost:4443/addevent/
2. Fill out all required fields (ones marked with an asterisk) for a date a day or two in the future.
3. Save the event (fix any validation errors around missing fields to ensure it saves.)
4. In production, we send you an email with a link to confirm the ride listing. For local development, we don't actually send the email. Instead, use `./shift emails` ( or `npm run emails` ) to view the email log file.
5. Publish your event by visiting the url printed to the log file.
6. See your event on the https://localhost:4443/calendar page!

You can also create some sample test events using the command:

1. `npm run docker-create-events`

It will print the event urls to the console, but they are automatically published to your test site.

## Important Project Files

* `docker-compose.yml`
  * docker container settings
  * The defined containers (db, nginx, etc) become pingable host names from the other running containers.  For example, attached to the nginx container, you can "ping db"
  * Contains the container specific mappings between host and docker container persistent volumes.

* `shift`
  * This is the convenience wrapper that sets up the environment and has various convenience sub-commands to connect to the environment and manipulate it as well.  This is how you'll start the project, connect to the database, etc!
  * contains environment variables that get loaded and are then available for docker to import.  Docker environment variables that will be important are defined separately for each container (see: `docker-compose.yml`).  Run `env` inside an attached docker container to see the variables that made it into the running container.

* `secrets` and `secrets.override`
  * these are the credentials to connect to your local instance.  You should change them if you host your site allowing public connections!

* `shift.overrides` and `shift.overrides.production` 
  * these are the local (potential) configuration overrides, that aren't secret 

## Shift subcommands of interest

* `./shift attach node`
  * `node` is a reference to the named docker container.  Note that you want just `nginx`, `db` or `node` not the full image name (`shift_nginx_1`)
  * Attaches to the running docker container in the shift stack
* `./shift up`
  * If necessary, first builds, and then starts up the docker containers (will also restart if run while the environment is already running.)
* `./shift logs nginx`
  * Will start tailing the logs for the specified container (nginx in this case)
  * multiple container names can be mentioned
* `./shift down`
  * stops the docker containers

## Docker Daemon commands of interest

* `docker ps`
  * lists all of the running process and port information from docker (ex: you can see the postgres service port)
* `docker volume ls`
  * This will show the persistent volumes that docker knows about. The shift project volumes are prefixed with `shift_`
  * The "shift_" docker namespace comes from the shift file: `export COMPOSE_PROJECT_NAME="shift"`

# Local development with Node.js

You can also do local development with node. These steps will setup a local node server which, by default, acts as both frontend and backend. 

After cloning the repo, install [node](https://nodejs.org/en/download) (currently Node.js v20.11.1). Then, open a command prompt or terminal window, change to some useful directory for development, and do the following:

1. `cd shift-docs`
2. `npm install`
3. optionally, create some placeholder events with: `npm run -w tools make-fake-events`
4. `npm run dev`
5. browse to http://localhost:3080, and you should see the site running locally.

When you new create events, the link for activating those events will be written to the terminal. ( In this mode, [Sqlite](https://www.sqlite.org/index.html) is used instead of MySQL. )

### Node tests

If you are writing javascript code in the node backend, you can test everything is working as expected using `npm test`.

### Local previews using production data

As an alternative to `npm run dev`, you can preview a local frontend with the actual production backend by using: `npm run -w tools preview`.  

**NOTE:** any events you create while previewing this way *will* be seen by the world!

### Ethereal email

Before executing `npm run dev`, you can configure email debugging using `npm run -w tools new-ethereal-cfg`. It will generate a `shift-email.cfg` file in your `bin` directory which will be used when adding new events. Use the username and password listed in that file to check for emails here: https://ethereal.email/login.

No actual emails are sent when running this way.

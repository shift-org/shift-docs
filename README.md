# Overview

The purpose of the Shift/Pedalpalooza Calendar is to empower citizens to create and view bike events and to spread bike fun.

# Software

Built using:
- [MySQL](https://www.mysql.com/)
- [Node](https://www.nodejs.org/)
- [Docker](https://www.docker.com/)
- [Hugo](https://gohugo.io), using:
  - the theme "s2b_hugo_theme", ported from the ["Universal"](https://themes.gohugo.io/hugo-universal-theme/) theme
  - the content from the [legacy Shift website](https://old.shift2bikes.org)
  - [Netlify web hosting](https://www.netlify.com) to serve the content
  - the [Netlify CMS](https://www.netlifycms.org) for editing static pages in Markdown

You can see the live site here: [https://www.shift2bikes.org](https://www.shift2bikes.org)

## Contributing

- If you want to change something about the site configuration or theme, [pull requests](https://help.github.com/articles/creating-a-pull-request/) are welcome.  Once you create a PR, you can immediately check out [a link to the build status and log and a preview of your changes](https://app.netlify.com/sites/shift-docs/deploys).
- If you only want to edit CONTENT rather than any code or site styling, (including creating new pages), [this doc shows how to easily do so without writing code](/docs/UPDATING.md).

## Local development

Following the below steps you'll have a copy of the site running, including 3 docker containers running nginx, db, and the node server:

1. Install Docker: [https://docs.docker.com/get-docker/](https://docs.docker.com/get-docker/)
2. Download source code: `git clone https://github.com/shift-org/shift-docs.git`
3. Download additional external modules: `cd shift-docs ; git submodule update --init --recursive`
4. Start shift site: `./shift up`
5. If you're standing up the site for the first time, add database tables with the setup script: `./shift mysql-pipe < services/db/seed/setup.sql`.
6. Visit `https://localhost:4443/` . If this leads to an SSL error in chrome, you may try flipping this flag:  chrome://flags/#allow-insecure-localhost

Note that no changes to the filesystems **inside** the container should ever be needed;  they read from your **local** filesystem so updating the local FS will show up in the container (perhaps after a restart).  Updating, changing branches, etc can be done with git commands **outside** of the container (`git checkout otherbranch` or `git pull`).

So - now you can hopefully access the site.  But a real end-to-end test of yoursetup, would be creating an event:

1. visit https://localhost:4443/addevent/
2. fill out all required fields (ones marked with an asterisk), for a date a day or two in the future.
3. save the event (fix any validation errors around missing fields to ensure it saves)
4. In production, we send you an email with a link to confirm the ride listing; we also write a copy of that email to the file `services/node/shift-mail.log`. For local development, we don't actually send the email, so get the confirmation link from that mail log, visit it, and hit publish event
5. hopefully see your event on the https://localhost:4443/calendar page!

## Netlify deployment

You can easily run your own copy of the site with these two steps.  This could help you do things like theme development, in your own repository, before submitting your finished write-up to us for incorporation.

1. [fork repo](https://help.github.com/articles/fork-a-repo/)
2. read the comments in the netlify.toml file around changing the build command in the `[context.production]` section and make changes if needed.
2. [deploy on Netlify](https://app.netlify.com/start) by linking your forked repo.  Included configuration file `netlify.toml` should mean 0 additional configuration required to get the site running.  If you get a build failure around access denied for ssh, you probably need the advice in step 2 just above this!

If you have trouble with it please [file an issue](https://github.com/shift-org/shift-docs/issues/new) to let us know what you tried and what happened when you did.

# Development Overview

The site is run in several docker containers.

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

## Node tests

If you are writing javascript code in the node backend, you will have to install the required node packages:
In your local `shift-docs/app` sub-directory, run `npm install`.

You can test everything is working as expected using `npm test`.

Currently, the docker image has to be rebuilt after changing any javascript. ( ex. `./shift rebuild node` )

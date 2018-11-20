# Overview

The purpose of the Shift/Pedalpalooza Calendar is to empower citizens to create and view bike events and to spread bike fun.

# Software

built using:
- node
- docker
- [hugo v0.30.2](https://gohugo.io) 
- && the theme ["learn"](https://learn.netlify.com)
- && the content from [the legacy shift website](https://shift2bikes.org)
- && [Netlify web hosting](https://www.netlify.com) to serve the content
- && [the Netlify CMS](https://www.netlifycms.org)

You can browse the current state here:  https://docs.shift2bikes.org

## Contributing

- If you want to change something about the site configuration or theme, [pull requests](https://help.github.com/articles/creating-a-pull-request/) are welcome.  Once you create a PR, you can immediately check out [a link to the build status and log and a preview of your changes](https://app.netlify.com/sites/shift-docs/deploys)
- If you only want to edit CONTENT rather than any code or site styling, (including creating new pages), [this doc tells how](/docs/UPDATING.md)

## Local development
1. install docker
2. clone repo: `git clone https://github.com/sdobz/shift-docs.git`
3. clone submodules `git submodule update --init --recursive`
4. start shift site `./shift up`
5. visit `https://localhost:4443/`


## Netlify deployment
1. [fork repo](https://help.github.com/articles/fork-a-repo/)
2. [deploy on Netlify](https://app.netlify.com/start) by linking your forked repo.  Included configuration file `netlify.toml` should mean 0 configuration required to get the site running (though the CMS will not work without some [additional configuration](https://www.netlifycms.org/docs/quick-start/#authentication))

# License

This repository is under MIT License:

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


# Development Overview

* Vincent has a number of wrappers and files that set up the docker environment


# Important Project Files

* docker-compose.yml
  * docker container settings
  * The defined containers (db, node, etc) become pingable host names from the other running containers.  For example, attached to the node container, you can "ping db"
  * Contains the container specific mappings between host and docker container persistent volumes for example for the node container:

    volumes:
      - ./borzoi/node/:/opt/borzoi/node/
      - ./app:/home/node/app

* shift
  * Vincent's convenience wrapper that sets up the environment and has various convenience docker commands
  * contains environment variables that get loaded and are then available for docker to import.  Docker environment variables that will be important are defined separately for each container (see: docker-compose.yml).  Run "env" inside an attached docker container to see the variables that made it into the running container.

* borzoi/borzoi.sh
  * The environment file that is loaded by the shift script 


# Shift Commands (Vincent's Wrapper Stuff)

* ./shift attach node 
  * node is a reference to the named docker container
  * Attaches to the running docker container in the shift stack
* ./shift up
  * Starts up the docker containers (will also restart)
* ./shift logs nginx
  * Will start tailing the logs for the specified container (nginx in this case)
  * multiple container names can be mentioned
* ./shift down
  * stops the docker containers

# Docker Daemon Commands

* docker ps
  * lists all of the running process and port information from docker (ex: you can see the postgres service port)
* docker volume ls  
  * This will show the persistent volumes that docker knows about. The shift project volumes are prefixed with shift_
  * The "shift_" docker namespace comes from the shift file: export COMPOSE_PROJECT_NAME="shift"

# Sequalize Setup

```bash 
npm install --save pg pg-hstore
bash npm install --save sequelize
```
(from: http://docs.sequelizejs.com/manual/installation/getting-started.html)








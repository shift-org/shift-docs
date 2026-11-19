This directory provides images used during development and testing.

# Image Configuration

The environment variable `SHIFT_IMAGE_DIR`, along with some application rules, configures where the backend reads and writes image files.

## Docker

The `nginx` and `node` containers both handle images. Ngnix reads existing images and sends them to users; node receives image uploads from users and writes them to disk.

Nginx is hardwired ( in `shift.conf` ) to serve urls of the format `/eventimages/123.ext` from `opt/backend/eventimages/`.

Docker via `docker-compose.yml` maps that to a physical location relative to the `shift` script: `./backend/eventimages`.

On production it winds up as "/opt/shift-docs/backend/eventimages".

For node, docker compose is similarly hardwired to expose a path to `/opt/backend/eventimages/`, and map that relative to the shift script at `./backend/eventimages/` ( see TODOs below about cleaning that up connection. )

## Node Development

When running node yourself -- outside of docker -- node handles not only the writing but also the reading of images.

`config.js` exports an `images` member, with various fields including:

* `config.image.path`: used to generate the url given to users. By default this is 'eventimages' ( ex. https://www.shift2bikes.org/eventimages/11030-8.jpg ) -- the same paths that the nginx `shift.conf` uses. This is also the config used to serve files when running without docker. The node side, but not the docker side, can be configured via the env var `SHIFT_IMAGE_PATH` ( see TODOs about cleaning that up. )

* `config.image.dir`: the local directory where images are read from and written to.  This is configured with

When running via `npm dev` that location becomes: `./bin/eventimages`. When running via `npm test` the code uses an os generated temp directory. Docker uses `npm run` and that's described above. The node side of this can be configured via `SHIFT_IMAGE_DIR` but the docker side cannot. ( see TODOs about cleaning that up. )

# Image Files

The `setupEventImages` tool ensures the directory used by `npm dev` exists. It also copies the `bike.jpg` image from this directory to that directory. That image is used by events generated via the `make-fake-events` tool.

# Legacy Info

The `./app/eventimages` directory used to be a mix of development files and uploaded files ( the php era. ) At some point the uploaded files were moved to `./backend`, but special gitignore rules were needed to exclude legacy image files while including the dev ones. As of this writing, the dev images were finally moved to their own separate directory so `app/eventimages` could be nixed from source control completely.

# TODO:

cleanup environment var handling: EVENTIMAGES, SHIFT_IMAGE_DIR, and the unused SHIFT_IMAGE_PATH.

1. either npm dev should initialize the `EVENTIMAGES` environment var, and use that var in config.js -- or that var should be removed from the ./shift script and hardwired in `docker-compose.yml` ( to `./backend/eventimages` )

hardwiring is probably the best route for simplicity's sake. rationale: this is the directory understood by docker. it doesn't really need configuration because it doesn't need to change.

however, if its kept, maybe consider changing the name from `EVENTIMAGES` to `SHIFT_IMAGE_URL` to better communicate its intent.

note: there is an SHIFT_IMAGE_PATH var -- which never gets set, but which node tries to read. whatever happens to EVENTIMAGES should happen to it.

2. `docker-compose.yml` has multiple references to `/opt/backend/eventimages`, it should probably use `SHIFT_IMAGE_DIR`. rationale: these contain the images on the user's local filesystem. the environment var is used by npm already -- right now they have to be manually kept inline.

OR, consider a volume for docker images so that uploaded files don't appear on the user's local filesystem. BUT it would need some finagling on production: either remapping on production to keep the current location, or some way to move existing files into the volume. and, if in a volume, production would need some backup method.

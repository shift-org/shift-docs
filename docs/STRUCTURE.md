# Shift 2 Bikes Project Structure

# Root

The root of the project contains:

- Docs: Markdown documentation
- Legacy: PHP backends and copies of the old javascript. TODO: Delete old JS, move PHP to a backend folder, enable cal admin tools
- Services: Container configuration for required services
- Site: Hugo standard project

It also contains:
- docker-compose.yml: Describes the relationship between services
- netlify.toml: Describes to netlify where hugo is
- secrets.example: Copy to "secrets" and fill out all values, values pass through "shift" into "docker-compose.yml" into containers
- shift: Bash tooling that wraps common project operations, run "./shift help" to see subcommands
- shift.overrides.production: Copy to "shift.overrides" to enable a production setup, values pass into containers

## Site

This is a standard hugo install

- Site articles are described using markdown in the `./site/content/` directory
- Common templates like header are in the `./site/layouts` directory
- Static files like images and pdfs are in `./site/static`
- Shift branding and code is in `./site/themes/s2b_hugo_theme`
- Hugo outputs generated html to the `./site/public/` directory

## Frontend dynamic code

- All frontend code is located in the `./site/themes/s2b_hugo_theme/static` directory

## Backend

The backend is first hit by the user using a `/api/{file}.php` url. Nginx routes this to the `php` container using the filename `/opt/backend/www/{file}.php`, as configured in `./services/nginx/conf.d/shift.conf`

PHP maps `/opt/backend/www/{file}.php` to the host file `./backend/www/{file}.php

The files in `www` read user input, call specific backend functions from the parent directory, and write the output back out to the user


## Services

Your computer is the "host" and docker runs various "containers"

Host directories start with `./` to represent "this" directory on your computer

Container directories start with `/` to represent the root of their filesystem 

This file would be `./docs/STRUCTURE.md`

Each folder represents a service managed by docker compose

The directory (host) `./services/{service}/...` maps to (container) `/opt/{service}/...`

For a specific example: `./services/nginx/entrypoint.sh` on your computer maps to `/opt/nginx/entrypoint.sh` inside the container


### Nginx:

Static files served from `./site/public`

Event images stored and served from `./backend/eventimages`

Scripts are located at `./services/nginx/`

On startup nginx runs `entrypoint.sh` which creates a self-signed ssl cert at `./services/nginx/ssl/default.crt|key`

#### Letsencrypt

*this script will only work on the production machine at `api.shift2bikes.org`*

1. For production the script `certbot.sh` contains hardcoded project directory `/opt/shift-docs`
2. The script creates the directory on the host `/tmp/letsencrypt-auto`, which is mapped into the container at `/tmp/letsencrypt-auto`
3. Certbot (on the host) puts some secrets into the dir, letsencrypt contacts nginx (in the container) via http and checks for the proper secrets
4. If they match certbot and puts the cert in `/etc/letsencrypt/live/{doman}.crt|key` (on the host)
5. It copies these certs to the dir (host) `/opt/shift-docs/services/nginx/ssl` AKA (container) `/opt/nginx/ssl/default.crt|key`

### PHP:

The php backend is based on flourish, a basic ORM

The service configuration is located in `./services/php/` and mounted in the container as `/opt/php/`

`entrypoint.sh` is responsible for configuring xdebug and postfix using values passed in from `./shift`

#### Emails

There is a drastic fork between production and local development with respect to emails.

PHP is configured to use the script `./serices/php/sendmail.sh` to send all emails.

1. During startup inside the php container `./services/php/entrypoint.sh` checks if remote stmp is configured (via `shift.overrides`)
2. If so postconf/postmap/rsyslogd are used to setup smtp forwarding
3. `sendmail.sh` checks for the same emails, and if so send all input over to the postfix provided sendmail binary
4. `sendmail.sh` also always writes all email to `/var/log/shift-mail.log`

Users can use `./shift mail` to view this log from the host computer

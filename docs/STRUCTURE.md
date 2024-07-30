# Shift 2 Bikes Project Structure

# Root

The root of the project contains:

- Docs: Markdown documentation
- App: Javascript backend 
- Tool: Javascript helpers
- Services: Container configuration for required services
- Site: Website content ( built using Hugo )

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

- All frontend code is located in the `./site/themes/s2b_hugo_theme/assets` directory
- Frontend third party libraries are in `./site/themes/s2b_hugo_theme/static/lib`

## Backend

In production,  Netlify fetches `api` urls from the `api.shift2bikes.org` aws server. Nginx reroutes this to a Node server as configured in `./services/nginx/conf.d/shift.conf`. Express.js routes those to specific endpoints as defined in `app/app.js`.

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

#### Emails

Organizers receive an email for every ride they create with instructions they must follow to publish the ride. The backend uses [nodemailer](https://nodemailer.com) to send that mail via smtp. In production, AWS handles the actual delivery. In development, [ethereal](https://ethereal.email/messages) can be used to test; otherwise, by default, it simply logs to console. 

Users can view sent mail via `./shift mail` from the host computer.

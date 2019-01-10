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


## Legacy

This PHP ran the old calendar and the interim "fun" calendar.

- Cal: ??? Don't worry about it
- Fun: Delete JS, move php to `./backend`

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

Event images stored and served from `./legacy/eventimages`

Scripts are located at `./serviecs/nginx/`

On startup nginx runs `entrypoint.sh` which creates a self-signed ssl cert at `./services/nginx/ssl/default.crt|key`

#### Letsencrypt

*this script will only work on the production machine at `api.shift2bikes.org`*

1. For production the script `certbot.sh` contains hardcoded project directory `/opt/shift-docs`
2. The script creates the directory on the host `/tmp/letsencrypt-auto`, which is mapped into the container at `/tmp/letsencrypt-auto`
3. Certbot (on the host) puts some secrets into the dir, letsencrypt contacts nginx (in the container) via http and checks for the proper secrets
4. If they match certbot and puts the cert in `/etc/letsencrypt/live/{doman}.crt|key` (on the host)
5. It copies these certs to the dir (host) `/opt/shift-docs/services/nginx/ssl` AKA (container) `/opt/nginx/ssl/default.crt|key`

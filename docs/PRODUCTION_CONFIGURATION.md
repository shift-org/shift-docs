Initially the shift-docs repo is set up for local docker development

## Connection

The production server is hosted on amazon ec2 us-west-2 (oregon) under the shiftgithub@gmail.com amazon account.

`ssh ubuntu@api.shift2bikes.org`

It uses an ubuntu image with manually installed docker
The repo is located under

## Git -> production

`/opt/shift-docs/`

The start command is the same as local development,
`./opt/shift-docs/shift start`

## Configuration

The shift command inspects the `./shift.overrides` file for environment variable updates.

The `./shift.overrides.production` contains the overrides used for production (ex: nginx https 443 rather than 4443)

During production configuration the `/opt/shift-docs/shift.overrides` is soft linked to `/opt/shift-docs/shift.overrides.production` file in order to activate production overrides.

## Images

The event images are served from the `/opt/shift-docs/legacy/eventimages` directory, which must have 777 permissions.
Configuration locations:
* `shift.overrides -> shift -> docker-compose.yml -> ./legacy/fun/app/config.php`
* `shift.overrides -> shift -> ./legacy/fun/app/config.php`
* `./services/nginx/conf.d/shift.conf`

## Mail
TODO

Initially the shift-docs repo is set up for local docker development

## Connection

The production server is hosted on amazon ec2 us-west-2 (oregon) under the shiftgithub@gmail.com amazon account.  @sdboz and @fool know login details for this and are setup to login via ssh via public key.

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

The event images are served from the `/opt/shift-docs/backend/eventimages` directory, which must have 777 permissions.
Configuration locations:
* `shift.overrides -> shift -> docker-compose.yml -> ./backend/config.php`
* `shift.overrides -> shift -> ./backend/config.php`
* `./services/nginx/conf.d/shift.conf`

## Mail
TODO

## SSL
Our SSL certificate is provided by [lets encrypt](https://letsencrypt.org).  This is required for the hugo front-end running on Netlify to connect to the calendar, and if it doesn't work, you'll see a 500 HTTP error in your devtools (and a blank calendar page in the browser) when trying to fetch calendar data.

The SSL certificate is a bit of a special snowflake in configuration as it lives **OUTSIDE of all the docker containers on the main host** in `/tmp/letsencrypt-auto`, and that is imported into a docker container via [docker-compose.yml](https://github.com/Shift2Bikes/shift-docs/blob/master/docker-compose.yml#L17) and is further [potentially overridden in the `shift` script](https://github.com/Shift2Bikes/shift-docs/blob/master/shift#L14).  Lets Encrypt provides ONLY certificates that last 90 days, so we need to make sure it's updated often. 

Nginx in its docker container **USES** that SSL cert, but **it only reads it on startup, so if the container hasn't been restarted in 90 days, the certificate in use will be expired even if the certificate on disk is up to date**.  

- So, step 0 in debugging SSL failures (for https://api.shift2bikes.org) is to try restarting the docker container:  `cd /opt/shift-docs && ./shift restart nginx`.  
- If that doesn't work, you can try manually running the certificate updater:  `cd /opt/shift-docs && /opt/shift-docs/services/nginx/certbot.sh`.  That should not just get a new certificate but also restart nginx to use it.

That script will show output when run manually, in case something is wrong:

```
Cert not yet due for renewal
Keeping the existing certificate

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Certificate not yet due for renewal; no action taken.
```

or

```
Restarting shift nginx
+ /opt/shift-docs/shift restart nginx
ERROR:
        Can't find a suitable configuration file in this directory or any
        parent. Are you in the right directory?

        Supported filenames: docker-compose.yml, docker-compose.yaml
```

Certbot (which is the name of the package that renews the certificate) logs to a debug log in `/var/log/letsencrypt/letsencrypt.log` that might also be useful to examine for debugging.  

[Vincent](https://github.com/sdboz) and [fool](https://github.com/fool) understand the process thoroughly if you're struggling.

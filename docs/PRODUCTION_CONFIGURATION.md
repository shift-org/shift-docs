Initially the shift-docs repo is set up for local docker development

## Connection

The production server is hosted on amazon ec2 us-west-2 (oregon) under the shiftgithub@gmail.com amazon account.  @sdboz and @fool know login details for this and are setup to login via ssh via public key.

`ssh ubuntu@api.shift2bikes.org`

It uses an ubuntu image with manually installed docker
The repo is located under

## Git -> production

The git folder is on production is: `/opt/shift-docs/`

In github, whenever we merge a new PR, netlify automatically deploys the code and content to production. The `netlify.toml` controls that under the `[context.production]`. It logs into the production server and uses `./shift pull` to update the server's backend code.

That same shift script can be used on production manually ( ex. `./shift start`, `./shift logs`, etc. as needed. )

## Configuration

The `./shift` script looks for a  `./shift.overrides` file to update environment variables ( ex. to set the nginx port to 443 rather than the 4443 port defined at the top of `./shift` ) 

There is no such file in the repo. Instead, there is an `/opt/shift-docs/shift.overrides.production` in the repo, and that file was manually soft linked as  `/opt/shift-docs/shift.overrides` when setting up the production machine. Nothing in this file is or should be secret. ( no credentials )

## Images

The event images are served from the `/opt/shift-docs/backend/eventimages` directory, which must have 777 permissions.
Configuration locations:
* `shift.overrides -> shift -> docker-compose.yml -> ./app/config.js`
* `shift.overrides -> shift -> ./app/config.js`
* `./services/nginx/conf.d/shift.conf`

## Mail
See  [secrets.example](https://github.com/shift-org/shift-docs/blob/main/secrets.example). 

A filled out version of that file exists as `/opt/shift-docs/secrets` on our server. I believe `CAL_ADMIN_PASSWORD` is no longer needed, but you'll have to setup the smtp bits so that your sever can send confirmation emails. 

We use amazon's smtp service. ex. `SMTP_HOST=smtp.us-west-2.amazonaws.com` with USER and PASS credentials obtained from the amazon, and `SMTP_DOMAIN=shift2bikes.org`.

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

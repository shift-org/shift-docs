# shift2bikes.org Hosting details

## Overview

This file attempts to document specifics to how the production shift2bikes.org site is setup that you might want to do differently if you were hosting a different copy of the site.

## frontend specifics

Netlify builds the static content for the site using [Hugo](https://gohugo.io) with every commit.

cf [this other doc](https://github.com/shift-org/shift-docs?tab=readme-ov-file#frontend-development-with-netlify)

## backend specifics

misc configuration for email sender and and ical attribution live in [config](https://github.com/shift-org/shift-docs/blob/main/app/config.js) and there's also [email.njk](https://github.com/shift-org/shift-docs/blob/main/app/views/email.njk) for the confirmation email text. 

### SMTP

nodemailer is configured to use smtp to send confirmation emails. see https://github.com/shift-org/shift-docs/blob/hosting-docs/docs/PRODUCTION_CONFIGURATION.md for details.

### Timezone:

We generally treat `YYYY-MM-DD` and ride times as timezone free strings, and they are stored in the DB that way too. So, if the organizer says the ride starts at "7PM" then that's the value we report. Everyone in the world should -- so far as i know -- see that exact text: 7PM. However, on the backend -- for reporting the ical feed, and to ensure we get a `now()` that matches what portland riders would expect -- we explictly set a default timezone:

https://github.com/shift-org/shift-docs/blob/652af30e3c3a4d623a34ff0ff43ead9d671f2320/app/util/dateTime.js#L10

( we could move that to [the config.js](https://github.com/shift-org/shift-docs/blob/main/app/config.js) if that were helpful. )

## Netlify specifics

We use [Netlify](https://www.netlify.com) to host the frontend of the production site, and also host some static content. We also have Netlify proxy to the backend server and handle some caching and avoid some [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) issues that can come from serving API-backed content from multiple domains.  

This setup may not make sense for your use case, but since one of the primary contributors has a sponsored account with Netlify (you can probably get one too:  https://www.netlify.com/legal/open-source-policy/#main), it was the decision that we made.  If you were to want to host your front end off of Netlify, you effectively don't need to use Netlify at all;  the default API server config will serve all content, static and dynamic.

We use Netlify's DNS hosting - but you don't need to, even to get full benefits of their CDN which serves content from a node closest to the visitor.  See [this Support Guide](https://answers.netlify.com/t/support-guide-can-i-host-my-site-on-netlify-but-keep-my-dns-at-my-domain-registrar/110) for more details about how to configure things and why.

The primary netlify config is all in [`netlify.toml`](https://github.com/shift-org/shift-docs/blob/main/netlify.toml), which primarily handles two things:

1. redirects and connecting our public URL's (shift2bikes.org, www.shift2bikes.org, www.shift2bikes.com, etc) to our backend (api.shift2bikes.org)
2. and also building the frontend (with every commit) and the pushing backend content to our API server (with production commits)

If you were to rip netlify out, you'd not need most of that stuff but would need to manage SSL certificates and handle building your site for yourself.  If you were doing this, you could start from [these build commands](https://github.com/shift-org/shift-docs/blob/main/package.json#L31-L34) for inspiration.

**TL;DR the backend can run standalone and serve all content without any other service involved!**

## Misc Production Details

Currently running Ubuntu 24.04.2 LTS.

### cron
we have two cron jobs, one that updates our [Lets Encrypt](https://letsencrypt.org/) TLS certificate, and one that does a mysql and image (all user data the server stores) backup.

### certbot
We struggled to get this working well, so there is probably dark magic here.  Cron uses this script to renew the cert on a regular basis: https://github.com/shift-org/shift-docs/blob/main/services/nginx/certbot.sh  

---- 
# FAQ:

1. Q: `docker-compose` is no longer supported; but the `shift` script uses it?
   
   A: The script will only use it if it is present, e.g. in an older version of ubuntu.  In production, we use the `docker compose` version of the command as shown [in this code](https://github.com/shift-org/shift-docs/blob/main/shift#L173-L174).  Depending on what version of docker you use, you may need to mess with this To Some Degree.
    
2.  Q: What setup is needed for the ec2 server that will be running the database? Do I just need to change the db passwords and the domain in shift script?

    A: See 1, but also there are two files to setup: the `secrets` ( for email ) and the `shift.overrides` ( for the domain ) -- see https://github.com/shift-org/shift-docs/blob/hosting-docs/docs/PRODUCTION_CONFIGURATION.md for more info on those.

3.  Q: Where do I need to repoint/change the `api.shift2bikes.org`? 

    1. `netlify.toml`: various places: for api access, uploaded user image access, ical feeds. 
    2. the `secret`s file: for smtp 
    3. `shift.overrides`: for generating links to events in returned responses 
    4. `certbot.sh`: so the backend can be accessed with https 
    5. minor: `tools/preview.js`: for testing local content with the production backend
  
4. Q: And what about references to the frontend or domain?

   1. `app/config.js`: reply email address, ical guid(s), etc.
   2. `app/endpoints/ical.js` (and `test/ical_test.js`): more ical guid generation
   3. `site/content/404.md`, `addevent.md`,` site/themes/s2b_hugo_theme/layouts/partials/cal/edit.html`, `pp-header.html`: support emails
   4. `site/themes/s2b_hugo_theme/layouts/partials/cal/shift-feed.html`: ical subscription link
   5. probably some content pages ( ex. for documentation, links, or email: but nothing that would directly affect functionality )
  
   

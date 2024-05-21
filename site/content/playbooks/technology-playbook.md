---
title: technology playbook
date: '2023-05-20T17:25:11-07:00'
weight: '2'
---

This project is under active development!  This has some informations, and links to the rest.

This document is incomplete;  check out [more current information in the README on Github](https://github.com/shift-org/shift-docs#overview) and also extensive docs in the [docs directory of that project](https://github.com/shift-org/shift-docs/tree/master/docs)

# We generally meet once a week to work on the website/calendar.  Ping the [website crew](mailto:bikecal@shift2bikes.org) to get details about our next meetup.  All are welcome;  coders, testers, content editors, visionaries, etc.

Shift uses [Amazon's AWS](https://aws.amazon.com) and [Netlify](https://www.netlify.com) to host our website.  Chris/fool is currently paying for AWS but will eventually start submitting expenses to Shift for payment, so frugality in our hosting is a reasonable goal to save the org money.

Shift's Domains are registered through [Dotster](https://www.dotster.com) and are hooked to fool's credit card:

- shift2bikes.org
- shift2bikes.com
- shifttobikes.org
- shifttobikes.com


pedalpalooza.org has been transferred to the pedalpalooza org and is not managed by shift anymore.

Several people can potentially help with website or calendar problems, including chris (@fool), Josh (@carrythebanner), Andrew (@onewheelskyward) - but you should email [bikecal@shift2bikes.org](mailto:bikecal@shift2bikes.org) if you are interested in contributing or have a question or need tech support.

The calendar is written in Node.js, and talks to a MySQL database that is backed up semi-regularly.

This [website](https://www.shift2bikes.org) and [calendar](https://shift2bikes.org/calendar/) are their own codebase in [GitHub](https://github.com), which is free to join and use in any way that you might while collaborating with us on maintenance/development, and of course free to download!

Some of the old website/calendar codebase is in github here: https://github.com/Shift2Bikes/shiftcal/tree/Legacy

Finally, we use mxroute.com (account is in fool's name) to handle mails to addresses@shift2bikes.org and you have to login there to set up new aliases (on [this page](https://taylor.mxrouting.net:2222/evo/user/email/forwarders).  @carrythebanner and @fool have access to the admin account on this service.

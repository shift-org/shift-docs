# shift2bikes.org Hosting details

## Overview

This file attempts to document specifics to how the production shift2bikes.org site is setup that you might want to do differently if you were hosting a different copy of the site.

## frontend specifics

Netlify builds the static content for the site using [Hugo](https://gohugo.io) with every commit.

cf [this other doc](https://github.com/shift-org/shift-docs?tab=readme-ov-file#frontend-development-with-netlify)

## backend specifics

TBA 

## Netlify specifics

We use [Netlify](https://www.netlify.com) to host the frontend of the production site, and also host some static content. We also have Netlify proxy to the backend server and handle some caching and avoid some [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) issues that can come from serving API-backed content from multiple domains.  

This setup may not make sense for your use case, but since one of the primary contributors has a sponsored account with Netlify (you can probably get one too:  https://www.netlify.com/legal/open-source-policy/#main), it was the decision that we made.  If you were to want to host your front end off of Netlify, you effectively don't need to use Netlify at all;  the default API server config will serve all content, static and dynamic.

We use Netlify's DNS hosting - but you don't need to, even to get full benefits of their CDN which serves content from a node closest to the visitor.  See [this Support Guide](https://answers.netlify.com/t/support-guide-can-i-host-my-site-on-netlify-but-keep-my-dns-at-my-domain-registrar/110) for more details about how to configure things and why.

The primary netlify config is all in [`netlify.toml`](https://github.com/shift-org/shift-docs/blob/main/netlify.toml), which primarily handles two things:

1. redirects and connecting our public URL's (shift2bikes.org, www.shift2bikes.org, www.shift2bikes.com, etc) to our backend (api.shift2bikes.org)
2. and also building the frontend (with every commit) and the pushing backend content to our API server (with production commits)

If you were to rip netlify out, you'd not need most of that stuff but would need to manage SSL certificates and handle building your site for yourself; TL;DR the backend can run standalone and serve all content!

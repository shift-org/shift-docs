# Overview

Our static content is hosted on [Netlify](https://www.netlify.com) and our dynamic content (calendar entries and backend) are hosted elsewhere as described in [the main README file](README.md).

The static portions of the site are built by [Hugo](https://gohugo.io) and stored in the [site/content](https://github.com/Shift2Bikes/shift-docs/tree/master/site/content) directory as markdown files.

Upon each commit to github, a deploy preview will be generated and you can browse to it from [https://app.netlify.com/sites/shift-docs/deploys](https://app.netlify.com/sites/shift-docs/deploys) where each deploy is listed and each details/logs page has a link to "preview this deploy" at the top that will take you to a permalink for that specific deploy.

One could edit those markdown files via [pull request](https://help.github.com/articles/creating-a-pull-request/) but the preferred editing method is using [NetlifyCMS](https://www.netlifycms.org) which is hosted on the site at [/admin/#](https://shift-docs.netlify.com/admin/# .  Authentication is handled by [Netlify's Identity Service](https://www.netlify.com/docs/identity), and editing happens in-browser similar to WordPress.

# Editing Content

Existing pages can be created through the CMS from the list on this page: https://docs.shift2bikes.org/admin/#/collections/pages  .  Before you can use it, you must select the "sign up" portion of the login widget here: https://docs.shift2bikes.org/admin/# and create an account.  Once you've created a login, you'll need to click a link in the automatic email to verify your account, and then you can login and edit content.  Every "save" will rebuild the site and you can examine the results before choosing to "publish" by examining the latest deploy previews here:  https://app.netlify.com/sites/shift-docs/deploys?filter=deploy%20previews

# Creating Content

New pages can be created through the CMS as shown in this screenshot: 

as accessed at: https://docs.shift2bikes.org/admin/#/collections/pages


# Working on non-static content

If you want to change something about the site configuration or theme, [pull requests](https://help.github.com/articles/creating-a-pull-request/) are welcome.  Once you create a PR, you can immediately check out [a link to the build status and log and a preview of your changes](https://app.netlify.com/sites/shift-docs/deploys)

# Having trouble changing content?

Please email [bikecal@shift2bikes.org](mailto:bikecal@shift2bikes.org) and we'll help out!  Screenshots, URL's at which you're having trouble, and specific error messages would be useful in quickest diagnoses and fixes.



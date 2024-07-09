# Overview

Our static content is hosted on [Netlify](https://www.netlify.com) and our dynamic content (calendar entries and backend) are hosted in AWS, as described in [the main README file](README.md).

The static portions of the site are built by [Hugo](https://gohugo.io) and stored in the [site/content](https://github.com/Shift2Bikes/shift-docs/tree/master/site/content) directory as markdown files.

Upon each commit to github, a deploy preview will be generated and you can browse to it from [https://app.netlify.com/sites/shift-docs/deploys](https://app.netlify.com/sites/shift-docs/deploys) where each deploy is listed and each details/logs page has a link to "Preview deploy -&gt;" at the top that will take you to a permalink for that specific deploy which you can interact with in a browser.  Try it here to see the site from the theme it started with and ancient content (Nov 2017):  https://5a0bc68e4c4b9374607a33d6--shift-docs.netlify.com/

One could edit those markdown files via [pull request](https://help.github.com/articles/creating-a-pull-request/) but the preferred editing method is using [NetlifyCMS](https://www.netlifycms.org) which is hosted on the site at [/admin/#](https://www.shift2bikes.org/admin/#).  Authentication is handled by [Netlify's Identity Service](https://www.netlify.com/docs/identity), and editing happens in-browser similar to WordPress.

# Editing Content

Most existing pages can be created through the CMS from the list on this page: https://www.shift2bikes.org/admin/#/collections/pages .  Selecting a different group (aka "collection") on the left will show you listings of other pages and you can select one of those to edit pages within it.

Before you can edit or create pages for the first time, you must do a few things:

1. select the "sign up" portion of the login widget found here: https://docs.shift2bikes.org/admin/# 
2. and create an account.  
3. Once you've created a login, you'll need to click a link in the email to the address you've signed up with, to verify your account, 
4. and then you can login and edit content.  If you know markdown, you can enable the markdown editor; if you don't know markdown, please use the rich text version.  There is a slider near the top (alongside the "bold", "italics", etc controls) of the big editor on the left side that changes between these modes.
5. Select "Publish" and your results should be available live within a minute or so.  If that doesn't work, [tech support is available](#having-trouble-changing-content).

Some additional details of interst:

- after you make a CMS edit, the change is saved to github and then netlify starts building the site.  All changes to *content* should be visible in deploy previews (unlike changes to the backend which require a commit to main).
- the CMS login widget "netlify-identity-widget" doesn't work with most password managers.  Sorry about that, but feel free to use a simple password...


# Creating Content

New pages can be created through the CMS as accessed at: https://www.shift2bikes.org/admin/#/collections/pages .  You can't create new "chapters" (aka "sections of our site") there, but pulling up an existing category (such as Playbooks/Pages/Archive) will lead you to a list of existing content and a button in the upper right for "New X" - such as "New Pages".  Playbooks are shown under shift2bikes.org/pages/playbooks, Pages at shift2bikes.org/pages, and Archives are not shown by default but can be linked to as /archive/name-of-markdown-file (without a `.md` extension)

Once you create a page, the file is created in git and can be manually edited there. For advanced users who are manually editing pages in github, look for the newly created page here: https://github.com/shift-org/shift-docs/tree/main/site/content/pages

NOTE: The page won't be linked from the navigation menus that are on the site until you add a navigation guideline in the frontmatter of the post.  You can't do this in the CMS, so your best bet if you are not into making manual git commits is to create your page and then ping [the dev crew](mailto:bikecal@shift2bikes.org] or ping fool directly to help out.  It would be useful if you mentioned WHICH menu group you want it in :)

# Adding content to the site navigation

At the top of each page markdown file there is a block surrounded by the markers: `---` which contain the page "Frontmatter" data. The navigation menu block is shown below. `menu` is the navigation part, `main` is navigation we use for the homepage and sites navigated to by the homepage, `parent` is the parent menu where the page should be.

```
menu:
    main:
        parent: communitynav
```

...and that should go between the `---` markers at the TOP of the file!  

Other categories for `parent` are: 
- `featuredevents`
- `aboutmenu`
- `calevent` (won't show in any nav menus!)

That's all you'd need to change to make them show up in the respective nav menu


# Creating a new category

This won't get it into the navigation, but to create a new category of editable pages, these are the steps:

1. create a directory under `pages/`
2. create a new ["collection"](https://www.netlifycms.org/docs/collection-types/) `in static/admin/config.yml`.  Something like this should work.  SPACING IS IMPORTANT!:

```
  - name: "pedalpalooza" # Used in routes, e.g., /admin/collections/pages/pedalpalooza
    label: "pedalpalooza archive" # Used in the CMS UI, make it short & descriptive
    folder: "site/content/archive/pedalpalooza" # The path to the folder where the documents are stored
    create: false # Don't allow users to create new documents in this collection
    slug: "{{slug}}" # Filename template: title.md
    fields: # The fields for each document, usually in front matter
      - {label: "Title", name: "title", widget: "string"}
      - {label: "Page #", name: "weight", widget: number}
      - {name: "menu", widget: "hidden"}
      - {label: "Body", name: "body", widget: "markdown"}
```

3. save config.yml and test in a deploy preview that the CMS loads at all.
4. merge to master to "make it really work" (FYI: this is something that may not work well in deploy previews from your branch / PR deploys)


# Working on non-static content

If you want to change something about the site configuration or theme, [pull requests](https://help.github.com/articles/creating-a-pull-request/) are welcome.  Once you create a PR, you can immediately check out [a link to the build status and log and a preview of your changes](https://app.netlify.com/sites/shift-docs/deploys)

# Having trouble changing content?

Please email [bikecal@shift2bikes.org](mailto:bikecal@shift2bikes.org) and we'll help out!  Screenshots, URL's at which you're having trouble, and specific error messages would be useful in quickest diagnoses and fixes.

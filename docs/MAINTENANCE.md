# How to put the website in "maintenance mode"

----

## Why?

In case we know the calendar will be down (or is down) for an extended period of time, this workflow allows us to ensure that:

- the dynamic web pages (both calendar-showing, and event-adding) will show humans a friendly error message including where to ask for tech support in case the error persists for longer than they expect
- API endpoints will return status 307, so that consumers will not think that everything is "200 OK".

## How?

- All changed paths return HTTP 307 for paths that we are overriding including /api/*, so that users' browsers will "forget" the change once we revert.
- If you want to edit the text it is in site/content/pages/maintenance.md and the main homepage override is in themes/s2b_hugo_theme/layouts/partials/cal/up-next.html

To test it out, visit https://maintenance--shift-docs.netlify.app/


### How to enable this instead of our usual:

1. when logged into [Netlify](https://app.netlify.com),
2. visit https://app.netlify.com/sites/shift-docs/deploys?filter=maintenance
click into the top deploy
3. hit "Publish Deploy"

### How to revert
- push a commit to production
or 
- visit https://app.netlify.com/sites/shift-docs/deploys?filter=main and click into the top deploy and hit "Publish Deploy"


## Notes

1. This is probably not the "right way" to maul the pages into submission, but the message looks ok/effective, and I don't feel like it matters much since this is only intended for temporary use ("We put the calendar in maintenance mode manually").

2. It is "frozen in time" in dec 2024, so we'll need to merge in new content from `main` in case we want to get other updates from the mainline.

3. the "fix" / content  will live in this branch:

	- https://github.com/shift-org/shift-docs/tree/maintenance

...since we'd never want to merge it, so no PR. But Netlify will keep it for us and we can update it and publish it anywhen.

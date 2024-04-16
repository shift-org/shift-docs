# Pedalpalooza playbook

----

## Before

### Early promo

approx. January–March

* Change `/site/content/pedalpalooza-calendar.md` page type from `calevents` to `pp-landing`; un-comment the "stay tuned" body text. Update the front matter to the current year: `title`, `year`, `startdate`, `enddate`, and `daterange`. Temporarily set the evergreen image.
* Un-comment the contents of `/site/data/carousel/pedalpalooza.yaml`. Change the year, and temporarily set the evergreen image (`images/carousel/pedalpalooza-general.png`). Leave it at its current carousel position for now.
* Update the Pedalpalooza ical feed dates in `/services/nginx/conf.d/shift.conf` ( specifies start and end dates, and exported filename. )


### Ramping up

approx. April–early May

* Change `/site/content/pedalpalooza-calendar.md` page type back to `calevents`; comment out the "stay tuned" body text
* Move the Pedalpalooza carousel to the first position
* Set the real image in the carousel
* Set the real image in the pp-header banner
* Add promo banner on add/edit form
* Un-comment the promo banner on `site/content/pages/pedalpalooza.md`; update the year.
* In `site/themes/s2b_hugo_theme/layouts/partials/cal/pp_header.html`, update the `if eq (.Param "year")` statement to include the current year. Also un-hide the "add your rides now" CTA and adjust it for the current year.


### Closer to the start

approx. early to mid May

* Add the merch sale snippet (`pp-merch.html`) to the PP header (`pp-header.html`). This typically won't be available until early May, and then needs to be removed once sales close (mid May to early June). Sometimes there is more than round of sales, so an additional update may be needed.


## During

June, July, and August

* No regular changes planned
* Monitor calendar crew inbox ([bikecal@shift2bikes.org](mailto:bikecal@shift2bikes.org)) for support requests 


## After

September or later

* Add the just-finished festival to the Pedalpalooza Archives page; get the total count of published, uncanceled rides
* Hide Pedalpalooza carousel item
* Remove promo banner from regular events page and from add/edit form
* Hide the "add your rides now" CTA from `pp_header.html`

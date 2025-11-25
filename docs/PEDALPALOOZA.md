# Pedalpalooza playbook

----

## Before

### Early promo

approx. January–March

* Change `/site/content/bike-summer-calendar.md` page type from `calfestival` to `pp-landing`. Update the front matter to the current year: `title`, `year`, `startdate`, `enddate`, and `daterange`. Temporarily set the evergreen image.
* Enable the "early" carousel item (`/site/data/carousel/bike-summer-early.yaml`) by setting `disabled: false`. 


### Ramping up

approx. April–early May

* Change `/site/content/bike-summer-calendar.md` page type back to `calfestival`.
* Set `params.festival.active` to `true` in `hugo.toml`; this will enable most of the conditional content
* Disable the "early" carousel item
* Enable the regular carousel item; update the year and image
* Update the image in the `pp-header` banner
* Uncomment the promo blurb on `/site/content/pages/bike-summer.md`


### Closer to the start

approx. early to mid May

* Set `params.festival.merchSaleActive` to `true` once merch sales open up. 
* Update the merch sale snippet (`pp-merch.html`) in the PP header (`pp-header.html`) as needed. This typically won't be available until early May, and then needs to be removed once sales close (mid May to early June). Sometimes there is more than round of sales, so an additional update may be needed.


## During

June, July, and August

* Set `params.festival.merchSaleActive` to `false` once merch sales are over
* No other regular changes planned
* Monitor calendar crew inbox ([bikecal@shift2bikes.org](mailto:bikecal@shift2bikes.org)) for support requests 


## After

September or later

* Add the just-finished festival to the Pedalpalooza Archives page; get the total count of published, uncanceled rides
* Set `params.festival.active` to `false` in `hugo.toml`
* Disable the carousel item (`/site/data/carousel/bike-summer.yaml`) by setting `disabled: true`
* Comment out the promo blurb on `/site/content/pages/bike-summer.md`

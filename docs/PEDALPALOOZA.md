# Pedalpalooza playbook

----

## Before

### Early promo

approx. January–March

* Change `/site/content/bike-summer-calendar.md` page type from `calfestival` to `festival-landing`. Update the front matter to the current year: `title`, `year`, `startdate`, `enddate`, and `daterange`. Temporarily set the evergreen image.
* Enable the "early" carousel item (`/site/data/carousel/bike-summer-early.yaml`) by setting `disabled: false`. 


### Ramping up

approx. April–early May

* Change `/site/content/bike-summer-calendar.md` page type back to `calfestival`.
* Set `params.festival.active` to `true` in `hugo.toml`; this will enable most of the conditional content
* Update `params.festival.banner-image` in `hugo.toml`
* Disable the "early" carousel item
* Enable the regular carousel item; update the year and image
* Uncomment the promo blurb on `/site/content/pages/bike-summer.md`


### Closer to the start

approx. early to mid May

* Merch sales:
  * Set `params.festival.merchSaleActive` to `true` once merch sales open up
  * Describe the merch pre-order deadline in `params.festival.merchSaleInfo`; this typically won't be available until early May
  * If there any changes to merch sales, like a second round of orders, update `params.festival.merchSaleInfo` again
  * If needed, update `params.festival.merchSaleURL`
* Print calendar:
  * If a print calendar is being prepared, set `params.festival.printCalendarActive` to `true`
  * Set `params.festival.printCalendarDate` to the print deadline date
  * Once the print deadline passes, set `params.festival.printCalendarActive` to `false`


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

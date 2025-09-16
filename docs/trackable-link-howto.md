
# Tracking usage of some specific link to the homepage

--------------

For some reason, you want to be able to track specific usage of some link that you want to go to an already-existing page (such as the homepage or the mission statement page).  Perhaps it's for backing a QR code, or some other time sensitive campaign such as a reference from a news article or partner.  It doesn't really matter why, we'll just demonstrate how and speak to the limitations of this system.


## create a Netlify redirect

Since [Netlify](https://www.netlify.com) hosts the front-end of our site, most visitors who don't have a specific link to e.g. an event or something (URL will look like https://api.netlify.com/something) will end up at their service first, so that's a natural and relatively straightforward place to configure this.

We'll use [Netlify's redirects facility](https://docs.netlify.com/manage/routing/redirects/overview/) to accept the traffic and point it somewhere.  We configure these redirects in code in the [`netlify.toml`](https://github.com/shift-org/shift-docs/blob/main/netlify.toml) file.  Here's the sample stanza we've added and left in place for testing:


        [[redirects]]
          from = "/campaign1"
          to = "/"
          status = 301

This redirect will take all visitors to `https://www.shift2bikes.org/campaign1` (or `http://shift2bikes.org/campaign1`) and tell their browser to head to the homepage (`/`) instead.  But in the meantime, [Netlify's analytics service](https://docs.netlify.com/manage/monitoring/project-analytics/overview/) has tracked the initial visit and will show some stats for it assuming it is one of the top URL's accessed within a time period (last day, last week, or last month).

Anyone with access to our Netlify account can help you check out the analytics at this page:  [https://app.netlify.com/projects/shift-docs/metrics/analytics](https://app.netlify.com/projects/shift-docs/metrics/analytics).  There is a drop-down near the top that changes the view to day/week/month time periods.

You can add any number of these vanity URL's which can be tracked differently.

## Other ways we could do this

- Without doubt more flexible would be to create a backend route such as `api.shift2bikes.org/campaign` and handle logic such as saving visit count in the database at browse time.  But also a bit more work tp set up.

- We could also have a simple [Netlify function](https://www.netlify.com/platform/core/functions/) that saves the count on visit that would show even a single visit.

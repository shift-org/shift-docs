# Usage Guidelines for consuming shift event data
## Last updated April, 2026
### Terms

We welcome non-commercial aggregation of our event data to reach a wider audience of riders.  If you wish to use this data commercially, please contact [bikecal@shift2bikes.org](mailto:bikecal@shift2bikes.org) to discuss terms (for instance, we might require you to make a donation to our non-profit or remove contact information before reposting).

Failure to obey these requests may result in us blocking your requests without notice.  Conditions for importing our data may change at any time at our discretion.

### Conditions

1. Do not abuse our service with frequent or rapid queries (automated time range or single event queries should each be made a maximum of once a day and at a rate of less than 15 per minute.  Real-time user-initiated requests may occur more often.)  Requests should always be made sequentially, not in parallel.
2. Follow our best practices around caching and not refetching unchanged images [as outlined in this usage doc](https://github.com/shift-org/shift-docs/blob/main/docs/CALENDAR_API.md#fetching-event-images).  Note that we specifically change the image filename if a new image is uploaded!  Please don't link to our event images outside of the context of a ride.
3. All requests for our data from your service should use a clear, individual `User-Agent` identifying HTTP request header (e.g. `User-Agent: mycoolapp.com email bob@mycoolapp.com for questions`).  We like to know who is consuming our data; we won't expose your UA to the public.
4. When showing our data, clearly label it as coming from, and attribute it to, shift (linking to [www.shift2bikes.org](https://www.shift2bikes.org)).  **Do not represent our data as your own data.**
5. If your site would like to create or edit event data, please [contact us](mailto:bikecal@shift2bikes.org) before you implement this feature.
6. Do not misuse contact information published with events.
7. Do not resell our event or contact data.
8. All event data including images is presumed to be the property of the ride creator.
9. If in doubt, try to tailor your API usage to the spirit of our [Code of Conduct](https://www.shift2bikes.org/pages/shift-code-of-conduct/).


### Usage

To get this event data, please either:

1.  follow the API usage instructions in [CALENDAR_API.md](CALENDAR_API.md) OR
2.  use the ICS feed we provide: [www.shift2bikes.org/cal/shift-calendar.php](https://www.shift2bikes.org/cal/shift-calendar.php)

Please do not scrape full HTML pages from our website; all data is available via API

Note that outside of the ICS feed, we do not offer push notifications should an event creator change things about their event, though in practice this sort of change after publishing is fairly rare.

Please [contact the calendar crew](mailto:bikecal@shift2bikes.org) if you have any questions about your usage; we'll be happy to advise or review your high-level algorithm to ensure it meets best practices and the rest of our terms.

# Usage Guidelines for consuming shift event data
--
## Last updated April, 2026

### Terms

We welcome non-commercial aggregation of our event data to reach a wider audience of riders.  If you wish to use this data commercially, please contact [bikecal@shift2bikes.org](mailto:bikecal@shift2bikes.org) to discuss terms (for instance, we might require you to make a donation to our non-profit or remove contact information before reposting).

Failure to obey these requests may result in blocking your requests without notice.  Conditions for importing our data may change at any time at our discretion.

### Conditions

1. Do not abuse our service with queries (time-range queries should be made a maximum of once a day).
2. Follow our best practices around caching and not refetching unchanged images [as outlined in this usage doc](https://github.com/shift-org/shift-docs/blob/main/docs/CALENDAR_API.md#fetching-event-images).
3. All requests for our data from your service should use a clear, individual `User-Agent` identifying HTTP request header (e.g. `User-Agent: mycoolapp.com email bob@mycoolapp.com for questions`).  We like to know who is consuming our data; we won't expose your UA to the public.


### Usage

 To get this event data, please either:

1.  follow the API usage instructions in [CALENDAR_API.md](CALENDAR_API.md)
2.  use the ICS feed we provide: [www.shift2bikes.org/cal/shift-calendar.php](webcal://www.shift2bikes.org/cal/shift-calendar.php)

Note that outside of the ICS feed, we do not offer push notifications should an event creator change things about their event, though in practice this sort of change after publishing is fairly rare.

Please [contact the calendar crew](mailto:bikecal@shift2bikes.org) if you have any questions about your usage; we'll be happy to advise or review your high-level algorithm to ensure it meets best practices and the rest of our terms.

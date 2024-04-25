Some ideas for caching the ical feed:

Outline:
   1. generate a "checksum" for a range of dates with a single database query.
   2. determine if there's cached data for that checksum.
   3. if so, return the cached data; if not, generate the data, store the data for that checksum, and return the generated data. 
   4. report the checksum as an html [etag](https://en.wikipedia.org/wiki/HTTP_ETag)
   5. have a server side to validate the checksum when requested.

Checksum generation
-------------------

How should the checksum work, and what would the query be to generate it?

Within the specified range: combine the id of the largest event time with the most recent modified time of any event or time and hash the result.

By incorporating the maximum id -- but the times of the requested range -- the algorithm can produce a checksum that's valid over multiple similar ranges.

( A similar thing could be done for single events, but those will build faster and be requested more rarely. )

Checksum querying
----------------
    
``` 
$q = <<<'EOD'
select GREATEST(MAX(caldaily.modified), MAX(calevent.modified)),
MAX(caldaily.pkid) 
from caldaily 
left join calevent 
on caldaily.id = calevent.id
where eventdate >= %d and eventdate <= %d;
EOD;
global $database;
$result = $database->unbufferedQuery($q, $firstDay, $lastDay);
``` 

Server storage:
-------------

Possible Options :
  1. In memory: store the latest version in memory all the time. nice and simple; just have to be careful to not stomp cached data across multiple simultaneous requests.
  1. Memcached: same idea, just store the data out at the [memcached](https://en.wikipedia.org/wiki/Memcached) level. this might be good for use with some sort of etag caching or checking.
  1. Ngnix etag caching: https://www.nginx.com/blog/nginx-caching-guide/
  1. Varnish:: ???
  
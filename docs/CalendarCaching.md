
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
  1. apcu
  1. Ngnix etag caching
  1. Using mysql 
  1. Varnish
  

### APCU 

this seems the most promising solution. apcu is a common php extension that can communicate data across requests.

while not the most efficient solution, its simple enough:
```
  $tag = calculate_tag();
  $res = apcu_fetch("allEvents");
  if (!$res || $res->tag != $tag) {
	  $res = object [ 
		  'body' => buildCalendar(),
		  'tag' => tag,
	  ];
	  apcu_store("allEvents", $res);
  }
  return $res->body;
```

### Ngnix:  

While nginx can [cache based on etags](https://www.nginx.com/blog/nginx-caching-guide/), it would need to check with the application to run the query to determine if the etag is valid .... it seems to require the "plus" version for dynamic query caching.

### Sql: 

Without something to clear out the cache periodically, the best we could probably do is a single "all events" cache:a single table containing a single row with "hash", "contents". this is the same idea as the apcu, but probably slower due to mysql communication ( serialization ) overhead.


### Varnish 

Seems like a big thing to add for this one feature, and i know nothing about it other than it exists to do things like this....
use cases
------

1. no image
2. stable case ( ex. GET to display an event or no change to an image on POST )
3. legacy image file request
4. uploading a new image


in the legacy case ( 3 ), say, for example, there is an old event with id `666` and an image called `legacy.png`. The php renames the file ( even during a GET ) to match its id ( ie. `666.png` ) and this becomes the stable case ( 2 ) thereafter.

calevent image field examples
--------------------

1. blank
5. **legacy name** -- i have no idea if any of these actually exist, but some images used to have a format different than the "base format". ( maybe some `legacy.png` )
3. **base format** -- the db record matches the file on disk. its name follows from the event id. for example, for event `123` the image field is `123.png`
4. **extended format** -- for cache busting, appends the calevent sequence number to the base format. for example, the image field might be `123-44.png`
2. **upload finalized** -- in `manage_event.php` `upload_attached_file()`, after the upload has completed but before event management has finished, the event image field gets updated to match the name of the uploaded file. This name is determined by the flourish file uploader. It is temporary, and will become the base ( or extended ) format after `updateImageUrl()` is called.
	
filenames on disk
------------------

1. **pre-upload**, the image has whatever name the user has assigned: ex. `/my/local/computer/puppet.png`
2. **upload in progress**, flourish appears to upload files to a temp directory on the server with a randomly assigned temporary name: ex, maybe, `/tmp/tmphhh`
2. **upload finalized**, flourish assigns a unique, non conflicting name based on the user's original file. For example: `/opt/backend/eventimages/puppet.png` or if there is already some `puppet.png` on the server, `/opt/backend/eventimages/puppet_copy_1.png`.  This name is not stored to the db, only set in memory.
3. any time **updateImageUrl()** is called, the php code may rename the image file. It uses a name based on the event id. For example, for event 123, `/opt/backend/eventimages/123.png`. **Note:** this is the same as the "base format", it's never the "extended format".


image urls
------------

1. **legacy** -- for example, some `https://shift2bikes.org/eventimages/legacy.png`. these are  handled by the `ngnix shift.conf` `location /eventimages` directive, and plucked directly from the  `/opt/backend/eventimages` directory ( i believe they have a 48hr expiration. )
2. **base format** -- these are handled just like the legacy format. they return files of the same name directly from the `/opt/backend/eventimages` directory. For example: `https://shift2bikes.org/eventimages/123.png` returns `/opt/backend/eventimages/123.png`
3. **extended format** -- these are handled by an nginx regex directive which strips the sequence number and returns the base format. For example: `https://shift2bikes.org/eventimages/123-44.png` returns `/opt/backend/eventimages/123.png`. This ensures even stale links can find the right image no matter what.
use cases
------

1. no image
2. stable case ( ex. GET to display an event or no change to an image on POST )
3. legacy image file request
4. uploading a new image


in the legacy case ( 3 ), an old event might have an image stored under a name unrelated to its id ( ex. `legacy.png` ). these files are served directly by their stored name.

calevent image field examples
--------------------

1. blank
5. **legacy name** -- i have no idea if any of these actually exist, but some images used to have a format different than the "base format". ( maybe some `legacy.png` )
3. **base format** -- the db record matches the file on disk. its name follows from the event id. for example, for event `123` the image field is `123.png`
4. **extended format** -- for cache busting, appends the calevent sequence number to the base format. for example, the image field might be `123-44.png`
2. **upload finalized** -- when an image is uploaded, `manage_event` ( `app/endpoints/manage_event.js` ) saves the file via `app/uploader.js` and sets the image field to the extended format, `<id>-<sequence><ext>`. the sequence number comes from the event's `changes` counter.
	
filenames on disk
------------------

1. **pre-upload**, the image has whatever name the user has assigned: ex. `/my/local/computer/puppet.png`
2. **uploaded**, the upload is received in memory by [multer](https://github.com/expressjs/multer) ( see `app/uploader.js` ), so no temporary file is left on disk.
3. **stored**, `uploader.write()` writes the file under a name based on the event id, in the directory set by `config.image.dir`. for event 123, that's ex. `/opt/backend/eventimages/123.png`. **Note:** this is always the "base format", never the "extended format"; the sequence number only appears in the db image field and the url.


image urls
------------

1. **legacy** -- for example, some `https://shift2bikes.org/eventimages/legacy.png`. these are  handled by the `ngnix shift.conf` `location /eventimages` directive, and plucked directly from the  `/opt/backend/eventimages` directory ( i believe they have a 48hr expiration. )
2. **base format** -- these are handled just like the legacy format. they return files of the same name directly from the `/opt/backend/eventimages` directory. For example: `https://shift2bikes.org/eventimages/123.png` returns `/opt/backend/eventimages/123.png`
3. **extended format** -- these are handled by an nginx regex directive which strips the sequence number and returns the base format. For example: `https://shift2bikes.org/eventimages/123-44.png` returns `/opt/backend/eventimages/123.png`. This ensures even stale links can find the right image no matter what.
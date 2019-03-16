## Overview

Shift's calendar event data is stored in a mysql database running on api.shift2bikes.org.  This has some "How do I?" tips and tricks for people who need to update or use that data directly.

## Common tasks

- How can I find the URL for an event to be edited?
1. Start in `api.shift2bikes.org:/opt/shift-docs`
2. `./shift mysql`
3. Find the event.  Best way is probably to search by case-sensitive exact title, but make sure you're looking at the correct event in case there have been several with the same title over the years.  Looking for the most recently modified one will USUALLY be correct.  For instance: `select * from calevent where title="Thursday Night Ride" order by modified desc limit 1;`
4. Get the password and ID for that event, for instance:  `select id,password from calevent where title="Thursday Night Ride" order by modified desc limit 1;`
5. Construct the URL:  https://shift2bikes.org/addevent/edit-ID-PASSWORD
6. Before sharing, test the URL in your browser - does it load successfully and does that look like the right event?

- How can I set a password for an event without one? (so that we can create an edit link)
1. Start in `api.shift2bikes.org:/opt/shift-docs`
2. `./shift mysql`
3. Find the event.  Best way is probably to search by case-sensitive exact title
, but make sure you're looking at the correct event in case there have been seve
ral with the same title over the years.  Looking for the most recently modified one will USUALLY be correct.  For instance: `select * from calevent where title="Thursday Night Ride" order by modified desc limit 1;`.  
4. If that is the right event, you need the ID field: `select ID from calevent where title="Thursday Night Ride" order by modified desc limit 1;`
5. Update the event.  You can use any password, make it a little hard to guess: `update calevent set password="hard-to-guess" where id=7283;
6. Now you can do steps 5 and 6 from the previous question to create the URL.

## Who knows more?

@fool (gently@gmail.com) and @carrythebanner .  Best to reach them and the rest of the crew as bikecal@shift2bikes.org

<?php
/** 
 * While date status doesn't exist as its own class, its a common structure, so this is here as documentation.
 * 
 * A date status acts as a potential "EventTime" (caldaily) database entry.
 * It contains one or more of the following fields: 
 * 
 *   'id':   EventTime primary key.
 *   'date': YYYY-MM-DD ( ex. 2006-01-02 )
 *   'status': a single letter: 'A' for active, or 'C' for cancelled.
 *   'newsflash': a bit of text from the organizer, typically for canceled or rescheduled events.
 *
 * Only 'date' is required because, for example, 'id' might not exist 
 * if the organizer is requesting a new day for an event.
 * 
 * see also: shift-docs/site/public/js/cal/datepicker.js
 */
<?php
	# This view generates an RSS feed ("Really Simple Syndication")
	# listing the calendar events for today and tomorrow.  Each event
	# has a link to its description in the "view3week.php" view, where
	# users can read the event's full description.

	include("include/common.php");
  header("Content-type: text/calendar");
	header("Cache-control: private");
  
  # get id for event we want to display
  $event_id = $_REQUEST['eventId'];
  if (!$event_id) die();
  
  # connect to the database
	
	

	$result = mysql_query("SELECT calevent.*, caldaily.* FROM calevent, caldaily WHERE caldaily.id = calevent.id AND calevent.id = \"${event_id}\"", $conn) or die(mysql_error());

  $event = mysql_fetch_object($result);
  
	# Generate the iCal formatted output for  this specific entry.
  # Using DURATION field instead of DTEND. Not always specified
  # and open-ended events with an evenduration of 0 may span
  # the entire day when added to a calendar.
  
  # NOTE: the "DURATION" field is occasionally zero so we multiply
  # that by 1 just so we don't get en empty return which might
  # cause Safari/Google Cal and other calendars to choke.

  ?>BEGIN:VCALENDAR
VERSION:2.0
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
DTSTART:<?php echo date('Ymd', strtotime($event->eventdate)) .  "T" . date('His', strtotime($event->eventtime)) . "Z\n"; ?>
DURATION:PT<?php echo ($event->duration * 1). "M\n"; ?>
DESCRIPTION:<?php print $event->descr . "\n"; ?>
URL:http://shift2bikes.org
LOCATION:<?php echo $event->address . "\n"; ?>
UID:event<?php echo $event->id ?>@shift2bikes.org
STATUS:CONFIRMED
SUMMARY:<?php echo $event->title . "\n"; ?>
END:VEVENT
END:VCALENDAR
<?php
	# This view generates a JSON feed
	# listing the calendar events for the next 14 days. 

	include("include/common.php");
	header("Content-type: text/json");
	header("Cache-control: private");
  
  # connect to the database
	
	

	# Compute $today and $tomorrow.  This is slightly complicated by the
	# fact that Thinkhost uses the Eastern timezone, not Pacific.
  
	$start_date = date("Y-m-d", time() - 3600 * TZTWEAK);
  $days_ahead = 14;
  $end_date = date("Y-m-d", time() + 3600 * (24 * $days_ahead - TZTWEAK));
  
	$result = mysql_query("SELECT calevent.id as id, newsflash, image, tinytitle, weburl, image, eventdate, eventtime, timedetails, locname, address, locdetails, printdescr, audience FROM calevent, caldaily WHERE caldaily.id = calevent.id AND eventdate >= \"${start_date}\" AND eventdate <= \"${end_date}\" AND eventstatus != \"C\" AND eventstatus != \"E\" AND eventstatus != \"S\" ORDER BY eventdate,eventtime", $conn) or die(mysql_error());
  
  $audience_array = array(
    "G" => "General", 
    "F" => "Family-friendly",
    "A" => "21+"
  	);

  $events = array();
  while ($event = mysql_fetch_object($result)) {
      $image_info = pathinfo($event->image);
      $event->image = 'http://www.shift2bikes.org/cal/eventimages/' . $event->id . '.' . $image_info['extension'];
      $event->audience = $audience_array[$event->audience];
      $events[] = $event;      
  }

  echo json_encode($events);
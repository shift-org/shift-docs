<?php

include('../init.php');
include('../iCalExporter.php');

header( 'Content-type: text/calendar; charset=utf-8' );
header( 'Content-Disposition: inline; filename=calendar.ics' );


if (isset($_GET['id'])) {
	$event_id = $_GET['id'];
	$event = new Event($event_id);
	if ($event) {
		echo (new iCalExporter( $event->buildEventTimes('id') ))->export();
	}
	else {
		http_response_code(404);
	}
}
else {
    if (isset($_GET['startdate']) && ($parseddate = strtotime($_GET['startdate']))) {
        $startdate = $parseddate;
    } else {
        $startdate = time();
    }

    if (isset($_GET['enddate']) && ($parseddate = strtotime($_GET['enddate']))) {
        $enddate = $parseddate;
    } else {
        $enddate = time();
    }

    if ($enddate < $startdate) {
        http_response_code(400);
    } else {
		$eventTimes = EventTime::getRangeVisible($startdate, $enddate);

        echo (new iCalExporter($eventTimes))->export();
    }
}

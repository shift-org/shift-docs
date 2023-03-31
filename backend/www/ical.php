<?php
/**
 * ical: Return a ical event file containing the latest events, a single event, or a range of events.
 * 
 * Optionally can use query parameters to specify an event id, or a start and end time.
 * Times are in YYYY-MM-DD format. If no parameters are specified, it returns the "all events" feed.
 * 
 *   https://localhost:4443/api/ical.php
 *   https://localhost:4443/api/ical.php?id=998
 *   https://localhost:4443/api/ical.php?startdate=2023-05-25&enddate=2023-06-25
 * 
 * `See also:
 *   AllEvents.md
 */
include('../init.php');

// fix: an alternate calendar with the same events branded for pedalpalooza?
$calconfig = (object) [
	'name' => 'Shift Bike Calendar',
	'desc' => 'Find fun bike events and make new friends!',
	'guid' => 'shift@shift2bikes.org',
	'prod' => '-//shift2bikes.org//NONSGML shiftcal v2.1//EN'
];

if (isset($_GET['id'])) {
	echo exportOne($calconfig, $_GET['id']);
} elseif (isset($_GET['startdate']) || isset($_GET['enddate'])) {
	echo exportStringRange($calconfig, $_GET['startdate'], $_GET['enddate']);
} else {
	echo exportCurrent($calconfig);
}

// ---------------------------------
// the main export functions:
// ---------------------------------

// Return all of the occurrences of a single event in ical format as a string.
// id is a calevent id.
function exportOne($cfg, $id) {
	$event = Event::getByID($id);
	if (!event) {
		return http_response_code(400);
	}
	$eventTimes = $event->buildEventTimes('id');
	return buildCalendar($cfg, $eventTimes);
}

// Return some good range of past and future events in ical format as a string.
function exportCurrent($cfg) {
	$start = new DateTime(); // now.
	$end = clone $start; // also now.
	$start->sub(new DateInterval('P3M'));
	$end->add(new DateInterval('P3M'));
	$eventTimes = EventTime::getRangeVisible($start->getTimestamp(), $end->getTimestamp());
	return buildCalendar($cfg, $eventTimes);
}

// Return a range of events in ical format as string,
// where start and end are strings specified as YYYY-MM-DD ( ex. 2006-01-02 )
function exportStringRange($cfg, $start, $end) {
	$start = strtotime($start); // returns false or -1 when it cant parse
	$end = strtotime($end); 
	if ($end < $start) {
		return http_response_code(400);
	} elseif (daysInRange($start, $end) > 100) {
		return http_response_code(400);
	}
	
	$eventTimes = EventTime::getRangeVisible($start, $end);
	return buildCalendar($cfg, $eventTimes);
}

// ---------------------------------
// the internals:
// ---------------------------------
/**
 * Turn a list of EventTime records into an ical VCALENDAR.
 * @param  object  $cal        A calendar config object.
 * @param  array<EventTime>    Occurrences to turn into calendar entries.
 * @return string              The vcalendar as a string.
 * @see https://datatracker.ietf.org/doc/html/rfc5545#section-3.6.1
 */ 
function buildCalendar($cal, $eventTimes) {
	ob_start(); // grab the echo.
	echo  <<<EOD
BEGIN:VCALENDAR
VERSION:2.0
PRODID:$cal->prod
METHOD:PUBLISH
X-WR-CALNAME:$cal->name
X-WR-CALDESC:$cal->desc
X-WR-RELCALID:$cal->guid\n
EOD;
	foreach ($eventTimes as $eventTime) {
		echo buildCalEvent($eventTime);
	}
	echo  <<<EOD
END:VCALENDAR
EOD;
	// get all our echo'd text.
	$output = ob_get_clean();
	// standardize newlines to \n ( in case they are \r\n )
	$output = str_replace(PHP_EOL,"\n", $output);
	// then change them all to the ical way:
	$output = str_replace("\n", "\r\n", $output);
	return $output;
}

/**
 * Turn an EventTime record into a single ical VEVENT.
 * @param  EventTime  $at 
 * @return string     The vevent as a string.
 * @see https://datatracker.ietf.org/doc/html/rfc5545#section-3.6.1
 */ 
function buildCalEvent($at) {
	$evt = $at->getEvent();

	// the start time is the event time plus the occurrence date; and both are in portland time.
	// ( the event time is ex. 15:04:05, in local time. hours, minutes, seconds )
	$local = new DateTimeZone( "America/Los_Angeles" );
	list( $hour, $minute, $second ) = explode(':', strval($evt->getEventtime()));
	$startOffset = new DateInterval('PT'.$hour.'H'.$minute.'M'.$second.'S');
	$startAt = (new DateTimeImmutable($at->getEventdate(), $local))->add($startOffset);
	
	// the end time uses the event duration, ensuring a default time of one hour.
	$duration = $evt->getEventduration();
	if ($duration != null && $duration > 0) {
		$duration = new DateInterval('PT'.$duration.'M');
	} else {
		$duration = new DateInterval('PT1H');
	}
	$endAt = $startAt->add($duration);

	// use the ambient timezone for created and modified:
	// "MySQL converts TIMESTAMP values from the current time zone to UTC for storage. 
	// Then, MySQL converts those values back from UTC to the current time zone for retrieval."
	// https://dev.mysql.com/doc/refman/8.0/en/datetime.html
	$created = new DateTimeImmutable($evt->getCreated());
	$modified = new DateTimeImmutable($evt->getModified());
	$utc = new DateTimeZone( 'UTC' ); // use utc for output as per ical format.
	
	// setup the needed variables
	$uid = "event-" . $at->getPkid() . "@shift2bikes.org";
	$url = $at->getShareable();
	$summary = escapeBreak("SUMMARY:", $evt->getTitle());
	$contact = escapeBreak("CONTACT:", $evt->getName());
	$description = escapeBreak("DESCRIPTION:", $evt->getTimedetails(), $url);
	$location = escapeBreak("LOCATION:", $evt->getLocname(), $evt->getAddress(), $evt->getLocdetails());
	$status =  $at->getCancelled() ? "CANCELLED" : "CONFIRMED";
	$start = dateFormat( $startAt, $utc );
	$end = dateFormat( $endAt, $utc );
	$created = dateFormat( $created, $utc );
	$modified = dateFormat( $modified, $utc );
	$sequence = $at->getChanges() + 1;

	return <<<EOD
BEGIN:VEVENT
UID:$uid
$summary
$contact
$description
$location
STATUS:$status
DTSTART:$start
DTEND:$end
CREATED:$created
DTSTAMP:$modified
SEQUENCE:$sequence
URL:$url
END:VEVENT\n
EOD;
}

// ---------------------------------
// misc helpers:
// ---------------------------------

function dateFormat( $dt, $utc ) {
	return date_format( $dt->setTimeZone($utc), 'Ymd\THis\Z' );
}

/**
 * Determine the distance in days between the passed two timestamps.
 * copied from events.php.
 */ 
function daysInRange($startdate, $enddate) {
    $days = 86400; // seconds in a day
    return round(($enddate / $days) - ($startdate / $days));
}

/**
 * Format a set of strings for ical, word-wrapping if necessary.
 * Note: the returned string uses bare newline, not carriage return, 
 * the caller is responsible for adding those.
 * 
 * @param string        $row     The lede text of the ical row, including a colon. ( ex. "SUMMARY:" ) 
 * @param array<string> $strings One or more strings to join into newlines.
 *  
 * https://datatracker.ietf.org/doc/html/rfc5545#section-3.3.11
 */ 
function escapeBreak($row, ...$strings) {
	// join manually so we can skip empty strings.
	$str = "";
	foreach ($strings as $s) {
		$s = trim($s);
		if (!empty($s)) {
			if ($str) {
				$str .= "\n";
			}
			$str .= $s;
		}
	}
	// An intentional formatted text line break MUST only be included
	// [as a] BACKSLASH, followed by a LATIN SMALL LETTER N...
	// A BACKSLASH ... MUST be escaped with another BACKSLASH character.
	// A COMMA ... MUST be escaped...
	// A SEMICOLON ... MUST be escaped...
	$replaceWhat = array( '\\', "\n", ',',  ';' );
	$replaceWith = array( '\\\\', '\n', '\,', '\;' );
	$str = str_replace( $replaceWhat, $replaceWith, $str );

	// Lines of text SHOULD NOT be longer than 75 octets [bytes], excluding the line
	// break... a long line can be split between any two characters by inserting a CRLF
	// immediately followed by a single linear [space].
	//
	// 74 is best therefore to fit the required leading space.
	// ( there's probably some client where a 75 letter word wont get
	// rejoined if its split at the 74th char... but oh well. don't have words 74 characters long i guess. )
	//
	// for php, we have to use 73 because wordwrap chomps the spaces between words when they break lines
	// but ical needs us to preserve the original spacing.
	//
	// note: we are only injecting "\n " here, and will replace those with the "\r\n" later.
	return wordwrap($row . $str, 73, " \n ");
}

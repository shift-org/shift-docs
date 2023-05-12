<?php
/**
 * Events: Displays one or more event times.
 * Used for browsing the calendar so people can find information about interesting rides.
 * 
 * This endpoint supports two different queries:
 *   id=caldaily_id ( the time id )
 *   startdate=YYYY-MM-DD & enddate=YYYY-MM-DD
 * 
 * For example:
 *   https://localhost:4443/api/events.php?id=13662
 *   https://localhost:4443/api/events.php?startdate=2023-03-19&enddate=2023-03-29
 * 
 * In both cases it returns a list of events as a JSON object:
 *  {
 *      events: [
 *          {
 *          },
 *          ...
 *      ]
 *  }
 *
 * If there is a problem the error code will be 400 with a json response of the form:
 *  {
 *      "error": {
 *          "message": "Error message"
 *      }
 *  }
 * 
 * See also:
 *  https://github.com/shift-org/shift-docs/blob/main/docs/CALENDAR_API.md#viewing-events
 * 
 */
include('../init.php');

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

$json = array();

function daysInRange($startdate, $enddate) {
    $days = 86400; // seconds in a day
    return round(($enddate / $days) - ($startdate / $days));
}

if ($enddate < $startdate) {
    $message = "enddate: " . date('Y-m-d', $enddate) . " is before startdate: " . date('Y-m-d', $startdate);
    $json = text_error( $message );
    
} elseif (daysInRange($startdate, $enddate) > 100) {
    $message = "event range too large: " . daysInRange($startdate, $enddate) . " days requested; max 100 days";
    $json = text_error( $message );

} else {
    $json['events'] = array();

    if (isset($_GET['id'])) {
        $events = EventTime::getByID($_GET['id']);
    }
    else {
        $events = EventTime::getRangeVisible($startdate, $enddate);
    }

    foreach ($events as $eventTime) {
        try{
            $json['events'] []= $eventTime->toEventSummaryArray();
        } catch( Exception $ex ) {
            // For now, ignore
        }

    }
}
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: $ORIGIN");
fJSON::output($json);  // https://flourishlib.com/api/fJSON.html

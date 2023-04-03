<?php
/**
 * Retrieve Event: returns the summary of an event and all of its event times.
 * Used for displaying a ride to its organizer so they can edit the ride.
 * Expects an calevent id (and optionally, its matching secret) using url query parameters. 
 * 
 * For example:
 * https://localhost:4443/api/retrieve_event.php?id=595&secret=197ff456e6b92ceb398bd19b60621905
 * 
 * On success, returns a json summary of event.
 * If there was an error ( for example, if the id was missing or the event wasn't found )
 * returns http 400 "Bad Request" with a json error response ( see errors.php )
 * 
 *  See also: 
 *  https://github.com/shift-org/shift-docs/blob/main/docs/CALENDAR_API.md#retrieving-public-event-data
 */
include('../init.php');

if (!isset($_GET['id'])) {
    $response = text_error("Request incomplete, please pass an id in the url");
} else {
    $event = Event::getByID($_GET['id']);
    if (!$event) {
        $response = text_error('Event not found');
    } else {
        $secret_valid = $event->secretValid($_GET['secret']);
        $response = $event->toDetailArray($secret_valid);
    }
}

header('Content-Type: application/json');
header("Access-Control-Allow-Origin: $ORIGIN");
fJSON::output($response);

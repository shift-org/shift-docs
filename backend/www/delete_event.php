<?php

/**
 * Delete Event: Removes an event from the calendar. 
 * Expects a JSON post with an id and password.
 * 
 *  You can use curl to post json for testing. For example:
 *    curl -k -H 'Content-Type: application/json' -X POST --data-binary \
 *    "@delete_event.json" https://localhost:4443/api/delete_event.php
 *  {
 *      "id": "6245",
 *      "secret": "example"
 *   }
 * 
 * If there was an error ( for example, if the id was missing or the event wasn't found )
 * returns http 400 "Bad Request" and a json error response (see errors.php)
 *
 */

include('../init.php');

function build_json_response() {
    if (!isset($_POST['json'])) {
        $data = json_decode(file_get_contents('php://input'), true);
    } else {
        $data = json_decode($_POST['json'], true);
    }
    if (!$data) {
        return text_error('JSON could not be decoded');
    }

    if (!$data['id']) {
        return text_error('Missing ID');
    }

    // get the event.
    $event = Event::getByID($data['id']);

    // verify the event exists.
    if (!$event) {
        return text_error('Event not found');
    }

    // validate the password.
    if (!$event->secretValid($data['secret'])) {
        return text_error('Invalid secret, use link from email');
    }

    // if the event was never published, we can delete it completely.
    if (!$event->isPublished()) {
        try{
            $event->delete();
        } catch(Exception $ex) {
            error_log("couldn't delete event" . $ex->getMessage());
            return text_error('Server error');
        }
    } else {
        try{
            $event->cancelEvent();
        } catch(Exception $ex) {
            error_log("couldn't cancel event " . $ex->getMessage());
            return text_error('Server error');
        }
    }
    return array('success' => true);
}

ob_start();
$response = build_json_response();
$contents = ob_get_contents();
ob_end_clean();
if ($contents) {
    $response['contents'] = $contents;
}
header('Content-Type: application/json');
header('Accept: application/json');
header("Access-Control-Allow-Origin: $ORIGIN");
echo json_encode($response);

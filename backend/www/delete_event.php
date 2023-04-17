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
        return array(
            'error' => array(
                'message' => 'JSON could not be decoded'
            )
        );
    }

    if (!$data['id']) {
        return array(
            'error' => array(
                'message' => 'Missing ID'
            )
        );
    }

    // Converts data to an event, loading the existing one if id is included in data
    $event = Event::fromArray($data);

    if (!$event->exists()) {
        return array(
            'error' => array(
                'message' => 'Event not found'
            )
        );
    }

    // Else
    if ($event->exists() && !$event->secretValid($data['secret'])) {
        return array(
            'error' => array(
                'message' => 'Invalid secret, use link from email'
            )
        );
    }
    try{
        $event->delete();
    } catch(Exception $ex) {
        return array(
            'error' => array(
                'message' => 'Server error'
            )
        );
    }
    return array(
        'success' => true
    );
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
if (array_key_exists('error', $response))
    http_response_code(400);
echo json_encode($response);

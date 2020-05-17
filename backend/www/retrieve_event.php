<?php
include('../init.php');

/**
 * This endpoint returns the detail of an event with the ID passed in with the GET parameter id
 *  JSON:
 *  {
 *
 *  }
 *
 * If there is a problem the error code will be 400 with a json response of the form:
 *  {
 *      "error": {
 *          "message": "Error message"
 *      }
 *  }
 */

$response = array();

if (isset($_GET['id'])) {
    $event_id=$_GET['id'];

    try {
        // get event by id
        $event = new Event($event_id);
        $secret_valid = isset($_GET['secret']) && $event->secretValid($_GET['secret']);

        if ($secret_valid) {
            $event->unhide();
        }

        $response = $event->toDetailArray($secret_valid);
    } catch (fExpectedException $e) {
        http_response_code(400);
        $response['error'] = array(
            'message' => $e->getMessage()
        );
    }
}
else {
    http_response_code(400);
    $response['error'] = array(
        'message' => "Request incomplete, please pass an id in the url"
    );
}

header('Content-Type: application/json');
header("Access-Control-Allow-Origin: $ORIGIN");
fJSON::output($response);

<?php

/**
 * This endpoint deletes events, expecting an ID and a secret code
 */

include(getcwd() . '/../app/init.php');

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
if (array_key_exists('error', $response))
    http_response_code(400);
header('Content-Type: application/json');
header('Accept: application/json');
echo json_encode($response);

<?php
/*
 * A way to test this endpoint is to use curl
 * Create a file test_data.json with the json you want to submit
 * curl -H 'Content-Type: application/json' -X POST --data-binary "@test.json" http://localhost:8080/shift-flourish/www/manage_event.php
 */

/**
 * This endpoint updates events, expecting a form/multipart upload with two parts, json and file[]:
 *
 *  If there is a problem the error code will be 400 with a json response of the form:
 *  {
 *      "error": {
 *          "message": "Error message"
 *          "fields": {
 *              "field1": "Error for field 1",
 *              ...
 *          }
 *      }
 *  }
 */

include(getcwd() . '/../app/init.php');

function build_json_response() {
    if (!isset($_POST['json'])) {
        return array(
            'error' => array(
                'message' => "No JSON found"
            )
        );
    }
    $data = json_decode($_POST['json'], true);
    if (!$data) {
        return array(
            'error' => array(
                'message' => "JSON could not be decoded"
            )
        );
    }

    $_POST = $data; // fValidation inspects $_POST for field data
    $validator = new fValidation();

    $validator->addRequiredFields('title', 'details', 'venue', 'address', 'organizer', 'email', 'read_comic');
    // required only from March to June, during Pedalpalooza
    $validator->addRequiredFields('tinytitle', 'printdescr');    
    $validator->addEmailFields('email');
    $validator->addRegexReplacement('#^(.*?): (.*)$#', '\2 for <span class="field-name">\1</span>');
    // If id is specified require secret
    $validator->addConditionalRule(
        array('id'),
        NULL,
        array('secret')
    );

    $messages = $validator->validate(TRUE, TRUE);
    if (!$data['read_comic']) {
        $messages['read_comic'] = 'You must have read the Ride Leading Comic';
    }
    if ($messages) {
        return array(
            'error' => array(
                'message' => 'There were errors in your fields',
                'fields' => $messages
            )
        );
    }

    $inputDateStrings = get($data['dates'], array());
    $validDates = array();
    $invalidDates = array();
    foreach ($inputDateStrings as $dateString) {
        $date =  DateTime::createFromFormat('Y-m-d', $dateString);
        if ($date) {
            $validDates []= $date;
        }
        else {
            $invalidDates []= $dateString;
        }
    }

    if ($invalidDates) {
        $messages['dates'] = "Invalid dates: " . implode(', ', $invalidDates);
    }

    if (count($validDates) === 1) {
        $data['datestype'] = 'O';
        $data['datestring'] = date_format($validDates[0], 'l, F j');
    } else {
        // not dealing with 'consecutive'
        $data['datestype'] = 'S';
        $data['datestring'] = 'Scattered days';
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

    $messages = $event->validate($return_messages=TRUE, $remove_column_names=TRUE);

    if (isset($_FILES['file'])) {
        $uploader = new fUpload();
        $uploader->setMIMETypes(
            array(
                'image/gif',
                'image/jpeg',
                'image/pjpeg',
                'image/png'
            ),
            'The file uploaded is not an image'
        );
        $uploader->setMaxSize('2MB');
        $uploader->setOptional();
        $file_message = $uploader->validate('file', TRUE);
        if ($file_message != null) {
            $messages['file'] = $file_message;
        }
        global $IMAGEDIR;
        $file = $uploader->move($IMAGEDIR, 'file');
        $event->setImage($file->getName());
    }

    if ($messages) {
        return array(
            'error' => array(
                'message' => 'There were errors in your fields',
                'fields' => $messages
            )
        );
    }

    // if needs secret generate and email
    if (!$event->exists()) {
        $includeSecret = true;
    }
    else {
        $includeSecret = false;
    }

    // If there are validation errors this starts spewing html, so we validate before
    $event->store();

    // Create/delete EventTimes to match the list of dates included
    EventTime::matchEventTimesToDates($event, $validDates);

    // Returns the created object
    $details = $event->toDetailArray(true);
    if ($includeSecret) {
        $details['secret'] = $event->getPassword();
        // Wait until after it is stored to ensure it has an id
        $event->emailSecret();
    }
    return $details;
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

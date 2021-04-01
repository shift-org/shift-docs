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

include('../init.php');

function validate_json_request($data) {
    $_POST = $data; // fValidation inspects $_POST for field data
    $validator = new fValidation();

    $validator->addRequiredFields('title', 'details', 'venue', 'address', 'organizer', 'email', 'code_of_conduct', 'read_comic');
    // required only from March to June, during Pedalpalooza
    // $validator->addRequiredFields('tinytitle', 'printdescr');
    $validator->addEmailFields('email');
    $validator->addRegexReplacement('#^(.*?): (.*)$#', '\2 for <span class="field-name">\1</span>');
    // If id is specified require secret
    $validator->addConditionalRule(
        array('id'),
        NULL,
        array('secret')
    );

    return $validator->validate(TRUE, TRUE);
}

function upload_attached_file($event, $messages) {
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
            $messages = array('file' => $file_message);
        }
        global $IMAGEDIR;
        $file = $uploader->move($IMAGEDIR, 'file');
        $event->setImage($file->getName());
    }
    return $messages;
}

function field_error($messages) {
    return array(
        'error' => array(
            'message' => 'There were errors in your fields',
            'fields' => $messages
        )
    );
}

function text_error($message) {
    return array(
        'error' => array(
            'message' => $message
        )
    );
}

function validate_date_statuses($data, $messages) {
    $validDateStatuses = array();
    $invalidDateStrings = array();

    $inputDateStatuses = get($data['datestatuses'], array());
    foreach ($inputDateStatuses as $dateStatus) {
        $dateString = $dateStatus['date'];
        $date =  DateTime::createFromFormat('Y-m-d', $dateString);
        if ($date) {
            $dateStatus['date'] = $date;
            $validDateStatuses[] = $dateStatus;
        } else {
            $invalidDateStrings []= $dateString;
        }
    }

    if ($invalidDateStrings) {
        $messages['dates'] = "Invalid dates: " . implode(', ', $invalidDateStrings);
    }

    $validatedDateStatuses = array(
        'validDateStatuses' => $validDateStatuses,
        'messages' => $messages
    );

    return $validatedDateStatuses;
}

function get_dates_type($validDateStatuses) {
    if (count($validDateStatuses) === 1) {
        return 'O';
    } else {
        // not dealing with 'consecutive'
        return 'S';
    }
}

function get_date_string($validDateStatuses) {
    if (count($validDateStatuses) === 1) {
        return date_format(end($validDateStatuses)['date'], 'l, F j');
    } else {
        // not dealing with 'consecutive'
        return 'Scattered days';
    }
}

function get_new_date_statuses($dateStatuses) {
    $newDateStatuses = array();

    foreach ($dateStatuses as $dateStatus) {
        if (empty($dateStatus['id'])) {
            $newDateStatuses []= $dateStatus;
        }
    }

    return $newDateStatuses;
}

function get_existing_date_statuses($dateStatuses) {
    $existingDateStatuses = array();

    foreach ($dateStatuses as $dateStatus) {
        if (!empty($dateStatus['id'])) {
            $existingDateStatuses[$dateStatus['id']] = $dateStatus;
        }
    }

    return $existingDateStatuses;
}

function create_new_event_times($event, $newDateStatuses){
    foreach ($newDateStatuses as $dateStatus) {
        $event->addEventTime($dateStatus);
    }
}

function update_existing_event_times($event, $existingDateStatuses) {
    $event->updateExistingEventTimes($existingDateStatuses);
}

function build_json_response() {
    if (!isset($_POST['json'])) {
        $data = json_decode(file_get_contents('php://input'), true);
    } else {
        $data = json_decode($_POST['json'], true);
    }

    if (!$data) {
        return text_error("JSON could not be decoded");
    }

    $messages = validate_json_request($data);

    if (!$data['read_comic']) {
        $messages['read_comic'] = "You must have read the Ride Leading Comic";
    }

    if (!$data['tinytitle']) {
        // if print title (aka tinytitle) isn't set,
        // use the first 24 chars of the regular title
        $data['tinytitle'] = substr($data['title'], 0, 24);
    }

    if (!$data['code_of_conduct']) {
        $messages['code_of_conduct'] = "You must agree to the Code of Conduct";
    }

    if ($messages) {
        return field_error($messages);
    }

    // Converts data to an event, loading the existing one if id is included in data
    $event = Event::fromArray($data);

    // Else
    if ($event->exists() && !$event->secretValid($data['secret'])) {
        return text_error("Invalid secret, use link from email");
    }

    $messages = $event->validate($return_messages=TRUE, $remove_column_names=TRUE);
    $messages = upload_attached_file($event, $messages);

    $validatedDateStatuses = validate_date_statuses($data, $messages);
    $validDateStatuses = $validatedDateStatuses['validDateStatuses'];
    $messages = $validatedDateStatuses['messages'];

    $data['datestype'] = get_dates_type($validDateStatuses);
    $data['datestring'] = get_date_string($validDateStatuses);

    $newDateStatuses = get_new_date_statuses($validDateStatuses);
    $existingDateStatuses = get_existing_date_statuses($validDateStatuses);

    if ($messages) {
        return field_error($messages);
    }

    // if needs secret generate and email
    if (!$event->exists()) {
        $includeSecret = true;
    } else {
        $includeSecret = false;
        // saving an existing event publishes it
        $event->unhide();
    }

    // If there are validation errors this starts spewing html, so we validate before
    $event->store();

    // The following operations must occur in the order: UPDATE -> CREATE NEW
    // Otherwise the update function will delete the newly created EventTimes
    update_existing_event_times($event, $existingDateStatuses);
    create_new_event_times($event, $newDateStatuses);

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
header('Content-Type: application/json');
header('Accept: application/json');
header("Access-Control-Allow-Origin: $ORIGIN");
if (array_key_exists('error', $response))
    http_response_code(400);
echo json_encode($response);

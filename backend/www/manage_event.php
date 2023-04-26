<?php
/**
 *  Manage Event: Updates a new or existing event and its associated times.
 *  Used by the organizer when they save or edit a ride.
 *  Expects a form/multipart upload with two parts: json and file[].
 * 
 *  You can use curl to post some json for testing. For example:
 *    curl -k -H 'Content-Type: application/json' -X POST --data-binary \
 *    "@manageEvent.json" https://localhost:4443/api/manage_event.php
 *  
 *  On success, it will return a summary of the events and its times.
 *  If there is a problem, it returns http 400 "Bad Request" with a json response of the form:
 *  {
 *      "error": {
 *          "message": "Error message"
 *          "fields": {
 *              "field1": "Error for field 1",
 *              ...
 *          }
 *      }
 *  }
 * 
 *  See also:
 *    https://github.com/shift-org/shift-docs/blob/main/docs/CALENDAR_API.md#managing-events
 *    https://localhost:4443/addevent/edit-$event_id-$secret
 *    /site/themes/s2b_hugo_theme/static/js/cal/addevent.js
 */ 
include('../init.php');

/**
 * ensure the email, title, etc. submitted by the organizer seems valid.
 * if validation fails, returns a array containing the name of each failed field and some helper html: 
 * ex. {
 *    "email": "Please enter a value for <span class=\"field-name\">Email</span>"
 * }
 */
function validate_json_request($data) {
    $_POST = $data; // fValidation inspects $_POST for field data
    $validator = new fValidation();
    // note: this checks existence of the fields; 
    // whether the code_of_conduct, etc. have been set true is determined elsewhere...
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

/**
 * receive an image from the user, and save it to the global $IMAGEDIR.
 * records that path in the passed event.
 *
 * note: initially this stores the image with the name specified by the user.
 * the first time event->getImageUrl() is called, the file is moved to match its id:
 * ex. https://shift2bikes.org/eventimages/9248.png
 * tbd: can that be done here instead?
 *
 * see also: https://flourishlib.com/docs/fUpload.html
 */
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
        } else {
            global $IMAGEDIR;
            $file = $uploader->move($IMAGEDIR, 'file');
            $event->setImage($file->getName());
        }
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

/**
 * convert dates from strings to valid php DateTime objects.
 * returns an object containing "messages" with any invalid dates.
 * 
 * 'data': can contain ['datestatuses'], a list of data status objects.
 *         ( see also DateStatus.php. : { 'id', 'date', 'status', 'newsflash' } )
 * 
 * 'messages': an object containing arbitrary {message name: message text} pairs.
 *         ( used for error messages )
 * 
 * returns {
 *  'validDateStatuses': a copy of datestatuses with 'date' replaced by valid DateTime objects.
 *  'messages': the input message array plus ['dates'] containing a single string of invalid dates.
 * }
 */
function validate_date_statuses($data, $messages) {
    $validDateStatuses = array();
    $invalidDateStrings = array();

    // get the dates, or an empty array.
    $inputDateStatuses = get($data['datestatuses'], array());
    foreach ($inputDateStatuses as $dateStatus) {
        $dateString = $dateStatus['date'];
        // try to parse the passed date ( expects, ex. 2006-01-02 )
        $date =  DateTime::createFromFormat('Y-m-d', $dateString);
        if ($date) {
            $dateStatus['date'] = $date;         // overwrite
            $validDateStatuses[] = $dateStatus;  // append
        } else {
            $invalidDateStrings []= $dateString; // append
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


// // in: the list of containing DateTime(s) from validate_date_statuses
// // out: 'O' (one day) or 'S'  (scattered)
function get_dates_type($validDateStatuses) {
    if (count($validDateStatuses) === 1) {
        return 'O';
    } else {
        // not dealing with 'consecutive'
        return 'S';
    }
}

// // in: the list of containing DateTime(s) from validate_date_statuses
// // out: ex. "Mon, Jan 2" or "Scattered days"
function get_date_string($validDateStatuses) {
    if (count($validDateStatuses) === 1) {
        return date_format(end($validDateStatuses)['date'], 'l, F j');
    } else {
        // not dealing with 'consecutive'
        return 'Scattered days';
    }
}

// return a copy of the dateStatuses filtered to those WITHOUT ids
function get_new_date_statuses($dateStatuses) {
    $newDateStatuses = array();
    foreach ($dateStatuses as $dateStatus) {
        if (empty($dateStatus['id'])) {       // no id?
            $newDateStatuses []= $dateStatus; // append the status
        }
    }
    return $newDateStatuses;
}

// return an object containing only dateStatuses WITH ids.
// the returned object uses the id as the key of the date.
// { 42: { id: 42, date: "YYYY-MM-DD" } }
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
        // read the raw request body ( ex. to handle posting a .json file for testing )
        // ( see curl statement at top of file )
        $data = json_decode(file_get_contents('php://input'), true);
    } else {
        $data = json_decode($_POST['json'], true);
    }
    //
    // validate the incoming data:
    //
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

    // exit if any fields failed basic validation:
    if ($messages) {
        return field_error($messages);
    }

    //
    // Find or create the requested event. ( finds when there's an id in the data. )
    // New events are given a new secret, and are set hidden=1 ( not yet published )
    // NOTE: overwrites any and all existing fields in the event with the user's input
    //
    $event = Event::fromArray($data);

    // if the event existed; the secret must be valid.
    if ($event->exists() && !$event->secretValid($data['secret'])) {
        return text_error("Invalid secret, use link from email");
    }

    // validates that all of the fields have compatible data types, 
    // that required values are set, uniqueness and other constraints are valid.
    // https://flourishlib.com/docs/fActiveRecord.html#WhatisValidated
    $messages = $event->validate($return_messages=TRUE, $remove_column_names=TRUE);

    // save the uploaded file (if any)
    $messages = upload_attached_file($event, $messages);

    $validatedDateStatuses = validate_date_statuses($data, $messages);
    $validDateStatuses = $validatedDateStatuses['validDateStatuses'];
    $messages = $validatedDateStatuses['messages'];

    // fix? data is not read from after this, so these calls don't have an effect.
    // they would have to be above the fromArray call.
    // this has been broken since 2019-07-12 #40045bed5f66d1ca4df897b2f0c9c5c111ed217a.
    $data['datestype'] = get_dates_type($validDateStatuses);
    $data['datestring'] = get_date_string($validDateStatuses);

    $newDateStatuses = get_new_date_statuses($validDateStatuses);
    $existingDateStatuses = get_existing_date_statuses($validDateStatuses);

    if ($messages) {
        return field_error($messages);
    }

    // if this is a new event, then we'll need to send an email ( below )
    // otherwise, updating an existing event publishes it.
    if (!$event->exists()) {
        $includeSecret = true;
    } else {
        $includeSecret = false;
        // saving an existing event publishes it
        $event->unhide();
    }

    // If there are validation errors this spews html, so we validated above.
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

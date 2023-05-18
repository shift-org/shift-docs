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
        // re: image size - see also the nginx shift.conf and edit.html.
        // ideally this would be larger nginx's limit so to allow nginx to make the real decision.
        // ( meaning, the client only has one error to handle in practical use: http 413 )
        // however, php has a "upload-max-filesize", 
        // and flourish gets unhappy when the value here is larger than that.
        // https://www.php.net/manual/en/ini.core.php#ini.upload-max-filesize
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

/**
 * Ensures that the 'datestatuses' in 'data' (if any) are valid.
 * 
 * @param array $data Contains ['datestatuses'], 
 *        A list of data status objects sent by the organizer.
 *        [{ 'id', 'date', 'status', 'newsflash' },...]
 * 
 * @param array $messages Used for error messages.
 *        An object containing arbitrary {name: string} pairs.
 * 
 * @return an array containing two values:
 *  'statuses': an array of { YYYY-MM-DD : status } pairs.
 *  'messages': the original messages with a new key 'dates', 
 *              containing a comma separated string of invalid dates.
 * 
 * @see DateStatus.php
 */
function validate_date_statuses($data, $messages) {
    $validDateStatuses = array();
    $invalidDateStrings = array();

    // get the dates, or an empty array.
    $inputDateStatuses = get($data['datestatuses'], array());
    foreach ($inputDateStatuses as $dateStatus) {
        $dateString = $dateStatus['date'];
        // try to parse the passed date ( expects, ex. 2006-01-02 )
        $date = DateTime::createFromFormat('Y-m-d', $dateString);
        if ($date) {
            // overwrite string by reformatting it.... just in case.
            // TBD: is that really necessary?
            $dateString = $date->format('Y-m-d');
            $dateStatus['date'] = $dateString;  
            $validDateStatuses[$dateString] = $dateStatus;  // map
        } else {
            $invalidDateStrings []= $dateString; // append
        }
    }

    if ($invalidDateStrings) {
        $messages['dates'] = "Invalid dates: " . implode(', ', $invalidDateStrings);
    }   
    return array(
        'messages' => $messages,
        'statuses' => $validDateStatuses
    );
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

    // validate the format of the incoming dates
    $statusMap = validate_date_statuses($data, $messages);
    $messages  = $statusMap['messages'];
    $statusMap = $statusMap['statuses'];
    
    // exit if any fields failed basic validation:
    if ($messages) {
        return field_error($messages);
    }

    //
    // Find or create the requested event. ( finds when there's an id in the data. )
    // New events are given a new secret, and are set hidden=1 ( not yet published )
    // NOTE: overwrites any and all existing fields in the event with the user's input.
    $event = Event::fromArray($data);
    $existed = $event->exists();

    // if the event existed; the secret must be valid.
    if ($existed && !$event->secretValid($data['secret'])) {
        return text_error("Invalid secret, use link from email");
    }

    // validates that all fields have compatible data types, 
    // that required values are set, that uniqueness and other constraints are valid.
    // https://flourishlib.com/docs/fActiveRecord.html#WhatisValidated
    $messages = $event->validate($return_messages=TRUE, $remove_column_names=TRUE);

    // save the uploaded file (if any)
    $messages = upload_attached_file($event, $messages);

    // any errors so far? exit.
    if ($messages) {
        return field_error($messages);
    }

    // if they saved ( uploaded to manage ) an existing event;
    // then they must be publishing it. ( we've already validate the key above )
    if ($existed) {
        $event->setPublished();
    }

    // we dont know whether something significant changed or not:
    // so we always have to store.
    $event->storeChange();

    // now that the event has been stored, and it has an id: add/remove times.
    $eventTimes = EventTime::reconcile($event, $statusMap);
    
    // after everything else has finished:
    // email the organizer about new events.
    if (!$existed) {
        $event->emailSecret();
    }
    
    // finally, return a summary of the Event and its EventTime(s).
    // passes "true" to include private contact info ( like email, etc. )
    // ( because this is the organizer saving their event )
    return $event->toDetailArray(true, $eventTimes);
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

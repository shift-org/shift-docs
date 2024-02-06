<?php

/**
 * Triggers a 400 response, and formats the passed string into a json error message for the client.
 *  {
 *    "error": {
 *      "message": "Invalid secret, use link from email"
 *    }
 *  }
 * See also:
 *  addevent.js
 */
function text_error($message, $status_code=400) {
    http_response_code($status_code);
    return array(
        'error' => array(
            'message' => $message
        )
    );
}

/**
 * Triggers a 400 response, and formats the passed key,value array into json messages for the client.
 *  {
 *    "error": {
 *      "message": "There were errors in your fields",
 *      "fields": {
 *        "email": "Please enter a value for <span class=\"field-name\">Email</span>"
 *      }
 *    }
 *  }
 */
function field_error($messages, $status_code=400) {
    http_response_code($status_code);
    return array(
        'error' => array(
            'message' => 'There were errors in your fields',
            'fields' => $messages
        )
    );
}

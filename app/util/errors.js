module.exports = {
  textError,
  fieldError
};

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
function textError(res, message="unknown error") {
  res.status(400).json({ error: {
    message
  }});
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
function fieldError(res, fields, message = "There were errors in your fields") {
  res.status(400).json({ error: {
      message,
      fields,
   }});
}

const config = require("../config");

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
function textError(res, message="unknown error", status_code=400) {
  res.status(status_code).json({
    version: config.apiVersion,
    error: {
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
function fieldError(res, fields, message = "There were errors in your fields", status_code=400) {
  res.status(status_code).json({
    version: config.apiVersion,
    error: {
      message,
      fields,
   }});
}

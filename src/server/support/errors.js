const config = require('server/core/config');

// base class for errors intended to be shown to the end user.
// for internal errors, prefer a regular Error.
class StatusError extends Error {
  // defaults to status code 400 Bad Request
  // "The server cannot or will not process the request due to an apparent client error (e.g., malformed request syntax, size too large, invalid request message framing, or deceptive request routing)."
  constructor(msg, status = undefined) {
    super(msg); // becomes this.message
    this.status = status || 400;
  }

  // res is an express response
  // used to report the error back to the client
  // the client expects a json object containing
  // the error message and an optional error of fields
  sendError(res) {
    // fields can be undefined and that's okay.
    const { status, message, fields } = this;
    res.status(status).json({
      error: {
        message,
        fields,
      }});
  }
}

// a single string
class TextError extends StatusError {
  constructor(msg, status = undefined) {
    super(msg, status);
  }
}

// reports back to the user with one or more error messages
// relating to specific fields of a form.
class FormError extends StatusError {
  // where errors is a map of field name to error message
  // (ie. the result of ErrorCollector.getErrors())
  constructor(errors, msg = undefined, status = undefined) {
    super(msg || "There were errors in your fields", status);
    this.fields = errors;
  }
}

// not really an error, forces a redirect.
class RedirectError extends StatusError {
  constructor(dest, msg) {
    super(msg);
    this.dest = dest;
  }
  sendError(res) {
    res.redirect(this.dest);
  }
}

// helper for generating field errors.
class ErrorCollector {
  constructor() {
    this.errors = {};
    this.count = 0;
  }
  // if msg is missing, adds a generic error
  // fix? messages can contain html.
  addError(field, msg = undefined) {
    this.errors[field] = msg ?? `Please enter a value for <span class=\"field-name\">${field}</span>`;
    this.count++;
    return this;
  }
  getErrors() {
    return this.errors;
  }
}

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
function sendTextError(res, message="unknown error", status_code=400) {
  res.set(config.api.header, config.api.version);
  res.status(status_code).json({
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
function sendFieldError(res, fields, message = "There were errors in your fields", status_code=400) {
  res.set(config.api.header, config.api.version);
  res.status(status_code).json({
    error: {
      message,
      fields,
   }});
}

// ------------------------------------------
// exports
// ------------------------------------------

module.exports = {
  sendTextError,
  sendFieldError,

  TextError,
  FormError,
  RedirectError,
  StatusError,

  ErrorCollector,
};

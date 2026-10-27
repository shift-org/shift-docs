const config = require('shift-docs/config');

// common error strings for parsing input
const ErrorStrings = {
  Missing: "Missing value",
  Invalid: "Invalid value", // the wrong type of value
  Unknown: "Unknown value", // the right type but not the right value.
  Overflow: "Field is too long",
};

// base class for errors intended to be shown to the end user.
// for internal errors, prefer a regular Error.
class StatusError extends Error {
  // defaults to status code 400 Bad Request
  // "The server cannot or will not process the request due to an apparent client error (e.g., malformed request syntax, size too large, invalid request message framing, or deceptive request routing)."
  constructor(status, message) {
    // becomes this.message
    super(message ?? `status error ${status}`);
    // console.log("StatusError:", message);
    this.status = status;
  }
  // res is an express response
  // used to report the error back to the client
  // the client expects a json object containing status and message
  sendError(res) {
    const { status, message } = this;
    res.status(status).json({
      error: {
        status,
        message
      }
    });
  }
}

// not really an error, forces a generic redirect.
class ErrRedirect extends StatusError {
  constructor(dest, message = undefined) {
    super(302, message || `redirect to ${dest}`);
    this.dest = dest;
  }
  sendError(res) {
    res.redirect(this.status, this.dest);
  }
}

// for response of post into get
class ErrCommited extends StatusError {
  constructor(dest, message = undefined) {
    super(303, message || `commited to ${dest}`);
    this.dest = dest;
  }
  sendError(res) {
    res.redirect(this.status, this.dest);
  }
}

class ErrBadRequest extends StatusError {
  constructor(message = "bad request") {
    super(400, message);
  }
}

class ErrForbidden extends StatusError {
  constructor(message = "not permitted") {
    super(403, message);
  }
}

class ErrNotFound extends StatusError {
  constructor(message = "not found") {
    super(404, message);
  }
}

// a special version of bad request:
// reports back to the user with one or more error messages
// relating to specific fields of a form.
class FormError extends ErrBadRequest {
  // where errors is a map of field name to error message
  // (ie. the result of ErrorCollector.getErrors())
  constructor(errors) {
    super("There were some errors in your fields.");
    this.fields = errors;
  }
  // override to provide error fields
  sendError(res) {
    // fields can be undefined and that's okay.
    const { status, message, fields } = this;
    res.status(status).json({
      error: {
        status,
        message,
        fields,
      }
    });
  }
}

// helper for generating field errors.
class ErrorCollector {
  constructor() {
    this.errors = {};
    this.count = 0;
  }
  hasErrors() {
    return this.count > 0;
  }
  // a map of field name to message
  getErrors() {
    return this.errors;
  }
  // if message is missing, adds a generic error
  // fix? messages can contain html.
  addError(field, msg = undefined) {
    this.errors[field] = msg ?? `Please enter a value for <span class=\"field-name\">${field}</span>`;
    this.count++;
    return this;
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
function textError(res, message="unknown error", status_code=400) {
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
function fieldError(res, fields, message = "There were errors in your fields", status_code=400) {
  res.set(config.api.header, config.api.version);
  res.status(status_code).json({
    error: {
      message,
      fields,
   }
  });
}

// ------------------------------------------
// exports
// ------------------------------------------

module.exports = {
  textError,
  fieldError,

  FormError,
  ErrRedirect,
  ErrCommited,
  ErrBadRequest,
  ErrNotFound,
  ErrForbidden,
  StatusError,

  ErrorCollector,
  ErrorStrings,
};

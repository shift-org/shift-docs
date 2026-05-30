const fsp = require('fs').promises;
const path = require('node:path');
const validator = require('validator');
const multer = require('multer');
const config = require('server/core/config');
const { StatusError, sendFieldError } = require('server/support/errors');

// return the promise of a saved file
function saveImage(file, outpath) {
  // file.path indicates a temp file in a temp directory
  // file.buffer is used if the image contents were uploaded into memory.
  if (file.path) {
    return fsp.rename(file.path, outpath);
  } else if (file.buffer) {
    return fsp.writeFile(outpath, file.buffer);
  } else {
    throw new StatusError("image has no data");
  }
}

class FileFormatError extends Error {
  constructor(field, message) {
    super(message);
    this.field = field;
  }
};

const uploader = {
  // save an uploaded file to a new file with 'name' (event id).
  // The uploaded file contains a 'mimetype', and either:
  // a 'buffer' of binary data, or a 'path' (to a temp file in system tmp.)
  // Promises an object with the name and an extension: `{name, ext}`.
  write(file, name) {
    if (!name || (typeof(name) !== 'string')) {
      throw new StatusError("cant store an image without a valid name");
    }
    if (!file) {
      throw new StatusError("no file data specified");
    }
    // this is also validated during upload in fileFilter
    const ext = config.image.imageTypes[file.mimetype];
    if (!ext) {
      throw new StatusError("cant store an image without a valid extension");
    }
    // ex. '/opt/backend/eventimages/7431.jpg'
    // this uses regular path ( not posix ) because it involves local files.
    const outpath = path.join(config.image.dir, name + ext);
    // after moving/writing the file, return the name and extension.
    return saveImage(file, outpath).then(_ => ({ name,  ext }));
  },

  makeUploader(dataField = 'file', errorField = 'image') {
    // ask multer to create its middleware
    return multer({
      // because the limits are so small
      // using memory storage for multner is probably fine.
      // storage: multer.diskStorage()
      limits: {
        files: 1,
        fileSize: config.image.maxFileSize,
        // https://github.com/mscdex/busboy#busboy-methods
        // fieldNameSize  Max field name size  100 bytes
        // fieldSize  Max field value size (in bytes)  1MB
        // fields  Max number of non-file fields  Infinity
        // fileSize  For multipart forms, the max file size (in bytes)  Infinity
        // files  For multipart forms, the max number of file fields  Infinity
        // parts  For multipart forms, the max number of parts (fields + files)  Infinity
        // headerPairs  For multipart forms, the max number of header key=>value pairs to parse  2000
      },
      fileFilter(req, file, cb) {
        const imageTypes = config.image.imageTypes;
        const mimeTypes = Object.keys(imageTypes);
        if (validator.isIn(file.mimetype, mimeTypes)) {
          cb(null, true)
        } else {
          cb(new FileFormatError(errorField, 'Invalid image type'));
        }
      },
    }).single(dataField);
  },

  // generates "middleware" for express endpoints
  // ( middleware is any function following a certain pattern. )
  // this processes the form; the next handler is always the php style endpoint
  makeHandler(dataField = 'file', errorField = 'image') {
    const upload = this.makeUploader(dataField, errorField);
    // wrap multner's middleware to handle errors generated in fileFilter()
    return function(req, res, next) {
      upload(req, res, err => {
        // this catches multner's error for surpassing limits;
        // and the custom error generated in fileFilter() above.
        if (err) {
          res.fieldError({ [errorField]: err.message || "Unknown error" });
        } else {
          // tell express to call the next middleware
          // if we pass 'err' to 'next()' express respond with http 500
          // https://expressjs.com/en/guide/error-handling.html#error-handling
          next();
        }
      });
    };
  } // makeHandler()
}

module.exports = {
  FileFormatError,
  uploader
};

// https://github.com/expressjs/multer
// req.file holds the file info ( the property is always .file regardless of the form name )
// req.body will hold the text fields, if there were any
// ....
// fieldname  Field name specified in the form
// originalname  Name of the file on the user's computer
// encoding  Encoding type of the file
// mimetype  Mime type of the file
// size  Size of the file in bytes
// destination  The folder to which the file has been saved
// filename  The name of the file within the destination
// path The full path to the uploaded file

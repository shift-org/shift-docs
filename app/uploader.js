const fsp = require('fs').promises;
const path = require('node:path');

const bytesPerMeg = 1024*1024;
const imageTypes = {
  'image/gif'  : '.gif',
  'image/jpeg' : '.jpg',
  'image/pjpeg': '.jpg',
  'image/png'  : '.png',
};

const validator = require('validator');
const multer = require('multer');

exports.uploader = {
  // promises the name of the image file "id.file_extension" after saving it.
  // from "src" fullpath to "dir" directory
  write( file, id, dir ) {
    if (!id) {
      return Promise.reject(Error("cant store an image without a valid id"));
    }
    if (!file) {
      return Promise.reject(Error("no file data specified"));
    }
    const ext = imageTypes[file.mimetype];
    if (!ext) {
      return Promise.reject(Error("cant store an image without a valid id"));
    }
    const name = id + ext;             // ex. '7431.jpg'
    const tgt = path.join(dir, name);  // ex. '/opt/backend/eventimages/7431.jpg'

    let q = file.path ? fsp.rename(file.path, tgt) :
          file.buffer ? fsp.writeFile(tgt, file.buffer) :
          Promise.reject(Error("image has no data"));
    return q.then(_ => name);
  },

  // generates middleware for express endpoints
  handle: multer({
    // because the limits are so small
    // using memory storage for multner is probably fine.
    // storage: multer.diskStorage()
    limits: {
      files: 1,
      fileSize: 2 * bytesPerMeg,
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
      const mimeTypes = Object.keys(imageTypes);
      if (validator.isIn(file.mimetype, mimeTypes)) {
        cb(null, true)
      } else {
        cb(new Error('Invalid image type'));
      }
    },
  })
}


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

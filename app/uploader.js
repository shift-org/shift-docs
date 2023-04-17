const bytesPerMeg = 1024*1024;
const imageTypes = ['image/gif','image/jpeg','image/pjpeg','image/png'];

const validator = require('validator');
const multer = require('multer');

exports.uploader = multer({
  // let multer use its default tmp directory
  // and we'll move them out.
  // ( alt: upload to memory, and save to the right spot? )
  /* dest: 'uploads/'*/
  limits: {
    // https://github.com/mscdex/busboy#busboy-methods
    // fieldNameSize  Max field name size  100 bytes
    // fieldSize  Max field value size (in bytes)  1MB
    // fields  Max number of non-file fields  Infinity
    // fileSize  For multipart forms, the max file size (in bytes)  Infinity
    // files  For multipart forms, the max number of file fields  Infinity
    // parts  For multipart forms, the max number of parts (fields + files)  Infinity
    // headerPairs  For multipart forms, the max number of header key=>value pairs to parse  2000
    files: 1,
    fileSize: 2 * bytesPerMeg,
  },
  fileFilter(req, file, cb) {
    if (valiator.isIn(file.mimetype, imageTypes)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid image type'));
    }
  },
});


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

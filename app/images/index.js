// This file exports the location of sample images for development and testing.
//
// The bike images are [creative commons licensed](https://creativecommons.org/licenses/by/2.0/)  齐健 from Peking, People's Republic of China - Down the Hutong
// https://www.flickr.com/photos/timquijano/6337789618/
// via wikipedia.
const path = require('node:path');
const imageDir = __dirname;

module.exports = {
  bike: {
    jpg: path.join(imageDir, "bike.jpg"),
    png: path.join(imageDir, "bike.png"),
    big: path.join(imageDir, "bike-big.png"),
    unsupportedFormat: path.join(imageDir, "bike-bad.tiff"),
  }
}

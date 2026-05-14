// exports a configured nunjucks environment
// https://mozilla.github.io/nunjucks/api.html#environment

const nunjucks = require('nunjucks');
// "views" is relative to the current working directory
// ( the location from which node was launched )
module.exports = nunjucks.configure('views', {
  autoescape: true
});

// exports a configured nunjucks environment
// https://mozilla.github.io/nunjucks/api.html#environment

const nunjucks = require('nunjucks');
module.exports = nunjucks.configure('views', {
  autoescape: true
});

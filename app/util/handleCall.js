const config = require('shift-docs/config');

module.exports = handleCall;

// wrapper for shift endpoints.
// assumes 'cb' either generates a promise or throws an error,
// and that 'send' can handle the result of that promise.
function handleCall(cb, queryFilter) {
  // express request, response, and chain handler
  return function(req, res, next) {
    // only handle this endpoint if the query expectations matched
    if (queryFilter && !queryFilter(req.query)) {
      next('route'); // tells express to move to the next router statement
    } else {
      // add the shift version info
      res.set(config.api.header, config.api.version);
      // express 4 doesn't directly support promises; so create our own promise chain.
      // ( express is asynchronous: waiting until a result is generated, or until next() is called; ex. on error. )
      return Promise.resolve()
        .then(_ => cb(req))
        .then(ret => {
          if (ret !== undefined) {
            // since most endpoints use json.... that's the default.
            res.json(ret);
          } else {
            // or, send a generic okay.
            res.status(200);
          }
        }).catch((err) => {
          // was one of our built in error types thrown?
          if (err.sendError) {
            err.sendError(res);
          } else {
            next(err);
          }
        });
    }
  }
}

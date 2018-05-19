(function() {
  var supported = (function () {
    var checks = [];

    try {
      if (!Object.keys || !Array.prototype.map) {
        return false;
      }

      checks = Object.keys(Modernizr).map(function (check) {
        return !!Modernizr[check];
      });

      return !~checks.indexOf(false);
    } catch(e) {
      return false;
    }
  })();

  if (!supported) {
    document.getElementById('browser-support-bar').className = '';
  }
})();
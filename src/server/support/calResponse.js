const nunjucks = require("server/support/nunjucks");

/**
 * Turn event entries into a http response.
 * @see https://datatracker.ietf.org/doc/html/rfc5545#section-3.6.1
 */
class CalResponse {
  // 'cal' is from config, containing various fields needed to generate an ical response.
  // 'events' is an array of data containing whatever info is needed for email.njk
  // 'filename' is an optional name the browser will prompt the user to save.
  // a blank filename, or the filename 'none',
  // will send the data in plain text format instead of as a file.
  construtor(cal, events, filename) {
    this.cal = cal;
    this.events = events;
    this.filename = filename;
  }

  // res is an express response object
  sendCal(res) {
    const { cal, filename, events } = this;
    sendCal(res, cal, filename, events);
  }
}

// res is an express response object
function sendCal(res, cal, events, filename) {
  if (!filename || filename === "none") {
    res.setHeader('content-type', `text/plain`);
  } else {
    res.setHeader('content-type', `text/calendar`);
    res.setHeader('content-disposition', `attachment; filename=\"${filename}\"`);
    res.setHeader('cache-control',`'public, max-age=${cal.maxage}`);
  }
  // tbd: maybe there's filter or something for nunjucks to add the carriage returns.
  const body = nunjucks.render('ical.njk', {cal, events});
  // replace the our "normalized" line break with what ical wants
  res.send(body.replaceAll("\n", "\r\n"));
}

module.exports = { CalResponse, sendCal };

// Load a day's events by fetching the "viewday.php" page with appropriate
// parameters, and stuffing the response text into this document.  Then
// jump to either the top of that day, or a specific event within it.
// Params:
//   sqldate   The date to load, in YYYY-MM-DD format
//   exclude   False to include "excluded" events (default true)
//   eventid   Id of the event to go to, or 0 for day, or null for no move
function loadday(sqldate, exclude, eventid)
{
	// If the date isn't already loaded...
	elem = document.getElementById("div"+sqldate);
	start = elem.innerHTML;
	while (start.length > 0 && start.charAt(0) <= ' ')
	    start = start.substr(1);
	if (start.substr(0,6).toLowerCase() == "<span ") {
	    // Show a "loading" message
	    elem.innerHTML = "Loading..."

	    // Fetch the day's events
	    var url = "viewday.php?sqldate=" + sqldate;
	    if (exclude == false)
		url += "&exclude=0";
	    else
		url += "&exclude=1";
	    var conn = XmlHttp.create();
	    conn.open("GET", url, false);
	    conn.send(null);

	    // Stuff the events into the current document
	    elem.innerHTML = conn.responseText;
	}

	// build a reference to the date or event.
	if (eventid != null) {
	    var name;
	    if (eventid == 0) {
		switch (sqldate.substr(5, 2)) {
		    case "01": name = "January";	break;
		    case "02": name = "February";	break;
		    case "03": name = "March";		break;
		    case "04": name = "April";		break;
		    case "05": name = "May";		break;
		    case "06": name = "June";		break;
		    case "07": name = "July";		break;
		    case "08": name = "August";		break;
		    case "09": name = "September";	break;
		    case "10": name = "October";	break;
		    case "11": name = "November";	break;
		    case "12": name = "December";	break;
		}
		name = "#" + name + sqldate.substr(8, 2);
	    } else {
		name = "#" + sqldate.substr(8, 2) + "-" + eventid;
	    }
	    window.location.assign(name);
	}
}

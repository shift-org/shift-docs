function updatecountdown(when, where)
{
    // find the time remaining
    var now = new Date();
    var msec = Date.parse(when) - now.getTime();
    var result;

    // Convert the remaining time into a descriptive string
    if (msec <= 0) {
	result = "expired";
    } else {
	var minutes = Math.floor(msec / 60000);
	var hours = Math.floor(minutes / 60);
	var days = Math.floor(hours / 24);
	minutes -= hours * 60;
	hours -= days * 24;
	result = "";
	if (days == 1)
	    result += "1 day, ";
	else if (days > 1)
	    result += days + " days, ";
	if (hours == 1)
	    result += "1 hour, ";
	else if (hours > 1 || days > 0)
	    result += hours + " hours, ";
	if (minutes == 1)
	    result += "1 minute";
	else
	    result += minutes + " minutes";
    } 

    // Make the span display the countdown
    document.getElementById(where).innerHTML = result;

    // Arrange for another update 60 seconds from now
    setTimeout("updatecountdown(\""+when+"\", \""+where+"\")", 60000);
}

var idcounter;

function countdown(when, style)
{
    // create a span for storing the counter
    var id = "countdown" + idcounter;
    idcounter++;
    if (typeof(style) != "undefined" && style != "")
	document.write("<span id=\"" + id + "\" style=\"" + style + "\"></span>");
    else
	document.write("<span id=\"" + id + "\"></span>");

    // update the clock.  This also has the side-effect of scheduling the
    // next update 60 seconds later.
    updatecountdown(when, id);
}

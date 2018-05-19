<?php
# This generates a bike bulletin, in plain-text format suitable for email.
# By default, the bulletin always encompasses dates from the nearest
# last-friday to the end of the following month.  You can pass a "dates=..."
# parameter to override this.

header("Content-type: text/plain");
header("Cache-control: private");
include("include/common.php");
include("include/repeat.php");




# This function returns TRUE if a dates represents a weekly event
function isweekly($dates)
{
    return preg_match("/Every \w*day$/", $dates);
}

# This function formats an event record and prints it
function printevent($record, $prettydate)
{
    print "\n".strtoupper($record["title"])."\n";
    $again = repeatfirstinstance($record, $prettydate);
    if ($again) {
	print "See ${again[date]} for details\n";
    } else {
	print hmmpm($record["eventtime"])."\n";
	if ($record["locname"])
	    print "${record[locname]}, ${record[address]}\n";
	else
	    print "${record[address]}\n";
	print wordwrap($record["printdescr"], 68)."\n";
	if (!$record["hideemail"]) {
	    $email = preg_replace("/@/", " at ", $record["email"]);
	    $email = preg_replace("/\\./", " dot ", $email);
	    if ($record["weburl"] != "")
		print "$email, ${record[weburl]}\n";
	    else
		print "$email\n";
	} else if ($record["weburl"] != "") {
	    print "${record[weburl]}\n";
	}
    }
}


# Were dates passed as a parameter?
if ($_REQUEST["dates"]) {
    # Parse the "dates" value
    $dates = repeatdates($_REQUEST["dates"]);
 
    # Extract th starting and ending dates from the list
    $startdate = $dates[1]["timestamp"];
    $sqlstart = $dates[1]["sqldate"];
    for ($i = 1; $dates[$i]["timestamp"]; $i++) {
	$enddate = $dates[$i]["timestamp"];
	$sqlend = $dates[$i]["sqldate"];
    }
} else {
    # Choose the starting date.  This is always the last Friday in either
    # the current month or the preceding month.
    $now = getdate();
    $noon = $now[0] + (12 - $now["hours"]) * 3600; # approximately noon today
    $friday = $noon - 86400 * ($now["wday"] + 2);
    $prevbonb = $friday;
    $then = getdate($prevbonb);
    while ($then["mon"] == $now["mon"]) {
	$prevbonb -= 86400 * 7;
	$then = getdate($prevbonb);
    }
    $nextbonb = $friday;
    $then = getdate($nextbonb);
    while ($then["mon"] == $now["mon"]) {
	$nextbonb += 86400 * 7;
	$then = getdate($nextbonb);
    }
    $nextbonb -= 86400 * 7;
    if (abs($now[0] - $prevbonb) < abs($now[0] - $nextbonb))
	$startdate = $prevbonb;
    else
	$startdate = $nextbonb;
    $sqlstart = date("Y-m-d", $startdate);
    $now = getdate($starddate);

    # Choose the ending date.  This is always the last day of the month
    # after the starting day
    $enddate = $startdate + 86400 * 28;
    $then = getdate($enddate + 86400);
    while (($then["mon"] + 12 - $now["mon"]) % 12 < 2) {
	$enddate += 86400;
	$then = getdate($enddate + 86400);
    }
    $sqlend = date("Y-m-d", $enddate);
}

print "B I K E   B U L L E T I N\n";
print date("F Y", $enddate)."\n";
print "\nShift\n";
print "http://www.shift2bikes.org/\n";

# Output the quick summary
print "\n\nHere's a quick rundown of what you'll find in this edition:\n";
print "****************************************************************************\n";
$result = mysql_query("SELECT * FROM calevent, caldaily WHERE calevent.id = caldaily.id AND eventdate >= \"$sqlstart\" AND eventdate <= \"$sqlend\" AND eventstatus = \"A\" AND review != \"E\" ORDER BY eventdate, eventtime", $conn) or die(mysql_error());
$thisday = "";
while ($record = mysql_fetch_array($result)) {
    if (!isweekly($record["dates"])) {
	# New date?
	if ($record["eventdate"] != $thisday) {
	    if ($thisday != "")
		print "\n";
	    $thisday = $record["eventdate"];
	    $prettydate = date("l, F jS", strtotime($thisday));
	    print "$prettydate\n";
	}
	print strtoupper($record["title"])."\n";
    }
}
print "\n****************************************************************************\n";

# Output the non-weekly events sorted by date
$result = mysql_query("SELECT * FROM calevent, caldaily WHERE calevent.id = caldaily.id AND eventdate >= \"$sqlstart\" AND eventdate <= \"$sqlend\" AND eventstatus = \"A\" AND review != \"E\" ORDER BY eventdate, eventtime", $conn) or die(mysql_error());
$thisday = "";
while ($record = mysql_fetch_array($result)) {
    # Is it weekly?
    if (!isweekly($record["dates"]))
    {

	# New date?
	if ($record["eventdate"] != $thisday) {
	    $thisday = $record["eventdate"];
	    $prettydate = date("l, F jS", strtotime($record["eventdate"]));
	    print "\n*************************************************\n";
	    print "$prettydate\n";
	    print "*************************************************";
	}
    
	# Print the event
	printevent($record, $prettydate);
    }
}
?>



************************************************
WEEKLY EVENTS
************************************************
<?php
# for each weekday...
$weekdays = array("Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday");
while ($weekday = array_shift($weekdays)) {
    # Look for events that recur on that weekday
    $result = mysql_query("SELECT DISTINCT title, eventtime, locname, address, printdescr, hideemail, weburl, email FROM calevent, caldaily WHERE calevent.id = caldaily.id AND eventdate >= \"$sqlstart\" AND eventdate <= \"$sqlend\" AND eventstatus = \"A\" AND review != \"E\" AND dates = \"Every $weekday\" ORDER BY eventtime", $conn) or die(mysql_error());
    if (mysql_num_rows($result) > 0) {
	# weekday header
	print "\n*************************************************\n";
	print "${weekday}s\n";
	print "*************************************************";

	# events that occur on that day
	while ($record = mysql_fetch_array($result)) {
	    printevent($record, NULL);
	}
    }
}
?>



*************************************************
*************************************************
Have more bike fun. :: http://www.shift2bikes.org
*************************************************
*************************************************

See you on the streets.
End transmission.<?php
# ex:set shiftwidth=4 smarttab autoindent:
?>

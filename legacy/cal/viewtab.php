<?php
# This is a "tab separated values" dump of the calendar data.  It requires a
# "dates=..." parameter to define the date range to dump.

    include("include/common.php");
    include("include/repeat.php");
    include("include/view.php");
    header("Content-type: text/plain");
    header("Cache-control: private");
    
    

 
    # Parse the "dates" value
    $dates = repeatdates($_REQUEST["dates"]);
    $sqlstart = $dates[1]["sqldate"];
    for ($i = 1; $dates[$i]["timestamp"]; $i++) {
	$sqlend = $dates[$i]["sqldate"];
    }
?>
weekday	dayofmonth	datestype	firstinstance	time	endtime	timedetails	venue	address	locdetails	area	audience	title	tinytitle	printdescr	contact
<?php
    # For each event...
    $thisday = "ugly";
    $result = mysql_query("SELECT * FROM calevent, caldaily WHERE eventdate >= '$sqlstart' AND eventdate <= '$sqlend' AND eventstatus <> 'C' AND eventstatus <> 'E' AND eventstatus <> 'S' AND review <> 'E' AND calevent.id = caldaily.id ORDER BY eventdate, eventtime", $conn) or die(mysql_error());
    while ($record = mysql_fetch_array($result)) {
	if ($record["eventdate"] != $thisday) {
	    $thisday = $record["eventdate"];
	    $prettydate = date("l, F j", strtotime($thisday));
	}
	$again = repeatfirstinstance($record, $prettydate);
	$starttime = hmmpm($record["eventtime"]);
	if ($record["eventduration"] > 0)
	    $endtime = endtime($starttime, $record["eventduration"]);
	else
	    $endtime = "";
	$contact = $record["name"];
	if ($record["printemail"] && $record["email"] != "")
	    $contact .= ", ${record[email]}";
	if ($record["printphone"] && strlen($record["phone"]) >= 7)
	    #$contact .= ", ".substr($record["phone"], 0, 3)."-".substr($record["phone"], 3, 3)."-".substr($record["phone"],6,4);
	    $contact .= ", ${record[phone]}";
	if ($record["printweburl"] && $record["weburl"] != "")
	    $contact .= ", ${record[weburl]}";
	if ($record["printcontact"] && $record["contact"] != "")
	    $contact .= ", ${record[contact]}";
	$printdescr = preg_replace('/\s+/', " ", $record["printdescr"]);
	print date("l\td\t", strtotime($record["eventdate"]));
	print "${record[datestype]}\t";
	if ($again)
	    print $again["date"]."\t";
	else
	    print "\t";
	print "$starttime\t";
	print "$endtime\t";
	print "${record[timedetails]}\t";
	print "${record[locname]}\t";
	print "${record[address]}\t";
	print "${record[locdetails]}\t";
	print "${record[area]}\t";
	print "${record[audience]}\t";
	print "${record[title]}\t";
	print "${record[tinytitle]}\t";
	print "$printdescr\t";
	print "$contact\n";
    }
    #ex:set sw=4 it=s:
?>

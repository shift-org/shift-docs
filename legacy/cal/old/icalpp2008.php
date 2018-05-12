<?php
# This is a CSV dump of the Pedalpalooza data
    $startdate = "2008-06-12";
    $enddate = "2008-06-28";

    include("include/common.php");
    include("include/view.php");
    header("Content-type: text/calendar");
    header("Cache-control: private");
    
    
?>
BEGIN:VCALENDAR
CALSCALE:GREGORIAN
X-WR-TIMEZONE;VALUE=TEXT:US/Pacific
METHOD:PUBLISH
PRODID:-//Shift Calendar//Pedalpalooza 2008//EN
X-WR-CALNAME;VALUE=TEXT:Pedalpalooza 2008
VERSION:2.0
<?php
    # For each event...
    $sequence = 0;
    $result = mysql_query("SELECT * FROM calevent, caldaily WHERE eventdate >= '$startdate' AND eventdate <= '$enddate' AND eventstatus <> 'C' AND eventstatus <> 'E' AND eventstatus <> 'S' AND calevent.id = caldaily.id ORDER BY eventdate, eventtime", $conn) or die(mysql_error());
    while ($record = mysql_fetch_array($result)) {
	$sequence++;
	$date = date("Ymd", strtotime($record["eventdate"]));
	$dtstart = $date."T".str_replace(":", "", $record["eventtime"]);
	$contact = $record["name"];
	if ($record["printemail"] && $record["email"] != "")
	    $contact .= ", ${record[email]}";
	if ($record["printphone"] && strlen($record["phone"]) >= 7)
	    $contact .= ", ${record[phone]}";
	if ($record["printweburl"] && $record["weburl"] != "")
	    $contact .= ", ${record[weburl]}";
	if ($record["printcontact"] && $record["contact"] != "")
	    $contact .= ", ${record[contact]}";
	
	print "BEGIN:VEVENT\n";
	print "SEQUENCE:$sequence\n";
	print "DTSTART;TZID=US/Pacific:$dtstart\n";
	print "DTSTAMP:".date("Ymd")."T000000\n";
	print "SUMMARY:${record[title]}\n";
	print "UID:$date.${record[id]}@shift2bikes.org\n";
	#print "DTEND;TZID=US/Pacific:20080926T000000\n";
	print wordwrap("DESCRIPTION:".$record["printdescr"], 75, "\n ", TRUE)."\n";
	print wordwrap("ORGANIZER:".$contact, 75, "\n ", TRUE)."\n";
	print "END:VEVENT\n";
    }
    #ex:set sw=4 it=s:
?>
END:VCALENDAR

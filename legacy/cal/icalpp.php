<?php
# This is a CSV dump of the *palooza data
    include("include/common.php");
    include("include/view.php");
    header("Content-type: text/calendar");
    header("Cache-control: private");
    
    
?>
BEGIN:VCALENDAR
CALSCALE:GREGORIAN
X-WR-TIMEZONE;VALUE=TEXT:US/Pacific
METHOD:PUBLISH
PRODID:-//Shift Calendar//<?php print PPNAME; ?>//EN
X-WR-CALNAME;VALUE=TEXT:<?php print PPNAME; ?>
VERSION:2.0
<?php
    # For each event...
    $sequence = 0;
    $result = mysql_query("SELECT * FROM calevent, caldaily WHERE eventdate >= '".PPSTART."' AND eventdate <= '".PPEND."' AND eventstatus <> 'C' AND eventstatus <> 'E' AND eventstatus <> 'S' AND review <> 'E' AND calevent.id = caldaily.id ORDER BY eventdate, eventtime", $conn) or die(mysql_error());
    while ($record = mysql_fetch_array($result)) {
	$sequence++;
	$id = $record["id"];
	$tmp = strtotime($record["eventdate"]);
	$date = date("Ymd", $tmp);
	$mday = date("d", $tmp);
	$dtstart = $date."T".str_replace(":", "", $record["eventtime"]);
	$tmp = $record["eventduration"];
	if ($tmp > 0)
	{
	    $m = $tmp % 60;
	    $h = floor($tmp / 60);
	    $duration = "PT${h}H${m}M0S";
	} else
	    $duration = "";
	$contact = $record["name"];
	if ($record["printemail"] && $record["email"] != "")
	    $contact .= ", ${record[email]}";
	if ($record["printphone"] && strlen($record["phone"]) >= 7)
	    $contact .= ", ${record[phone]}";
	if ($record["printweburl"] && $record["weburl"] != "")
	    $contact .= ", ${record[weburl]}";
	if ($record["printcontact"] && $record["contact"] != "")
	    $contact .= ", ${record[contact]}";
	$location = $record["address"];
	if ($record["locname"])
	    $location = $record["locname"].", $location";
	if ($record["locdetails"])
	    $location = "$location (".$record["locdetails"].")";
	
	print "BEGIN:VEVENT\n";
	print "SEQUENCE:$sequence\n";
	print "DTSTART;TZID=US/Pacific:$dtstart\n";
	if ($duration)
	    print "DURATION:$duration\n";
	print "DTSTAMP:".date("Ymd")."T000000\n";
	print "SUMMARY:${record[title]}\n";
	print "UID:$date.$id@shift2bikes.org\n";
	#print "DTEND;TZID=US/Pacific:20080926T000000\n";
	print wordwrap("DESCRIPTION:".$record["printdescr"], 75, "\n  ", TRUE)."\n";
	print wordwrap("ORGANIZER:".$contact, 75, "\n  ", TRUE)."\n";
	print wordwrap("LOCATION:".$location, 75, "\n  ", TRUE)."\n";
	print "ATTACH:".CALURL.PPURL."#$mday-$id\n";
	print "END:VEVENT\n";
    }
    #ex:set sw=4 it=s:
?>
END:VCALENDAR

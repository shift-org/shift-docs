<?php
# This is a CSV dump of the Pedalpalooza data
    $startdate = "2008-06-12";
    $enddate = "2008-06-28";

    include("include/common.php");
    include("include/view.php");
    header("Content-type: text/plain");
    header("Cache-control: private");
    
    
?>
weekday,dayofmonth,datestype,time,endtime,timedetails,venue,address,locdetails,area,audience,title,tinytitle,printdescr
<?php
    # For each event...
    $result = mysql_query("SELECT * FROM calevent, caldaily WHERE eventdate >= '$startdate' AND eventdate <= '$enddate' AND eventstatus <> 'C' AND eventstatus <> 'E' AND eventstatus <> 'S' AND calevent.id = caldaily.id ORDER BY eventdate, eventtime", $conn) or die(mysql_error());
    while ($record = mysql_fetch_array($result)) {
	$starttime = hmmpm($record["eventtime"]);
	if ($record["eventduration"] > 0)
	    $endtime = "\"".endtime($starttime, $record["eventduration"])."\"";
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
	print date("\"l\",d,", strtotime($record["eventdate"]));
        print "\"${record[datestype]}\",";
	print "\"$starttime\",";
	print "$endtime,";
	print "\"".str_replace("\"", "\"\"", $record["timedetails"])."\",";
	print "\"".str_replace("\"", "\"\"", $record["locname"])."\",";
	print "\"".str_replace("\"", "\"\"", $record["address"])."\",";
	print "\"".str_replace("\"", "\"\"", $record["locdetails"])."\",";
	print "\"${record[area]}\",";
	print "\"${record[audience]}\",";
	print "\"".str_replace("\"", "\"\"", $record["title"])."\",";
	print "\"".str_replace("\"", "\"\"", $record["tinytitle"])."\",";
	print "\"".str_replace("\"", "\"\"", $record["printdescr"])."\",";
	print "\"".str_replace("\"", "\"\"", $contact)."\"\n";
	
    }
    #ex:set sw=4 it=s:
?>

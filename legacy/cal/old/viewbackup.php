<?php
	# This view downloads all current/future events, for backup purposes.

	include("include/common.php");
	header("Content-type: text/xml");
	header("Cache-control: private");
	print "<"."?xml version=\"1.0\" encoding=\"iso-8859-1\" ?".">\n";
	print "<calendar>\n";

	# Compute $today This is slightly complicated by the fact that
	# Thinkhost uses the Eastern timezone, not Pacific.
	$today = date("Y-m-d", time() - 3600 * TZTWEAK);

	# For each event with current or future dates...
	
	
	$result = mysql_query("SELECT * FROM calevent, caldaily WHERE caldaily.id = calevent.id AND eventdate >= \"${today}\" ORDER BY calevent.id, eventdate, exceptionid DESC", $conn) or die(mysql_error());
	$previd = "";
	while ($record = mysql_fetch_array($result)) {
		# Starting a new event?
		if ($record["id"] != $previd) {
		    # end previous, if any
		    if ($previd != "")
			print "  </event>\n";
		    $previd = $record["id"];

		    # output the common parts of this event
		    print "  <event>\n";
		    print "    <modified>${record[modified]}</modified>\n";
		    print "    <id>${record[id]}</id>\n";
		    print "    <name>".htmlspecialchars($record["name"])."</name>\n";
		    print "    <email>".htmlspecialchars($record["email"])."</email>\n";
		    print "    <hideemail>${record[hideemail]}</hideemail>\n";
		    print "    <emailforum>${record[emailforum]}</emailforum>\n";
		    print "    <printemail>${record[printemail]}</printemail>\n";
		    print "    <phone>${record[phone]}</phone>\n";
		    print "    <hidephone>${record[hidephone]}</hidephone>\n";
		    print "    <printphone>${record[printphone]}</printphone>\n";
		    print "    <weburl>".htmlspecialchars($record["weburl"])."</weburl>\n";
		    print "    <webname>".htmlspecialchars($record["webname"])."</webname>\n";
		    print "    <printweburl>${record[printweburl]}</printweburl>\n";
		    print "    <contact>".htmlspecialchars($record["contact"])."</contact>\n";
		    print "    <hidecontact>${record[hidecontact]}</hidecontact>\n";
		    print "    <printcontact>${record[printcontact]}</printcontact>\n";
		    print "    <title>".htmlspecialchars($record["title"])."</title>\n";
		    print "    <tinytitle>".htmlspecialchars($record["tinytitle"])."</tinytitle>\n";
		    print "    <audience>${record[audience]}</audience>\n";
		    print "    <descr>".htmlspecialchars($record["descr"])."</descr>\n";
		    print "    <printdescr>".htmlspecialchars($record["printdescr"])."</printdescr>\n";
		    print "    <image>".htmlspecialchars($record["image"])."</image>\n";
		    print "    <imageheight>${record[imageheight]}</imageheight>\n";
		    print "    <imagewidth>${record[imagewidth]}</imagewidth>\n";
		    print "    <dates>".htmlspecialchars($record["dates"])."</dates>\n";
		    print "    <datestype>${record[datestype]}</datestype>\n";
		    print "    <eventtime>${record[eventtime]}</eventtime>\n";
		    print "    <eventduration>${record[eventduration]}</eventduration>\n";
		    print "    <timedetails>".htmlspecialchars($record["timedetails"])."</timedetails>\n";
		    print "    <locname>".htmlspecialchars($record["locname"])."</locname>\n";
		    print "    <address>".htmlspecialchars($record["address"])."</address>\n";
		    print "    <addressverified>${record[addressverified]}</addressverified>\n";
		    print "    <locdetails>".htmlspecialchars($record["locdetails"])."</locdetails>\n";
		    print "    <area>${record[area]}</area>\n";
		    print "    <external>".htmlspecialchars($record["external"])."</external>\n";
		    print "    <source>".htmlspecialchars($record["source"])."</source>\n";
		    print "    <nestid>${record[nestid]}</nestid>\n";
		    print "    <nestflag>${record[nestflag]}</nestflag>\n";
		}

		# Output the daily details for this event
		print "    <daily>\n";
		print "      <newsflash>".htmlspecialchars($record["newsflash"])."</newsflash>\n";
		print "      <eventdate>${record[eventdate]}</eventdate>\n";
		print "      <eventstatus>${record[eventstatus]}</eventstatus>\n";
		print "      <exceptionid>${record[exceptionid]}</exceptionid>\n";
		print "    </daily>\n";
	}

	# Mark the end of the last event, if there were any events
	if ($previd != "")
	    print "  </event>\n";

	print "</calendar>\n";
?>

<?php
	# This view generates an RSS feed ("Really Simple Syndication")
	# listing the calendar events for today and tomorrow.  Each event
	# has a link to its description in the "view3week.php" view, where
	# users can read the event's full description.

	include("include/common.php");
	header("Content-type: text/xml");
	header("Cache-control: private");
	print "<"."?xml version=\"1.0\" encoding=\"iso-8859-1\" ?".">\r\n";

	# Compute $today and $tomorrow.  This is slightly complicated by the
	# fact that Thinkhost uses the Eastern timezone, not Pacific.
	$today = date("Y-m-d", time() - 3600 * TZTWEAK);
	$tomorrow = date("Y-m-d", time() + 3600 * (24 - TZTWEAK));
?>
<rss version="2.0">
  <channel>
    <title>Shift Calendar</title>
    <link><?php
	print CALURL;
    ?></link>
    <description>Bike events for today and tomorrow, from the Shift calendar.</description>
    <language>en-us</language>
    <generator>Shift Calendar</generator>
<?php
	print "    <lastBuildDate>".substr(date("r"), 0, 26)."GMT</lastBuildDate>\r\n";

	
	

	function datelink($sqldate) {
		if ($sqldate >= PPSTART && $sqldate <= PPEND)
			$view = PPURL;
		else
			$view = "view3week.php";
		$date = strtotime($sqldate);
		return CALURL."$view#".date("Fj", $date);
	}

	function eventlink($sqldate, $id) {
		if ($sqldate >= PPSTART && $sqldate <= PPEND)
			$view = PPURL;
		else
			$view = "view3week.php";
		return CALURL."$view#".substr($sqldate, 8, 2)."-$id";
	}

	function pubdate($sqldate) {
		$date = strtotime($sqldate);
		return date("D, d M Y", $date)." 00:00:00 GMT";
	}

	# Generate the HTML for all entries in a given day, in the tiny format
	# used in the weekly grid near the top of the page.
	$result = mysql_query("SELECT calevent.id as id, newsflash, tinytitle, eventdate, eventtime, timedetails, locname, address, locdetails, printdescr FROM calevent, caldaily WHERE caldaily.id = calevent.id AND eventdate >= \"${today}\" AND eventdate <= \"${tomorrow}\" AND eventstatus != \"C\" AND eventstatus != \"E\" AND eventstatus != \"S\" ORDER BY eventdate,eventtime", $conn) or die(mysql_error());
	$date = "";
	while ($record = mysql_fetch_array($result)) {
		# Output a divider between days
		if ($record["eventdate"] != $date) {
			if ($record["eventdate"] == $today)
				$daylabel = "TODAY";
			else if ($record["eventdate"] == $tomorrow)
				$daylabel = "TOMORROW";
			else # this should never happen but just in case...
				$daylabel = $record["eventdate"];

			print "    <item>\n";
			print "      <title>$daylabel ------------</title>\n";
			print "      <link>".datelink($record["eventdate"])."</link>\n";
			print "      <pubDate>".pubdate($record["eventdate"])."</pubDate>\r\n";
			print "      <description>Whole day's events</description>\n";
			print "    </item>\n";

			$date = $record["eventdate"];
		}

		# Output an event
		print "    <item>\r\n";
		print "      <title>".($record['newsflash'] ? "[!] " : "").hmmpm($record['eventtime'])." ".htmlspecialchars($record['tinytitle'])."</title>\r\n";
		print "      <link>".eventlink($record['eventdate'], $record['id'])."</link>\r\n";
		print "      <pubDate>".pubdate($record['eventdate'])."</pubDate>\r\n";
		print "      <description>";
		print hmmpm($record['eventtime']);
		if ($record['timedetails'])
			print " (".htmlspecialchars($record['timedetails']).")";
		print "\r\n        ";
		if ($record['locname'])
			print htmlspecialchars($record['locname']).", ";
		print htmlspecialchars($record['address']);
		if ($record['locdetails'])
			print " (".htmlspecialchars($record['locdetails']).")";
		print "\r\n        ";
		print htmlspecialchars($record['printdescr']);
		print "</description>\r\n";
		print "    </item>\r\n";
	}

	# The final item is a link for adding new events
	print "    <item>\n";
	print "      <title>ADD AN EVENT ---------</title>\n";
	print "      <link>".CALURL."calform.php?form=short</link>\n";
	print "      <pubDate>".date("r")."</pubDate>\n";
	print "      <description>\n";
	print "        SHARE THE FUN!\n";
	print "\n";
	print "        Use ".CALURL."calform.php to add new events\n";
	print "\n";
	print "        To edit an event that you added earlier, use the link\n";
	print "        that was emailed to you when you created that event.\n";
	print "        If you've lost that link, contact the calendar crew\n";
	print "        for help.\n";
	print "      </description>\n";
	print "    </item>\n";
?>
  </channel>
</rss>

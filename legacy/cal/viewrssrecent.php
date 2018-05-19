<?php
	# This view generates an RSS feed ("Really Simple Syndication")
	# listing the calendar events that have been altered recently.

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
    <title>Shift Recent</title>
    <link><?php
	print CALURL;
    ?></link>
    <description>Bike events that have been modified recently.</description>
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

	# Generate the XML for all recent entries.
	$result = mysql_query("SELECT calevent.id as id, newsflash, tinytitle, eventdate, eventtime, timedetails, locname, address, locdetails, printdescr FROM calevent, caldaily WHERE caldaily.id = calevent.id AND eventstatus != \"C\" AND eventstatus != \"E\" AND eventstatus != \"S\" ORDER BY calevent.modified DESC LIMIT 1, 10", $conn) or die(mysql_error());
	$date = "";
	while ($record = mysql_fetch_array($result)) {
		# Output an event
		print "    <item>\r\n";
		print "      <title>".date("D, M d ", strtotime($record['eventdate'])).hmmpm($record["eventtime"])." ".($record["newsflash"] ? "[!] " : "").htmlspecialchars($record["tinytitle"])."</title>\r\n";
		print "      <link>".eventlink($record["eventdate"], $record["id"])."</link>\r\n";
		print "      <pubDate>".pubdate($record["eventdate"])."</pubDate>\r\n";
		print "      <description>";
		date("D, d M Y ", strtotime($record['eventdate']));
		print hmmpm($record["eventtime"]);
		if ($record["timedetails"])
			print ' ('.htmlspecialchars($record[timedetails]).')';
		print "\r\n        ";
		if ($record["locname"])
			print htmlspecialchars($record["locname"]).", ";
		print htmlspecialchars($record["address"]);
		if ($record["locdetails"])
			print " (".htmlspecialchars($record["locdetails"]).")";
		print "\r\n        ";
		print htmlspecialchars($record["printdescr"]);
		print "</description>\r\n";
		print "    </item>\r\n";
	}
?>
  </channel>
</rss>

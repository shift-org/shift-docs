<?php
	# This view generates an RSS feed ("Really Simple Syndication")
	# listing dates in the coming week that have events.  Each entry
	# has a link to date in the "view3week.php" view, where users
	# can read the events' full descriptions.

	include("include/common.php");
	header("Content-type: text/xml");
	header("Cache-control: private");
	print "<"."?xml version=\"1.0\" encoding=\"iso-8859-1\" ?".">\r\n";

	# Compute $today and $tomorrow.  This is slightly complicated by the
	# fact that Thinkhost uses the Eastern timezone, not Pacific.
	$today = date("Y-m-d", time() - 3600 * TZTWEAK);
	$tomorrow = date("Y-m-d", time() + 3600 * (24 - TZTWEAK));
	$lastday = date("Y-m-d", time() + 3600 * (6 * 24 - TZTWEAK));
?>
<rss version="2.0">
  <channel>
    <title>Shift Week</title>
    <link><?php
	print CALURL;
    ?></link>
    <description>Bike events for today and tomorrow, from the Shift calendar.</description>
    <language>en-us</language>
    <generator>Shift Week</generator>
<?php
print "    <lastBuildDate>".substr(date("r"), 0, 26)."GMT</lastBuildDate>\r\n";




function datelink($sqldate)
{
	if ($sqldate >= PPSTART && $sqldate <= PPEND)
		$view = PPURL;
	else
		$view = "view3week.php";
	$date = strtotime($sqldate);
	return CALURL."$view#".date("Fj", $date);
}

function pubdate($sqldate)
{
	$date = strtotime($sqldate);
	return date("D, d M Y", $date)." 00:00:00 GMT";
}

function nextdate($date)
{
	return date("Y-m-d", strtotime($date) + 36 * 3600);
}

# For each day...
for ($date = $today; $date <= $lastday; $date = nextdate($date)) {

    # Fetch all events for that day
    $result = mysql_query("SELECT newsflash, tinytitle, eventtime, timedetails, locname, address, locdetails, printdescr FROM calevent, caldaily WHERE caldaily.id = calevent.id AND eventdate = \"$date\" AND eventstatus != \"C\" AND eventstatus != \"E\" AND eventstatus != \"S\" ORDER BY eventtime", $conn) or die(mysql_error());

    # if there are events on this day...
    if (mysql_num_rows($result) > 0) {
	# Generate a nice human-readable version of the date
	if ($date == $today)
		$daylabel = "Today";
	else if ($date == $tomorrow)
		$daylabel = "Tomorrow";
	else
		$daylabel = date("l", strtotime($date));
	if (mysql_num_rows($result) == 1) {
	    $record = mysql_fetch_array($result);
	    mysql_data_seek($result, 0);
	    $daylabel .= ": ".htmlspecialchars($record["tinytitle"]);
	} else {
	    $daylabel .= ": ".mysql_num_rows($result)." events";
	}

	# Start the entry for this date
	print "    <item>\n";
	print "      <title>$daylabel</title>\n";
	print "      <link>".datelink($date)."</link>\n";
	print "      <pubDate>".pubdate($date)."</pubDate>\r\n";
	print "      <description>";

	# The description consists of a list of entries for that date.
	while ($record = mysql_fetch_array($result)) {
	    print "\n".hmmpm($record["eventtime"])." ".htmlspecialchars($record["tinytitle"])."\n";
	    print "    ";
	    if ($record["locname"])
		    print htmlspecialchars($record["locname"]).", ";
	    print htmlspecialchars($record["address"]);
	    if ($record["locdetails"])
		    print " (".htmlspecialchars($record["locdetails"]).")";
	    print "\n    ".htmlspecialchars($record["printdescr"])."\n";
	    if ($record["newsflash"])
		print "    ".htmlspecialchars($record["newsflash"])."\n";
	}

	print "      </description>\n";
	print "    </item>\n";
    }
}

# The final item is a link for adding new events
print "    <item>\n";
print "      <title>ADD AN EVENT</title>\n";
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

#ex:se sw=4:
?>
  </channel>
</rss>

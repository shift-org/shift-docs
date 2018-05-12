<?php
	# This view generates an RSS feed ("Really Simple Syndication")
	# containing a single item for tomorrow's events.

	include("include/common.php");
	header("Content-type: text/xml");
	header("Cache-control: private");
	print "<"."?xml version=\"1.0\" encoding=\"iso-8859-1\" ?".">\r\n";

	# Compute $today and $tomorrow.  This is slightly complicated by the
	# fact that Thinkhost uses the Eastern timezone, not Pacific.
	$tomorrow = date("Y-m-d", time() + 3600 * (24 - TZTWEAK));
?>
<rss version="2.0">
  <channel>
    <title>Shift Tomorrow</title>
    <link><?php
	print CALURL;
    ?></link>
    <description>Bike events for tomorrow, from the Shift calendar.</description>
    <language>en-us</language>
    <generator>Shift Tomorrow</generator>
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

# For each day...
# Fetch all events for that day
$result = mysql_query("SELECT newsflash, tinytitle, eventtime, timedetails, locname, address, locdetails, printdescr FROM calevent, caldaily WHERE caldaily.id = calevent.id AND eventdate = \"$tomorrow\" AND eventstatus != \"C\" AND eventstatus != \"E\" AND eventstatus != \"S\" ORDER BY eventtime", $conn) or die(mysql_error());

# if there are events on this day...
if (mysql_num_rows($result) > 0) {
    # Generate a nice human-readable version of the date
    $daylabel = date("l", strtotime($tomorrow));
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
    print "      <link>".datelink($tomorrow)."</link>\n";
    print "      <pubDate>".pubdate($tomorrow)."</pubDate>\r\n";
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

#ex:se sw=4:
?>
  </channel>
</rss>

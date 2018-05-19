<style type="text/css">
  div.caltoday { padding: 0; margin: 0; padding: 0; background: url(images/pp07pale.jpg) -360px -275px; position: relative; left: 360px; top: 275px; width: 225px; z-index: 2; }
  div.tiny { font-size: small; margin-left: 20px; text-indent: -15px;}
  div.tinier { font-size: x-small; margin-left: 20px; text-indent: -15px;}
  div.tiniest { font-size: xx-small; margin-left: 20px; text-indent: -15px;}
  h3.weeks { background: #7ea4cc; margin-bottom: 5px;}
</style>
<?php
  # This is a fragment of HTML/PHP code.  It is meant to be included in
  # other, more complete PHP documents, wherever you want a "today and
  # tomorrow" mini-PP calendar.
	include("calcommon.php");
	$conn = mysql_connect(DBHOST, DBUSER, DBPASSWORD) or die(mysql_error());
	mysql_select_db(DBDATABASE, $conn) or die(mysql_error());

	global $conn;
	
	

	# Compute $today and $tomorrow.  This is slightly complicated by the
	# fact that Thinkhost uses the Eastern timezone, not Pacific.
	$today = date("Y-m-d", time() - 3600 * 3);
	$tomorrow = date("Y-m-d", time() - 3600 * 21);
	#$today = "2007-06-08";
	#$tomorrow = "2007-06-09";

	# Generate the HTML for all entries in a given day, in the tiny format
	# used in the weekly grid near the top of the page.
	$result = mysql_query("SELECT id, newsflash, tinytitle, eventdate, eventtime, audience, area, address, locdetails FROM calendar WHERE eventdate >= \"${today}\" and eventdate <= \"${tomorrow}\" ORDER BY eventdate,eventtime", $conn) or die(mysql_error());
	$date = "";
	$nevents = mysql_num_rows($result);
	if ($nevents > 0) {
		print "<div class=\"caltoday\">\n";

		# choose a size
		if ($nevents < 12)
			$size = "tiny";
		else if ($nevents < 20)
			$size = "tinier";
		else
			$size = "tiniest";

		# for each event...
		while ($record = mysql_fetch_array($result)) {
			# At start of each date, give a header
			if ($date != $record[eventdate]) {
				if ($date == "" && $today >= "2007-06-07")
					print "  <h3 class=weeks>Today</h3>\n";
				else
					print "  <h3 class=weeks>Tomorrow</h3>\n";
				$date = $record[eventdate];
			}
			$id = $record[id];
			$eventtime = hmmpm($record[eventtime]);
			$tinytitle = htmlspecialchars($record[tinytitle]);
			if ($record[newsflash] != "")
				$title = $record[newsflash];
			else if ($record[locdetails] != "")
				$title = "${record[address]}, ${record[locdetails]}";
			else
				$title = $record[address];
			$address = htmlspecialchars($record[address]);
			$locdetails = htmlspecialchars($record[locdetails]);
			if ($record[audience] == "F") {
				$timecolor = "green";
			} elseif ($record[audience] == "G") {
				$timecolor = "black";
			} else {
				$timecolor = "red";
			}
			if ($record[newsflash] != "") {
				$titlecolor = "magenta";
			} else if ($record[area] == "V") {
				$titlecolor = "blue";
			} else {
				$titlecolor = "black";
			}
			print "  <div class=\"$size\">";
			print "<a href=\"pedalpalooza/pp2007.php#${id}\" title=\"${title}\" style=\"color:${titlecolor};\">";
			print "<strong style=\"color:${timecolor};\">${eventtime}</strong>";
			print "&nbsp;${tinytitle}</a></div>\n";
		}

		# end the "caltoday" div
		print "</div>\n";
	}
?>

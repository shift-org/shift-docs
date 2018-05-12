<?PHP
    # This is a fragment of HTML/PHP code.  It is meant to be included in
    # other, more complete PHP documents, wherever you want a "today and
    # tomorrow" mini-PP calendar.

    # Open a connection to the MySQL server, if it isn't open already.
    # Also, when the MySQL connection isn't already open then we can
    # assume the "include/common.php" file hasn't been included yet.
    global $conn;
    if (!$conn)
    {
	include("include/common.php");
	
	
    }

    # Check for a remote=Y parameter, indicating that this is embedded in
    # an <iframe> of a different site.  Set $target accordingly.  Also,
    # output an HTML wrapper so this 
    $remote = ($_REQUEST['remote'] == 'Y');
    if ($remote) {
	$target = ' target="_blank"';
	print "<html><head>\n";
    } else {
	$target = '';
    }
?>

  <style type="text/css">
    div.cal { background:#fece00; padding:0; margin:0; }
    div.tiny { font-size:x-small; margin-left:20px; text-indent:-20px;}
    div.daytitle { background:#7ea4cc; margin-top:10px; margin-bottom:5px; text-align:center; font-size:1.25em; font-weight:bolder;}
	a.caltitle, a.caltitle:link, a.caltitle:visited { text-decoration:none; color:black; text-align:center; font-size:1.25em; font-weight:bolder; margin-bottom:10px; }
	a.caltitle:hover { text-decoration:underline; }
    a.calembed, a.calembed:link, a.calembed:visited { text-decoration:none; height:30px; color:darkblue; background-color:#87CEEB; border-color:lightcyan indigo darkorchid lightcyan;  border-style:outset; }
  </style>
  <?php if ($remote) print "</head><body>\n"; ?>
  <div class="cal">
<?php

    # Compute $today and $tomorrow.  This is slightly complicated by the
    # fact that Thinkhost uses the Eastern timezone, not Pacific.
    $today = date("Y-m-d", time() + 3600 * TZTWEAK);
    $tomorrow = date("Y-m-d", time() + 3600 * (TZTWEAK + 24));
    #$today = "2007-06-08";
    #$tomorrow = "2007-06-09";

    # Generate the HTML for all entries in a given day, in the tiny format
    # used in the weekly grid near the top of the page.
    $result = mysql_query("SELECT calevent.id as id, newsflash, tinytitle, eventdate, eventtime, audience, area, locname, address, locdetails, eventstatus FROM calevent, caldaily WHERE caldaily.id = calevent.id AND eventdate >= \"${today}\" AND eventdate <= \"${tomorrow}\" AND eventstatus<>\"E\" AND eventstatus<>\"S\" ORDER BY eventdate,eventtime", $conn) or die(mysql_error());
	print '<center>&bull; <a href="'.CALURL."\" class=caltitle$target>CALENDAR</a> &bull;\n";
    print "<table border=0 cellspacing=0 cellpadding=0><tr valign=top><td>\n";
    $date = "";
    while ($record = mysql_fetch_array($result)) {
	# At start of each date, give a header
	if ($date != $record["eventdate"]) {
	    if ($date != "")
		print "</td></tr><tr><td>\n";
	    if ($record["eventdate"] == $today)
		$datename = "Today";
	    else if ($record["eventdate"] == $tomorrow)
		$datename = "Tomorrow";
	    else
		$datename = $record["eventdate"];
	    print "<div class=daytitle>$datename</div>\n";
	    $date = $record["eventdate"];
	}
	$id = $record["id"];
	if ($record["eventstatus"] == "C") {
	    $decor = "line-through";
	    $eventtime = "Cancel";
	} else {
	    $decor = "none";
	    $eventtime = hmmpm($record["eventtime"]);
	}
	$tinytitle = htmlspecialchars($record["tinytitle"]);
	if ($record["newsflash"] != "")
	    $title = $record["newsflash"];
	else if ($record["locdetails"] != "")
	    $title = "${record[address]}, ${record[locdetails]}";
	else
	    $title = $record["address"];
	$address = htmlspecialchars($record["address"]);
	$locdetails = htmlspecialchars($record["locdetails"]);
	if ($record["audience"] == "F") {
	    $timecolor = "green";
	} elseif ($record["audience"] == "G") {
	    $timecolor = "black";
	} else {
	    $timecolor = "red";
	}
	if ($record["newsflash"] != "") {
	    $titlecolor = "magenta";
	} else if ($record["area"] == "V") {
	    $titlecolor = "blue";
	} else {
	    $titlecolor = "black";
	}
	$url = "/cal/view3week.php#".substr($record["eventdate"], -2)."-$id";
	print "<div class=\"tiny\">";
	print "<a href=\"$url\" title=\"$title\" style=\"color:$titlecolor; text-decoration:$decor;\"$target>";
	print "<strong style=\"color:$timecolor;\">$eventtime</strong>";
	print "&nbsp;$tinytitle</a></div>";
    }
    if (mysql_num_rows($result) > 0)
	print "</td></tr>\n";
    print "<tr><td><br /><center><a href=\"".CALURL."calform.php\" class=calembed$target>&nbsp;Add&nbsp;an&nbsp;Event&nbsp;</a></center></td></tr>\n";
    print "</table></center>\n";
?>
  </div>
<?php if ($remote) print "</body></html>\n"; ?>

<?php
# This page shows a bargraph of how many events are in *palooza by add date,
# so you can see how fast events are being added.
# It accepts the following parameters:
#
#	p=...		P=y for "printer friendly" format.

    include("include/common.php");
    include("include/view.php");
    include(INCLUDES."/header.html");
?>
<style type="text/css">
  div.content { background: #ffc969; }
  div.tiny { font-size: x-small; margin-left: 20px; text-indent: -20px;}
  div.tinier { font-size: x-small; letter-spacing:-1px; margin-left: 20px; text-indent: -20px;}
  th.weeks { background: #7ea4cc;}
  div.content { background: #ecea9f; }
  dl {margin: 5px; page-break-before: avoid; page-break-after: auto; }
  dt {margin-top: 5px; font-weight: bold; clear: left; page-break-inside: avoid; page-break-after: avoid;}
  dd {margin-bottom: 10px; margin-left: 50px; page-break-before: avoid; page-break-inside: avoid;}
  div.hr {font-size: 1; height:3px; margin: 0; margin-top: 5px; width: 100%; background-color: #7ea4cc;}
</style>
<?php

#Open a connection to the MySQL server



# This function creates the calcount table if it doesn't already exist, and
# then it counts the events within the given date range and stores it in the
# file.
function countrange($from, $to)
{
    global $conn;

    # Create the table, if it doesn't exist already
    mysql_query("CREATE TABLE calcount (fromdate DATE, todate DATE, whendate DATE, count INT)", $conn);

    # Compute "when"
    $when = date("Y-m-d");

    # Count (or recount) the events for today.
    $result = mysql_query("SELECT id FROM caldaily WHERE eventdate>=\"$from\" AND eventdate<=\"$to\" AND eventstatus<>\"E\" AND eventstatus<>\"C\" AND eventstatus<>\"S\"", $conn) or die(mysql_error());
    $count = mysql_num_rows($result);

    # Is there already a count for that range, for today?
    $result = mysql_query("SELECT count FROM calcount WHERE fromdate=\"$from\" AND todate=\"$to\" AND whendate=\"$when\"", $conn);
    if (mysql_num_rows($result) > 0) {
	# already counted.  If new count is different, then update
	$record = mysql_fetch_array($result);
	if ($record["count"] != $count) {
	    mysql_query("UPDATE calcount SET count=$count WHERE fromdate=\"$from\" AND todate=\"$to\" AND whendate=\"$when\"", $conn) or die("Updating count, ".mysql_error());
	}
    } else {
	# first time counted today.  Insert it
	mysql_query("INSERT INTO calcount (fromdate, todate, whendate, count) VALUES (\"$from\", \"$to\", \"$when\", $count)", $conn) or die("Inserting count, ".mysql_error());
    }
}

#Generate a bar graph showing counts for a given date range
function graph($from, $to)
{
    global $conn;

    # Fetch the counts
    $result = mysql_query("SELECT whendate, count FROM calcount WHERE fromdate=\"$from\" AND todate=\"$to\" ORDER BY whendate", $conn);

    # We want the chart to be about 600 pixels wide
    $colwidth = 600 / mysql_num_rows($result);

    # Use a table to generate par charts
    print "<table style=\"border: thin solid black; border-collapse: collapse; background-color: #d0d0d0;\">\n";
    print "  <tr valign=bottom>\n";
    $max = 0;
    while ($record = mysql_fetch_array($result)) {
	if ($record["count"] > $max)
	    $max = $record["count"];
	$yyyymmdd = explode("-", $record["whendate"]);
	switch ($yyyymmdd[1]) {
	  case "01": $days = 31; $color = "red";	break;
	  case "02": $days = 29; $color = "orange";	break;
	  case "03": $days = 31; $color = "yellow";	break;
	  case "04": $days = 30; $color = "green";	break;
	  case "05": $days = 31; $color = "blue";	break;
	  case "06": $days = 30; $color = "magenta";	break;
	  case "07": $days = 31; $color = "red";	break;
	  case "08": $days = 31; $color = "orange";	break;
	  case "09": $days = 30; $color = "yellow";	break;
	  case "10": $days = 31; $color = "green";	break;
	  case "11": $days = 30; $color = "blue";	break;
	  case "12": $days = 31; $color = "magenta";	break;
	}
	print "    <td><div title=\"${record[count]} events by ${record[whendate]}\" style=\"background: $color; height: ${record[count]}; width: $colwidth;\"></div>$label</td>\n";
    }
    print "    <td valign=top>$max</td>\n";
    print "  </tr>\n";
    print "</table>";
}

#Count pedalpalooza events
countrange(PPSTART, PPEND);
?>
<div class="content">
<h1>Event counts</h1>
<?php
graph(PPSTART, PPEND);
?>
</div>
<?php
include(INCLUDES."/footer.html");
?>

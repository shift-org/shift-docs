<?php
# This presents a rolling 3-week view of the calendar, with today's date
# shown in the top week.  It also has buttons leading to monthly views.
# It accepts the following parameters:
#
#	numweeks=...	Number of weeks to show.  This can be a number from
#			1 to 4.  The default is 3.
#
#	p=...		P=y for "printer friendly" format.

	include("include/common.php");
	include("include/view.php");
	if (!isset($_REQUEST['p']) || $_REQUEST["p"] == "")
	{
		include(INCLUDES."/header.html");
	}
	else
	{
		print "<html>";
		print "<head><title>Shift Calendar</title></head>";
		print "<body style=\"margin: 0; padding: 0;\">";
	}

?>
<link rel='stylesheet' href='<?php echo CALURL; ?>css/view3week.css' />
<?php
	
	

	# Choose the starting date.  This is always the Sunday at or before
	# today.  We'll move forward from there.
	$now = getdate();
	$noon = $now[0] + (12 - $now["hours"]) * 3600; # approximately noon today
	$startdate = $noon - 86400 * $now["wday"];

	# Number of weeks to show.  IMPORTANT: Some of the code in this file
	# assumes that day-of-month numbers are unique, which is only true if
	# numweeks<=4.  If you want to show 5 or more weeks, you'll need to
	# patch the code.
	if (isset($_REQUEST['numweeks']) && $_REQUEST['numweeks'] >= 1 && $_REQUEST['numweeks'] <= 4)
		$numweeks = $_REQUEST['numweeks'];
	else
		$numweeks = 3;
	$enddate = $startdate + ($numweeks * 7 - 1) * 86400;

	# This is used for choosing which side images should go on.  The
	# preferred side is always the right side since it doesn't interfere
	# with the heading indentations that way.  But to avoid a "staircase"
	# effect, if two consecutive events have images then the second one
	# is left-aligned, and smaller.  This variable indicates how much
	# overlap there is; if >0 then the image must go on the left.
	$imageover = 0;
?>

<!-- colors from logo image:
	Yellow #e0db56 #ecea9f
	Blue   #093e81 #7ea4cc
-->
<div id="content" class="content">

  <a id="cal">&nbsp;</a>
  <center>
<?php
    print "<h1>Bikey Fun, ".date("F j", $startdate)." - ".date("F j", $enddate)."</h1>";
?>
Shift helps other groups and individuals promote their "bike fun" events.<br>
Most of the events in this calendar are <strong>not</strong> produced by Shift.
<?php
    print "<table><tr>\n";
    if (date("F", $startdate) != date("F", $enddate)) {
	print "<td><form action=\"viewmonth.php\">\n";
	print "<input type=hidden name=month value=\"".date("m", $startdate)."\">\n";
	print "<input type=hidden name=year value=\"".date("Y", $startdate)."\">\n";
	print "<input type=submit value=\"&lt;&lt; All of ".date("F", $startdate)." &lt;&lt;\">\n";
	print "</form></td>\n";

	print "<td><form action=\"viewmonth.php\">\n";
	print "<input type=hidden name=month value=\"".date("m", $enddate)."\">\n";
	print "<input type=hidden name=year value=\"".date("Y", $enddate)."\">\n";
	print "<input type=submit value=\"&gt;&gt; All of ".date("F", $enddate)." &gt;&gt;\">\n";
	print "</form></td>\n";
    } else {
	print "<td><form action=\"viewmonth.php\">\n";
	print "<input type=hidden name=month value=\"".date("m", $startdate - (86400 * 28))."\">\n";
	print "<input type=hidden name=year value=\"".date("Y", $startdate - (86400 * 28))."\">\n";
	print "<input type=submit value=\"&lt;&lt; ".date("F", $startdate - (86400 * 28))." &lt;&lt;\">\n";
	print "</form></td>\n";

	print "<td><form action=\"viewmonth.php\">\n";
	print "<input type=submit value=\"All of ".date("F", $startdate)."\">\n";
	print "</form></td>\n";

	print "<td><form action=\"viewmonth.php\">\n";
	print "<input type=hidden name=month value=\"".date("m", $enddate + (86400 * 28))."\">\n";
	print "<input type=hidden name=year value=\"".date("Y", $enddate + (86400 * 28))."\">\n";
	print "<input type=submit value=\"&gt;&gt; ".date("F", $enddate + (86400 * 28))." &gt;&gt;\">\n";
	print "</form></td>\n";
    }
    print "</tr></table>\n";
?>
  <table>
    <tr>
      <th>
	<form action="<?php print PPURL; ?>">
	  <input type=submit value="<?php print PPNAME; ?> Calendar">
	</form>
      </th>
      <th>
	<form action="viewsearch.php">
	  <input type=submit value="Search">
	</form>
      </th>
<?php
    if (isset($_COOKIE[ADMINCOOKIE]) && $_COOKIE[ADMINCOOKIE] == 'bikefun') {
	print "      <th>\n";
	print "        <form action=\"admin.php\">\n";
	print "          <input type=submit value=\"Administration Menu\">\n";
	print "        </form>\n";
	print "      </th>\n";
    }
?>
      <th>
	<form action="calform.php">
	  <input type=hidden name="form" value="short">
	  <input type=submit value="Add an event">
	</form>
      </th>
      <th>
	<a href="rssfeeds.php"><img src="images/rss.gif" alt="RSS" title="RSS feeds" border=0></a>
      </th>
    </tr>
  </table>
  <table border=2>
    <tr>
      <th class="weeks">Sunday</th>
      <th class="weeks">Monday</th>
      <th class="weeks">Tuesday</th>
      <th class="weeks">Wednesday</th>
      <th class="weeks">Thursday</th>
      <th class="weeks">Friday</th>
      <th class="weeks">Saturday</th>
    </tr>
<?php
	# For each week...
	$thisdate = $startdate;
	for ($week = 1; $week <= $numweeks; $week++) {
	    # start a row
	    print "    <tr valign=top>\n";

	    # generate all 7 days of the row
	    for ($dayofweek = 0; $dayofweek < 7; $dayofweek++, $thisdate += 86400) {
		print "      <td id=\"cal".date("j",$thisdate)."\">";
		print "        <a href=\"#".date("Fj",$thisdate)."\" title=\"".date("M j, Y", $thisdate)."\" style=\"font-size: larger; text-decoration: none;\">".date("j", $thisdate)."</a>\n";
		tinyentries(date("Y-m-d", $thisdate));
		print "      </td>\n";
	    }

	    # end the row
	    print "    </tr>\n";
	}
?>
  </table>
</center>

<?php
	# for each week...
	$thisdate = $startdate;
	for ($week = 1; $week <= $numweeks; $week++) {
	    # for each day within the week...
	    for ($dayofweek = 0; $dayofweek < 7; $dayofweek++, $thisdate += 86400) {
	        #output the day
		print "  <div class=hr></div>\n";
		print "  <h2><a name=\"".date("Fj",$thisdate)."\">".date("l F j", $thisdate)."</a></h2>\n";
		fullentries(date("Y-m-d", $thisdate));
	    }
	}
?>

  <script language="JavaScript" type="text/javascript">
    <!--
      /* Highlight today in the calendar table */
      var now = new Date();
      var day = now.getDate();
      document.getElementById("cal"+day).style.background = "#ffcf00";
    //-->
  </script>
</div>
<?php
	if (!isset($_REQUEST['p']))
	{
		include(INCLUDES."/footer.html");
	}
	else
	{
		print "</body>";
		print "</html>";
	}
?>

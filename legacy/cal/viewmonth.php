<?php
# This displays one whole month's events.  It has buttons to move to the
# preceding and following months.
# It accepts the following parameters:
#
#	p=...		If non-empty, then use "print friendly" version
#
#	month=...	Month to show, as a number, defaulting to current month
#
#	year=...	Year of the month, defaulting to current year.
#
# In addition, you can append "#$day-$id" to jump to the $id event that falls
# on the $day day of the given month.  For example, to go to the event#231
# on May 1, 2008, you could use "viewmonth.php?year=2008&month=5#01-231"

	include("include/common.php");
	include("include/view.php");
	include(INCLUDES."/header.html");
?>

<link rel='stylesheet' href='<?php echo CALURL; ?>css/viewmonth.css' />

<?php
	
	

	# Choose the month.
	$now = getdate();
	if ($_REQUEST["month"] >= 1 && $_REQUEST["month"] <= 12)
		$month = $_REQUEST["month"];
	else
		$month = $now["mon"];
	if ($_REQUEST["year"] >= 2000 && $_REQUEST["year"] < 2038)
		$year = $_REQUEST["year"];
	else
		$year = $now["year"];
	$startdate = strtotime("$month/1/$year");

	# This function is used in the weekly grid portion of the calendar,
	# to skip multiple days in the column.  If a large number of days
	# are to be skipped, it may put something useful in there.
	function skipdays($days)
	{
	    if ($days == 1)
		print "<td>&nbsp;</td>\n";
	    else if ($days > 3 && file_exists("Quotations")) {
		mt_srand ((double) microtime() * 1000000);
		$lines = file("includes/text/quotations.txt");
		$line_number = mt_rand(0,sizeof($lines)-1);
		$quotation = htmlspecialchars($lines[$line_number]);
		$quotation = preg_replace('/^(.*)~/','<em>$1</em><br>--',$quotation);
		$length = strlen($lines[$line_number]);
		$style = "text-align:center; color: #804000;";
		if ($length / $days > 80)
		    $style .= "font-size: xx-small;";
		else if ($length / $days > 50)
		    $style .= "font-size: x-small;";
		else if ($length / $days > 35)
		    $style .= "font-size: small;";
		print "<td colspan=$days style=\"$style\">$quotation</td>\n";
	    } else
		print "<td colspan=$days>&nbsp;</td>\n";
	}

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
    print "<h1>Bikey Fun, ".date("F Y", $startdate)."</h1>";
    print "<table><tr>\n";
    print "<td><form action=\"viewmonth.php\">\n";
    $prevyear = $year;
    $prevmonth = $month - 1;
    if ($prevmonth == 0) {
	$prevmonth = 12;
	$prevyear--;
    }
    $nextyear = $year;
    $nextmonth = $month + 1;
    if ($nextmonth == 13) {
	$nextmonth = 1;
	$nextyear++;
    }
    print "<input type=hidden name=month value=\"$prevmonth\">\n";
    print "<input type=hidden name=year value=\"$prevyear\">\n";
    print "<input type=submit value=\"&lt;&lt; ".date("F Y", $startdate - 86400)." &lt;&lt;\">\n";
    print "</form></td>\n";

    print "<td><form action=\"viewmonth.php\">\n";
    print "<input type=hidden name=month value=\"$nextmonth\">\n";
    print "<input type=hidden name=year value=\"$nextyear\">\n";
    print "<input type=submit value=\"&gt;&gt; ".date("F Y", $startdate + (86400 * 45))." &gt;&gt;\">\n";
    print "</form></td>\n";
    print "</tr></table>\n";
?>
  <table>
    <tr>
      <th>
	<form action="view3week.php">
	  <input type=submit value="Current Calendar">
	</form>
      </th>
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
    <tr>
<?php
	# If month doesn't start on Sunday, then skip earlier days
	$weekday = getdate($startdate);
	$weekday = $weekday["wday"];
	if ($weekday != 0) {
	    skipdays($weekday);
	}

	# For each day...
	$timet["mday"] = 0;
	for ($thisdate = $startdate; $timet["mday"] != 1; ) {
	    $thisyyyymmdd = date("Y-m-d", $thisdate);
	    $class = (date("Y-m-d") == $thisyyyymmdd) ? "today" : "weeks";
	    print "      <td class=\"$class\" id=\"cal".date("j",$thisdate)."\">\n";
	    print "        <a href=\"#".date("Fj",$thisdate)."\" title=\"".date("M j, Y", $thisdate)."\" style=\"font-size: larger; text-decoration: none;\">".date("j", $thisdate)."</a>\n";
	    tinyentries($thisyyyymmdd);
	    print "      </td>\n";

	    # increment the date
	    $thisdate += 86400 + 3600;
	    $timet = getdate($thisdate);
	    $thisdate -= 3600 * $timet["hours"];

	    # If next day is a Sunday and isn't the start of the following
	    # month, then end that row and start another.
	    if ($timet["wday"] == 0 && $timet["mday"] != 1) {
		print "    </tr><tr>\n";
	    }
	}

	# If following month doesn't start on a Sunday, then skip days
	if ($timet["wday"] != 0) {
	    skipdays(7 - $timet["wday"]);
	}
?>
    </tr>
  </table>
</center>

<?php
    # for each week...
    $timet["mday"] = 0;
    for ($thisdate = $startdate; $timet["mday"] != 1; ) {
	#output the day
	print "  <div class=hr></div>\n";
	print "  <h2><a name=\"".date("Fj",$thisdate)."\">".date("l F j", $thisdate)."</a></h2>\n";
	fullentries(date("Y-m-d", $thisdate));

	#increment the date
	$thisdate += 86400 + 3600;
	$timet = getdate($thisdate);
	$thisdate -= 3600 * $timet["hours"];
    }
?>
</div>
<?php
    if (!isset($_REQUEST['p'])) {
	include(INCLUDES."/footer.html");
    } else {
	print "</body>";
	print "</html>";
    }
?>

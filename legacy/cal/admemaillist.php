<?php
# This page is used by administrators only!  It lists the email addresses
# of everybody who has led a ride during a given date range, in unobfuscated
# form.  The output can be given in HTML or CSV formats

# If no range is given, then it will ask for a date range before it
# shows any results.
#
# The response is always an HTML table listing the print data of the events,
# with extra facilities for editing them.  The actual changing is done via
# the vfyreview.php request.
#
# dates=	Date range, typically "month" or "mm/dd - mm/dd"
# format=csv	Output in CSV format instead of HTML
# format=plain	Output in CSV format, but label it as being plain text

# Disable the cache
header( 'Expires: '. gmdate('D, d M Y H:i:s') . 'GMT' );
header( 'Last-Modified: ' . gmdate('D, d M Y H:i:s') . ' GMT' );
header( 'Cache-Control: no-cache, must-revalidate' );
header( 'Pragma: no-cache' );

# If not logged in, then complain
$loggedin = 0;
if ($_POST["user"] == ADMINUSER && $_POST["pass"] == ADMINPASS) {
    setcookie(ADMINCOOKIE, "bikefun", time()+3600, "/");
    $loggedin = 1;
} else if ($_COOKIE[ADMINCOOKIE] == "bikefun") {
    $loggedin = 1;
}
if (!$loggedin) {
    print "<h1>No Permission</h1>\n";
    print "You must log in as the administrator before you're allowed\n";
    print "to do that.  You can log in <a href=\"admin.php\">here</a>.\n";
    print "</body></html>\n";
    exit();
}

# The usual initialization...
include("include/common.php");
include("include/repeat.php");



# If CSV then output the MIME type
if (($_REQUEST['format'] == 'csv'||$_REQUEST['format'] == 'plain') && $_REQUEST['dates'])
{
    header( 'Content-type: text/'.$_REQUEST['format'] );
    $format = 'csv';
}
else
{
    include(INCLUDES."/header.html");
    $format = 'html';
}

# At this point, we can be in one of three states:
#   1) logged in but no dates so PROMPT FOR DATES
#   2) logged in, with dates, doing CSV
#   3) logged in, with dates, doing HTML, PROMPT FOR NEW DATES ANYWAY
# What we need to do next is whittle away the first two cases, and then
# blend the handling of the last two since they use the same SQL requests.

# If dates, convert it to $daylist array
if ($_REQUEST['dates'] == 'pp2012') {
    $daylist = array();
    $daylist[] = array(sqldate=>'2012-06-07');
    $daylist[] = array(sqldate=>'2012-06-08');
    $daylist[] = array(sqldate=>'2012-06-09');
    $daylist[] = array(sqldate=>'2012-06-10');
    $daylist[] = array(sqldate=>'2012-06-11');
    $daylist[] = array(sqldate=>'2012-06-12');
    $daylist[] = array(sqldate=>'2012-06-13');
    $daylist[] = array(sqldate=>'2012-06-14');
    $daylist[] = array(sqldate=>'2012-06-15');
    $daylist[] = array(sqldate=>'2012-06-16');
    $daylist[] = array(sqldate=>'2012-06-17');
    $daylist[] = array(sqldate=>'2012-06-18');
    $daylist[] = array(sqldate=>'2012-06-19');
    $daylist[] = array(sqldate=>'2012-06-20');
    $daylist[] = array(sqldate=>'2012-06-21');
    $daylist[] = array(sqldate=>'2012-06-22');
    $daylist[] = array(sqldate=>'2012-06-23');
    $daylist[] = array(sqldate=>'2012-06-24');
    $daylist[] = array(sqldate=>'2012-06-25');
    $daylist[] = array(sqldate=>'2012-06-26');
    $daylist[] = array(sqldate=>'2012-06-27');
    $daylist[] = array(sqldate=>'2012-06-28');
    $daylist[] = array(sqldate=>'2012-06-29');
    $daylist[] = array(sqldate=>'2012-06-30');
} else if ($_REQUEST['dates'] == 'pp2011') {
    $daylist = array();
    $daylist[] = array(sqldate=>'2011-06-09');
    $daylist[] = array(sqldate=>'2011-06-10');
    $daylist[] = array(sqldate=>'2011-06-11');
    $daylist[] = array(sqldate=>'2011-06-12');
    $daylist[] = array(sqldate=>'2011-06-13');
    $daylist[] = array(sqldate=>'2011-06-14');
    $daylist[] = array(sqldate=>'2011-06-15');
    $daylist[] = array(sqldate=>'2011-06-16');
    $daylist[] = array(sqldate=>'2011-06-17');
    $daylist[] = array(sqldate=>'2011-06-18');
    $daylist[] = array(sqldate=>'2011-06-19');
    $daylist[] = array(sqldate=>'2011-06-20');
    $daylist[] = array(sqldate=>'2011-06-21');
    $daylist[] = array(sqldate=>'2011-06-22');
    $daylist[] = array(sqldate=>'2011-06-23');
    $daylist[] = array(sqldate=>'2011-06-24');
    $daylist[] = array(sqldate=>'2011-06-25');
    $daylist[] = array(sqldate=>'2011-06-26');
} else if ($_REQUEST['dates'] == 'pp2010') {
    $daylist = array();
    $daylist[] = array(sqldate=>'2010-06-10');
    $daylist[] = array(sqldate=>'2010-06-11');
    $daylist[] = array(sqldate=>'2010-06-12');
    $daylist[] = array(sqldate=>'2010-06-13');
    $daylist[] = array(sqldate=>'2010-06-14');
    $daylist[] = array(sqldate=>'2010-06-15');
    $daylist[] = array(sqldate=>'2010-06-16');
    $daylist[] = array(sqldate=>'2010-06-17');
    $daylist[] = array(sqldate=>'2010-06-18');
    $daylist[] = array(sqldate=>'2010-06-19');
    $daylist[] = array(sqldate=>'2010-06-20');
    $daylist[] = array(sqldate=>'2010-06-21');
    $daylist[] = array(sqldate=>'2010-06-22');
    $daylist[] = array(sqldate=>'2010-06-23');
    $daylist[] = array(sqldate=>'2010-06-24');
    $daylist[] = array(sqldate=>'2010-06-25');
    $daylist[] = array(sqldate=>'2010-06-26');
    $daylist[] = array(sqldate=>'2010-06-27');
} else if ($_REQUEST['dates']) {
    $daylist = repeatdates($_REQUEST["dates"]);
    if ($daylist[365])
	$daylist = array();
} else {
    $daylist = array();
}


# Collect a list of email address for this year's events
$currentemails = array();
$sql = "SELECT DISTINCT email FROM calevent, caldaily WHERE calevent.id = caldaily.id AND eventstatus<>\"S\" AND eventstatus<>\"C\" AND eventdate>=\"".PPSTART."\" AND eventdate<=\"".PPEND."\"";
$result = mysql_query($sql, $conn) or die(mysql_error());
while ($record = mysql_fetch_array($result))
    $currentemails[] = $record['email'];


# If if HTML then always prompt for dates
if ($format == 'html')
{
    # Make it pretty
    print "<s"."tyle type=\"text/css\">\n";
    print "  table { border: medium solid black; border-collapse: collapse; background: #ffec86; }\n";
    print "  th    { border: thin solid black; background: url(images/owall.gif); background: #ffcb6a;}\n";
    print "  td    { border-left: thin solid black; border-right: thin solid black; padding: 4px; vertical-align: top; background: url(images/gradient.gif) repeat-x;}\n";
    print "  a.button { border: medium outset #ffd080; background: #ffd080; text-decoration: none; padding-left: 2px; padding-right: 2px; cursor: pointer; white-space: nowrap;}\n";
    print "</st"."yle>\n";

    # Centering is nice
    print "<center>\n";

    # Always prompt for dates
    print "  <form action=\"admemaillist.php\">\n";
    print "    Date range:<input type=text size=30 name=\"dates\" value=\"".$_REQUEST["dates"]."\" onChange=\"submit()\">\n";
    print "  </form>\n";
    if ($_REQUEST["dates"] == "") {
	print "<br>Enter the event dates of the whose email addresses you want.\n";
	print "<br>As special cases, \"pp2010\"i, \"pp2011\", or \"pp2012\"\n";
	print "<br>use the dates of Pedalpalooza for each<br>of those years.<br>\n";
    } else {
	if ($daylist[365])
	    $daylist = array();
	if (count($daylist) == 0) {
	    print "<br><font color=red>Invalid date range.</font><br>Date ranges are typically a month name,<br>or of the form \"MM/DD&nbsp;-&nbsp;MM/DD\"\n";
	    print "<br>As special cases, \"pp2010\"i, \"pp2011\", or \"pp2012\"\n";
	    print "<br>use the dates of Pedalpalooza for each of those years<br>\n";
	}
    }

    # Also start the result table
    if (count($daylist) > 0) {
	print "WARNING: These email addresses are not protected in any way.<br>\n";
	print "<span style=\"font-size: larger\">Do not distribute this list anywhere!</span><br>\n";
	print "<table>\n";
	print "  <tr>\n";
	print "    <th>Email</th>\n";
	print "    <th>Name</th>\n";
	print "    <th>Events</th>\n";
	print "    <th>Any in ".substr(PPSTART, 0, 4)."</th>\n";
	print "  </tr>\n";
    }
} else {
    # Okay, we'll give CSV a header too
    print "\"email\",\"name\",\"title\",\"any".substr(PPSTART, 0, 4)."\"\n";
}

# Okay, now we need to collect information.  For each day in the date range,
# we need to collect info about the events on that day, and then merge the
# info into our list of email addresses and the names/events associated with
# those email addresses.  No output is generated during this phase.

# Start with empty lists
$names = array();
$titles = array();
# For each day...
foreach ($daylist as $day) {

    # Fetch the event info for each event on this day
    $sql = "SELECT name, email, title, dates, datestype, area, eventdate  FROM calevent, caldaily WHERE calevent.id = caldaily.id AND eventstatus<>\"S\" AND eventstatus<>\"C\" AND eventdate=\"".$day["sqldate"]."\" ORDER BY email, eventdate";
    $result = mysql_query($sql, $conn) or die(mysql_error());

    # For each event...
    while ($record = mysql_fetch_array($result)) {
	# if no info for this email yet, then start a new empty array for it
	$email = $record['email'];
	if (!$names[$email])
	{
		$names[$email] = array();
		$titles[$email] = array();
	}

	# append this name and title, but avoid duplicates
	if (array_search($record['name'], $names[$email]) === FALSE)
	    $names[$email][] = $record['name'];
	if (array_search($record['title'], $titles[$email]) === FALSE)
	    $titles[$email][] = $record['title'];
    }
}

# NOW WE HAVE THE INFO WE NEED.  Output it in the requested format.
foreach ($names as $email => $namelist)
{
    $anycurrent = array_search($email, $currentemails) !== FALSE ? "Yes" : "No";
    if ($format == 'html') {
	print "  <tr>\n";
	print "    <td>$email</td>\n";
	print "    <td>";
	foreach($namelist as $thisname)
	    print "$thisname<br>\n";
	print "</td>\n";
	print "    <td>\n";
	foreach($titles[$email] as $thistitle) {
	    $safetitle = htmlspecialchars($thistitle);
	    print "$safetitle<br>\n";
	}
	print "</td>\n";
	print "    <td align=center>$anycurrent</td>\n";
	print "  </tr>\n";
    } else {
	$once = $email;
	foreach($titles[$email] as $i => $thistitle) {
	    $name = $namelist[$i];
	    $safetitle = str_replace("\"", "\"\"", $thistitle);
	    print "\"$once\",\"$name\",\"$safetitle\",\"$anycurrent\"\n";
	    $once = '';
	}
    }
}

# HTML needs a footer
if ($format == 'html') {
    print "</table>\n";
    if (count($daylist) > 0 && count($names) > 0)
	print "<a style=\"button\" href=\"admemaillist.php?dates=".urlencode($_REQUEST['dates'])."&format=csv\">Return this info in CSV format</a>\n";
    print "</center>\n";
    include(INCLUDES."/footer.html");
}
#ex:set sw=4:
?>

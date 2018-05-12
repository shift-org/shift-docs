<?php
# This searches through the calendar data for user-supplied parameters,
# and lists the matching events.  It uses the following parameters:
#
#	text=		Text to search for, or "" to ignore text
#
#	dateradio=	One of "any", "past", "future", or "range" to select
#			events base on date.  In the case of "range", you
#			must also supply a range= parameter.
#
#	range=		Dates to search when dateradio=range.  This uses the
#			same parser as event dates, so you can use strings
#			such as "jun 12-28" or "mondays", but you can't search
#			within a specific year.
#
#	stat=		One of "A" for As Scheduled, "C" for canceled, or
#			"B" for both.

include("include/common.php");
include("include/repeat.php");
include("include/view.php");
include(INCLUDES."/header.html");

?>
<style type="text/css">
  div.content { background: #ffc969; }
  th.weeks { border: none; background: url(images/oocorner.gif) no-repeat; padding-top: 3px; }
  h2 {margin: 0; padding-left: 3px; background: url(images/oocorner.gif) no-repeat; clear: left;}
  dl {margin: 5px; page-break-before: avoid; page-break-after: auto; }
  dt {margin-top: 5px; font-weight: bold; clear: left; }
  dd {margin-bottom: 10px; margin-left: 50px; }
  dt.canceled { text-decoration: line-through; }
  dd.canceled { text-decoration: line-through; }
  div.hr {font-size: 1; height:3px; margin: 0; margin-top: 5px; width: 100%; background-color: #ff9a00;}
  form {margin: 0;}
</style>
<?php

# Connect to MySQL



# This is used for choosing which side images should go on.  The
# preferred side is always the right side since it doesn't interfere
# with the heading indentations that way.  But to avoid a "staircase"
# effect, if two consecutive events have images then the second one
# is left-aligned, and smaller.  This variable indicates how much
# overlap there is; if >0 then the image must go on the left.
$imageover = 0;

# Examine the parameters
$text = preg_replace("/[^a-zA-Z0-9']/", " ", stripslashes($_REQUEST["text"]));
$text = preg_replace("/  +/", " ", $text);
$text = preg_replace("/^ +/", "", $text);
$text = preg_replace("/ +$/", "", $text);
$dateradio = $_REQUEST["dateradio"];
$range = $_REQUEST["range"];
$dateerror = "";
switch ($dateradio) {
    case "past":
	$startdate = "";
	$enddate = date("Y-m-d", strtotime("yesterday"));
	break;
    case "future":
	$startdate = date("Y-m-d", strtotime("today"));
	$enddate = "";
	break;
    case "range":
	$dateradio = "range";
	$range = $_REQUEST["range"];
	$dates = repeatdates($range);
	switch ($dates["datestype"]) {
	    case "one":
	    case "consecutive":
		$startdate = $dates[1]["sqldate"];
		for ($i = 1; $dates[$i + 1]; $i++) {
		}
		$enddate = $dates[$i]["sqldate"];
		$range = $dates["canonical"];
		break;
	    case "scattered":
		$startdate = "";
		$enddate = "";
		$dateerror = "Can't search on scattered dates";
		break;
	    default:
		$startdate = "";
		$enddate = "";
		$dateerror = "Date range not understood";
		break;
	}
	break;
    default:
	$dateradio = "any";
	$startdate = "";
	$enddate = "";
}
$moddays = floatval($_REQUEST["moddays"]);
if ($moddays > 0.0)
    $modwhen = date("Y-m-d H:i:s", strtotime("now") - 86400 * $moddays);
else
    $modwhen = "";
$stat = $_REQUEST["stat"];
if ($stat != "A" && stat != "C")
    $stat = "B";
$family = $_REQUEST["family"];
$general = $_REQUEST["general"];
$adult = $_REQUEST["adult"];
?>

<!-- colors from logo image:
	Yellow #e0db56 #ecea9f
	Blue   #093e81 #7ea4cc
-->
<style type="text/css">
  table.form { border: inset medium #ffc969; }
  tr.form { border: 1px solid #ffc969; border-collapse: collapse; } 
  th.form { text-align: right; background: url(images/owall.gif); }
  td.form { background: #ffe880; }
  div.content { background: #ffc969; }
  h2 {margin: 0; padding-left: 3px; background: url(images/oocorner.gif) no-repeat; clear: left;}
  dl {margin: 5px; page-break-before: avoid; page-break-after: auto; }
  dt {margin-top: 5px; font-weight: bold; clear: left; }
  dd {margin-bottom: 10px; margin-left: 50px; }
  dt.canceled { text-decoration: line-through; }
  dd.canceled { text-decoration: line-through; }
  div.hr {font-size: 1; height:3px; margin: 0; margin-top: 5px; width: 100%; background-color: #ff9a00;}
</style>
<div id="content" class="content">

  <a id="cal">&nbsp;</a>
  <center>
    <h1>Search for Bikey Fun</h1>
    <button onClick="window.location.replace('view3week.php');">Current Calendar</button>
<?php
    print "<button onClick=\"window.location.replace('".PPURL."');\">".PPNAME." Calendar</button>\n";
    if ($_COOKIE[ADMINCOOKIE] == "bikefun") {
	print "<button onClick=\"window.location.replace('admin.php');\">Administration Menu</button>\n";
    }
?>
    <p>
    <form id="search" action="viewsearch.php">
      <table class=form>
        <tr class=form>
	  <td colspan=2 style="text-align: center; border-bottom: thin solid yellow;">
	    Fill in the search criteria below, and then click [Search].
	  </td>
	</tr>
	<tr class=form>
	  <th class=form>Words to find:</th>
	  <td class=form>
<?php
	    print "<input size=40 type=text name=text value=\"$text\">\n";
?>
	  </td>
	</tr>
	<tr class=form>
	  <th class=form>Event dates:</th>
	  <td class=form>
<?php
	    print "<input type=radio name=dateradio value=any";
	    if ($dateradio == "any") 
		print " checked";
	    print ">Any\n";
	    print "<input type=radio name=dateradio value=past";
	    if ($dateradio == "past") 
		print " checked";
	    print ">Past\n";
	    print "<input type=radio name=dateradio value=future";
	    if ($dateradio == "future") 
		print " checked";
	    print ">Future\n";
	    print "<input type=radio name=dateradio value=range";
	    if ($dateradio == "range") 
		print " checked";
	    print ">Range: \n";
	    print "<input type=text name=range value=\"$range\">\n";
?>
	  </td>
	</tr>
	<tr class=form>
	  <th class=form>Modified within:</th>
	  <td class=form>
<?php
	    print "<input type=text size=4 name=moddays value=\"${_REQUEST[moddays]}\">days\n";
?>
	  </td>
	</tr>
	<tr class=form>
	  <th class=form>Status:</th>
	  <td class=form>
<?php
	    print "<input type=radio name=stat value=A";
	    if ($stat == "A")
		print " checked";
	    print ">As&nbsp;Scheduled\n";
	    print "<input type=radio name=stat value=C";
	    if ($stat == "C")
		print " checked";
	    print ">Canceled\n";
	    print "<input type=radio name=stat value=\"\"";
	    if ($stat == "B")
		print " checked";
	    print ">Both\n";
?>
	  </td>
	</tr>
	<tr class=form>
	  <th class=form>Audience:</th>
	  <td class=form>
<?php
	    $all = FALSE;
	    if ($family != "y" && $general != "y" && $adult != "y")
	    $all = TRUE;
	    print "<input type=checkbox name=family value=y";
	    if ($family == "y" || $all)
		print " checked";
	    print ">Family-friendly\n";
	    print "<input type=checkbox name=general value=y";
	    if ($general == "y" || $all)
		print " checked";
	    print ">General\n";
	    print "<input type=checkbox name=adult value=y";
	    if ($adult == "y" || $all)
		print " checked";
	    print ">21+\n";
?>
	  </td>
	</tr>
	<tr class=form>
	  <td  colspan=2 style="text-align: center; border-top: thin solid yellow;">
	    <input type=submit value="Search">
	  </td>
	</tr>
      </table>
    </form>
  </center>
<?php

# Try to build a "where" clause from the info we're given
$where = "";
$words = explode(" ", $text);
for ($i = 0; $words[$i]; $i++) {
    $w = $words[$i];
    if ($where != "")
	$where .= " AND ";
    $where .= "(title LIKE \"%$w%\" OR";
    $where .= " tinytitle LIKE \"%$w%\" OR";
    $where .= " descr LIKE \"%$w%\" OR";
    $where .= " printdescr LIKE \"%$w%\" OR";
    $where .= " contact LIKE \"%$w%\" OR";
    $where .= " name LIKE \"%$w%\" OR";
    $where .= " locname LIKE \"%$w%\" OR";
    $where .= " address LIKE \"%$w%\" OR";
    $where .= " locdetails LIKE \"%$w%\" OR";
    $where .= " newsflash LIKE \"%$w%\")";
}
if ($dateerror == "" && $startdate != "") {
    if ($where != "")
	$where .= " AND ";
    $where .= "eventdate >= \"$startdate\"";
} 
if ($dateerror == "" && $enddate != "") {
    if ($where != "")
	$where .= " AND ";
    $where .= "eventdate <= \"$enddate\"";
} 
if ($modwhen != "") {
    if ($where != "")
	$where .= " AND ";
    $where .= "(caldaily.modified >= \"$modwhen\" OR calevent.modified >= \"$modwhen\")";
}
if ($stat == "A" || $stat == "C") {
    if ($where != "")
	$where .= " AND ";
    $where .= "eventstatus = \"$stat\"";
}
$or = "";
if ($family == "y") {
	 $or = "audience = \"F\" ";
}
if ($general == "y") {
	if ($or != ""){
		$or .= " OR ";
	}
	$or .= "audience = \"G\" ";
}
if ($adult == "y") {
	if ($or != ""){
		$or .= " OR ";
	}
	$or .= "audience = \"A\" ";
}
if ($or != "") {
	$where .= "($or)";
}
# were we able to make any WHERE clause?
if ($where != "") {
    $sql = "SELECT * FROM calevent, caldaily WHERE calevent.id = caldaily.id AND $where";
    #print "<br><code>$sql</code><br>";
    $result = mysql_query($sql, $conn) or die(mysql_error());

    # print the number of events found
    print "<center>";
    $num = mysql_num_rows($result);
    if ($num == 1)
	print "1 event found";
    else
	print "$num events found";
    print "</center>\n";

    # for each event...
    $thisdate = "";
    print "<dl>\n";
    while ($record = mysql_fetch_array($result)) {
	if ($thisdate != $record["eventdate"]) {
	    $thisdate = $record["eventdate"];
	    
	    print "<div class=hr></div><h2>".date("l F j, Y", strtotime($thisdate))."</h2>\n";
	}
	fullentry($record);
    }
    print "</dl>\n";
} else if ($dateerror) {
    print "<font color=red>$dateerror</font>\n";
} else {
    print "<div class=hr></div>\n";
    print "<h2>A few tips...</h2>\n";
    print "<ul>\n";
    print "<li>The \"Words to find\" field lets you list words to search for\n";
    print "    in the title, description, newsflash, address, and a few\n";
    print "    other fields.  If you give more than one word, then it'll\n";
    print "    only return events which contain all of those words.  The\n";
    print "    comparison treats uppercase letters and lowercase letters\n";
    print "    as matching.  Leave the field blank if you don't want to\n";
    print "    search for words.\n";
    print "<li>For \"Event dates\", to search for a range of dates you must\n";
    print "    click \"Range\" and then specify the range in the text box\n";
    print "    on the right, and it only works for ranges of <em>future</em>\n";
    print "    days.  If you don't want to search by date, select \"Any\".\n";
    print "<li>The \"Modified within\" field allows you to select events\n";
    print "    that have been modified with a given number of days.  You can\n";
    print "    use a floating point number such as \"0.5\" to find events\n";
    print "    that were modified within 12 hours.  If you don't want to\n";
    print "    search by modification time, then leave this field blank.\n";
    print "<li>The status search is pretty obvious.  If you don't want to\n";
    print "    searh by status, select \"Both\".\n";
    print "<li>You must select at least one search criteria.  If you select\n";
    print "    more than one, then the search will return individual items\n";
    print "    that match all criteria.  Multi-day events that match will\n";
    print "    be listed separately for each date that they match.\n";
    print "</ul>\n";
}
?>
</div>
<?php
    include(INCLUDES."/footer.html");
?>

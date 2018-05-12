<?php
# This searches through the calendar data for user-supplied parameters,
# and lists the matching events.  It uses the following cookie:
#
#	myevents	a comma-delimited list of tokens identifying the
#			events you care about.

$startdate = "2009-06-11";
$enddate = "2009-06-27";

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




# This function generates a token identifying a specific event on a given date
function maketoken($sqldate, $id)
{
    global $startdate;

    # Convert the date to a letter
    $day = round(substr($sqldate, -2));
    $startday = round(substr($startdate, -2));
    $token = substr("ABCDEFGHIJKLMNOPQRSTUVWXYZ", $day - $startday, 1);

    # Convert the id to a base-36 number
    while ($id > 0) {
	$token .= substr("0123456789abcdefghijklmnopqrstuvwxyz", $id % 36, 1);
	$id = floor($id / 36);
    }

    return $token;
}

# This function tests whether a given event is in the user's list, by
# examining the contents of the "myevents" cookie.
function ischecked($sqldate, $id)
{
    $token = maketoken($sqldate, $id);
    $list = explode(",", $_COOKIE["myevents"]);
    for ($i = 0; $list[$i]; $i++) {
	if ($list[$i] == $token)
	    return TRUE;
    }
    return FALSE;
}


# This is used for choosing which side images should go on.  The
# preferred side is always the right side since it doesn't interfere
# with the heading indentations that way.  But to avoid a "staircase"
# effect, if two consecutive events have images then the second one
# is left-aligned, and smaller.  This variable indicates how much
# overlap there is; if >0 then the image must go on the left.
$imageover = 0;
?>

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
    <h1>My Event List</h1>
    This lists the details of <strong>only</strong> the events with checkmarks
    on the <a href="viewmy09.php"><?php print CALURL; ?>viewmy09.php</a> page.
<?php
$sql = "SELECT * FROM calevent, caldaily WHERE calevent.id = caldaily.id AND eventdate >= '$startdate' AND eventdate <= '$enddate' ORDER BY eventdate, eventtime";
$result = mysql_query($sql, $conn) or die(mysql_error());

# for each event...
$thisdate = "";
print "<dl>\n";
while ($record = mysql_fetch_array($result)) {
    if (ischecked($record["eventdate"], $record["id"])) {
	if ($thisdate != $record["eventdate"]) {
	    $thisdate = $record["eventdate"];
	    
	    print "</dl>\n";
	    print "<div class=hr></div><h2>".date("l F j", strtotime($thisdate))."</h2>\n";
	    print "<dl>\n";
	}
	fullentry($record);
    }
}
?>
</div>
<?php
    include(INCLUDES."/footer.html");
    #ex:se sw=4:
?>

<?php
# This is meant to be used for pop-up info on the viewmypp.php page.
# It displays a single event.  For multi-day events, it shows only a single
# date.
#
#     id=	Identifies the event to show
#     sqldate=	Identifies the date of the event (for multi-day events)

$id = $_REQUEST["id"];
$sqldate = $_REQUEST["sqldate"];

include("include/common.php");
include("include/repeat.php");
include("include/view.php");

?>
<style type="text/css">
  h2 {margin: 0; padding-left: 3px; clear: left; width: 100%;}
  dl {margin: 5px; }
  dt {margin-top: 5px; font-weight: bold; clear: left; }
  dd {margin-bottom: 10px; margin-left: 50px; }
  dt.canceled { text-decoration: line-through; }
  dd.canceled { text-decoration: line-through; }
  div.hr {font-size: 1; height:3px; margin: 0; width: 100%; background-color: #ff9a00;}
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
?>
<?php
$sql = "SELECT * FROM calevent, caldaily WHERE calevent.id = caldaily.id AND eventdate = '$sqldate' AND calevent.id = $id";
$result = mysql_query($sql, $conn) or die(mysql_error());
$record = mysql_fetch_array($result);
print "<h2>".date("l F j", strtotime($record["eventdate"]))."</h2>\n";
print "<dl>\n";
fullentry($record);
print "</dl>\n";
?>
<?php
    #ex:se sw=4:
?>

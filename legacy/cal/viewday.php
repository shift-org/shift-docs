<?php
# The viewppXXXX.php page doesn't always load all days' events, for the sake
# of saving bandwidth.  When it needs to load a day, it uses this page to
# fetch the data.  THIS IS NOT A COMPLETE PAGE!  It only contains the fragment
# of HTML code needed to fill in one day's long descriptions.
#
#     sqldate=	Identifies the date of the event (for multi-day events)
#     exclude=  TRUE to exclude 

$startdate = "2008-06-12";
$enddate = "2008-06-28";

$sqldate = $_REQUEST["sqldate"];
$exclude = !!$_REQUEST["exclude"];

include("include/common.php");
include("include/repeat.php");
include("include/view.php");

# Connect to MySQL



# This is used for choosing which side images should go on.  The
# preferred side is always the right side since it doesn't interfere
# with the heading indentations that way.  But to avoid a "staircase"
# effect, if two consecutive events have images then the second one
# is left-aligned, and smaller.  This variable indicates how much
# overlap there is; if >0 then the image must go on the left.
$imageover = 0;

# Generate the entries
fullentries($sqldate, $exclude);

#ex:se sw=4:
?>
<span></span>

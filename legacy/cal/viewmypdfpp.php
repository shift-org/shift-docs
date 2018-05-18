<?php
# This is used to generate a PDF file containing a custom Pedalpalooza
# calendar.  It assumes your list of events is stored in 
# This searches through the calendar data for user-supplied parameters,
# and lists the matching events.  It uses the following cookie:
#
#	myevents	a list of tokens identifying the events you care about.
#
# In addition, you can pass the following as parameters to the request,
# e.g. viewmypdfpp.php?image=Y to show the poster art on the front page.
#
#	printdescr	Non-empty to include print descriptions.
#
#       contact		Non-empty to include contact info
#
#       micro		Non-empty to use extra tiny font
#
#	image		Non-empty to show poster image on first page

include("include/pmPDF.php");

include("include/common.php");
include("include/repeat.php");
include("include/view.php");

# This function generates a token identifying a specific event on a given date
function maketoken($sqldate, $id)
{
    # Convert the date to a letter
    $day = round(substr($sqldate, -2));
    $startday = round(substr(PPSTART, -2));
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

# Connect to MySQL



# Start the PDF output
$args = array('folds' => 1, 'borders' => 0);
$pdf = new pmPDF($args);
$pdf->SetFont('Helvetica');
$pdf->SetFontSize($_REQUEST["micro"] == "" ? 8 : 6);
if ($_REQUEST["image"] == "")
    $firstpage = 1;
else {
    $pdf->add_image(PPSMALL, 1);
    $firstpage = 2;
}


# Fetch a list of all events, including the ones we won't print
$sql = "SELECT * FROM calevent, caldaily WHERE calevent.id = caldaily.id AND eventdate >= '".PPSTART."' AND eventdate <= '".PPEND."' AND eventstatus<>'E' AND eventstatus<>'S' AND eventstatus<>'C' ORDER BY eventdate, eventtime";
$result = mysql_query($sql, $conn) or die(mysql_error());

# for each event...
$thisdate = "";
while ($record = mysql_fetch_array($result)) {
    # If we care about this event...
    if (ischecked($record["eventdate"], $record["id"])) {

	# If the date is different, then output the date
	if ($thisdate != $record["eventdate"]) {
	    if ($thisdate == "") {
		$thisdate = $record["eventdate"];
		$pdf->add_text(strtoupper(date("l F j", strtotime($thisdate)))."  -------------------------", $firstpage);
	    } else {
		$thisdate = $record["eventdate"];
		$pdf->add_text(strtoupper(date("l F j", strtotime($thisdate)))."  -------------------------");
	    }
	}

	# Output the title.  Try to get a "bold" effect by outputting it twice,
	# with the second copy offset slightly.
	$startpg = $pdf->_sect;
	$startx = $pdf->_lastx;
	$starty = $pdf->_lasty;
	$pdf->add_text($record["tinytitle"]);
	if ($startpg == $pdf->_sect) {
	    $pdf->_lastx = $startx;
	    $pdf->_lasty = $starty + ($_REQUEST["micro"] == "" ? 0.005 : 0.003);
	    $pdf->add_text($record["tinytitle"]);
	}

	# Output the location
	$where = $record["address"];
	if ($record["locname"] != "")
	    $where = $record["locname"] . ", " . $where;
	if ($record["locdetails"] != "")
	    $where = $where . " (" . $record["locdetails"] . ")";
	$pdf->add_text($where);

	# Output the time
	$when = hmmpm($record["eventtime"]);
	if ($record["duration"] != 0)
	    $when .= " - " . endtime($when, $record["duration"]);
	if ($record["timedetails"] != "")
	    $when .= ", ".$record["timedetails"];
	$pdf->add_text($when);

	# If description is desired, then output that too
	if ($_REQUEST["printdescr"] != "") {
	    $pdf->add_text($record["printdescr"]);
	}

	# If contact info is desired, then output that too
	if ($_REQUEST["contact"] != "") {
	    $who = $record["name"];
	    if ($record["printemail"] && $record["email"] != "")
		$who .= ", ${record[email]}";
	    if ($record["printphone"] && strlen($record["phone"]) >= 7)
		$who .= ", ${record[phone]}";
	    if ($record["printweburl"] && $record["weburl"] != "")
		$who .= ", ${record[weburl]}";
	    if ($record["printwho"] && $record["contact"] != "")
		$who .= ", ${record[contact]}";
	    $pdf->add_text($who);
	}

	# blank line between items
	$pdf->add_text("");
    }
}

$pdf->Output();

exit;
    #ex:se sw=4:
?>

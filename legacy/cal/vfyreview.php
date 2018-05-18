<?php
# This is called AJAX-style to change the status of an event.  It is called
# from admreview.php.  Parameters are:
#
#   edit=	Obscured version of the event ID, indicating which event
#		should have its status changed.
#
#   review=	One of Inspect, Approved, Exclude, SentEmail, or Revised.
#		This changes the review status of the event.
#
#   tinytitle=	Optional.  New tinytitle for the event.
#
#   printdescr=	Optional.  New printed description for the event.

include("include/common.php");

# Open a connection to the SQL server



# Fetch the edit= parameter and convert it to an id
$id = unobscure($_REQUEST["edit"]);

# Fetch the current tiny title and print description.  This is partly just
# to verify the id, but if we end up sending email then we'll need the values.
$result = mysql_query("SELECT tinytitle, printdescr, email FROM calevent WHERE id = $id", $conn) or die("Fetching printdescr, ".mysql_error());
if (mysql_num_rows($result) == 0)
    die("The 'edit' parameter is invalid");
$record = mysql_fetch_array($result);

# Fetch the review= parameter and convert it to a single letter
switch ($_REQUEST["review"]) {
    case "Inspect":	$review = "I";	break;
    case "Approved":	$review = "A";	break;
    case "Exclude":	$review = "E";	break;
    case "SentEmail":	$review = "S";	break;
    case "Revised":	$review = "R";	break;
    default: die("The 'review' parameter is missing or invalid");
}

# Fetch the optional tinytitle= parameter;
$tinytitle = $_REQUEST["tinytitle"];

# Fetch the optional printdescr= parameter
$printdescr = $_REQUEST["printdescr"];

# Construct an SQL statement to store the changes, and submit it
$sql = "UPDATE calevent SET review = \"$review\"";
if ($printdescr)
    $sql .= ", tinytitle = \"$tinytitle\"";
if ($printdescr)
    $sql .= ", printdescr = \"$printdescr\"";
$sql .= " WHERE id = $id";
mysql_query($sql, $conn) or die("Updating event, ".mysql_error());

if ($tinytitle)
    $record["tinytitle"] = $tinytitle;
if ($printdescr)
    $record["printdescr"] = $printdescr;

# If "SentEmail" then really send it
if ($review == "S") {
    # Construct a URL.  This is complicated by the fact that we have to know
    # the server's name.
    $url = "http://";
    if ($_SERVER[HTTP_HOST])
	$url .= $_SERVER[HTTP_HOST];
    else
	$url .= $_SERVER[SERVER_NAME];
    $url .= dirname($_SERVER[REQUEST_URI]) . "/calform.php?edit=".obscure($id);

    # Construct the message body.  IF YOU CHANGE IT HERE, THEN YOU SHOULD
    # CHANGE IT IN ADMREVIEW.PHP TOO
    $body = "Please edit the PRINT DESCRIPTION of your ".$record["tinytitle"]."\n".
	    "event as soon as possible.  Right now the calendar crew\n".
	    "doesn't feel it is \"print ready\" and the print deadline\n".
	    "is May 10.  The current PRINT DESCRIPTION is:\n".
	    "\n".
	    wordwrap($record["printdescr"], 60)."\n".
	    "\n".
	    "You can edit your event here:\n".
	    "$url\n";

    $subject = "[Shift Cal] ".stripslashes($record["tinytitle"]);
    $to = stripslashes($record["email"]);
    $headers = "From: ".SHIFTEMAIL."\r\n"
	     . "List-Help: <$url>";
    mail($to, $subject, $body, $headers);
}

# Return a terse result
print "<h3>Success!</h3>\n";
print "review changed to $review<br>\n";
if ($tinytitle)
    print "tinytitle changed to $tinytitle<br>\n";
if ($printdescr)
    print "printdescr changed to $printdescr<br>\n";
if ($review == "S") {
    print "email sent to $to<br>\n";
    print "---<br>\n";
    print "&nbsp;nbsp;".str_replace("\n", "<br>\n", htmlspecialchars($body));
    print "---<br>\n";
}
print "SQL statement was:<br>\n&nbsp;&nbsp;&nbsp;$sql\n";
?>

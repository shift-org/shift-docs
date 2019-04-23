<?php
include("account.php");

# Directory where images are stored, other than event-specific images
define("IMAGES", "images");

# Image height limits for the online calendar
define("RIGHTHEIGHT", 200);
define("LEFTHEIGHT", 125);

# Default area code when entering a phone number
define("AREACODE", "503");

# Goofy login protection for ppadmin.php
define("ADMINUSER", "amsterdam");
define("ADMINPASS", getenv("CAL_ADMIN_PASSWORD"));

# Info about Pedalpalooza or Velopalooza.  In addition to the values here,
# you'll have to do some heavy editing to the year-specific version the
# festival calendar (e.g., "viewpp2010.php").
define("PPNAME", "Pedalpalooza");	    # Name of the festival
define("PPSTART", "2019-06-01");	    # Start date, in MySQL format
define("PPEND", "2019-06-30");		    # End date, in MySQL format
define("PPSTART_MONTHDAY", "June 1");	    # Start date, in "Month Day" format
define("PPDAYS", 30);			    # Duration in days
define("PPDATES", "June 1-30");		    # Dates, in "Month Day-Day" format
define("PPURL", "/pedalpalooza-calendar");	    # URL of the festival calendar
define("PPSMALL", "/images/pp/pp-general-banner.png");     # URL of the medium poster image
define("PPLARGE", "/images/pp/pp-general.png"); # URL of the full-size poster image

# Create a database connection
$conn = mysql_connect(DBHOST, DBUSER, DBPASSWORD) or die(mysql_error());
mysql_select_db(DBDATABASE, $conn);


# Use the default timezone
date_default_timezone_set('America/Los_Angeles');

# Convert a record's $id value into an obscured string.  This string
# may be used in later requests to locate an event for editing, so this
# function should to provide a bit of security.
function obscure($id)
{
    # Null or 0 $id is always ""
    if (!$id)
	return "";

    # Subject the id number to some reversible manipulations
    $id += 137;
    $id ^= ($id << 7) & 128;
    $id ^= ($id << 5) & 64;
    $id ^= ($id << 3) & 32;
    $id ^= ($id << 1) & 16;

    # Converted it to base-32 number, using words instead of digits
    $ob = "";
    while ($id > 0) {
	switch ($id & 0x1f) {
	    case 0:    $ob .= "Skewer";	break;
	    case 1:    $ob .= "Axle";	break;
	    case 2:    $ob .= "Hub";	break;
	    case 3:    $ob .= "Cog";	break;
	    case 4:    $ob .= "Spoke";	break;
	    case 5:    $ob .= "Valve";	break;
	    case 6:    $ob .= "Rim";	break;
	    case 7:    $ob .= "Tube";	break;
	    case 8:    $ob .= "Patch";	break;
	    case 9:    $ob .= "Tire";	break;
	    case 10:   $ob .= "Fork";	break;
	    case 11:   $ob .= "Head";	break;
	    case 12:   $ob .= "Frame";	break;
	    case 13:   $ob .= "Bar";	break;
	    case 14:   $ob .= "Grip";	break;
	    case 15:   $ob .= "Brake";	break;
	    case 16:   $ob .= "Cable";	break;
	    case 17:   $ob .= "Crank";	break;
	    case 18:   $ob .= "Pedal";	break;
	    case 19:   $ob .= "Tape";	break;
	    case 20:   $ob .= "Saddle";	break;
	    case 21:   $ob .= "Chain";	break;
	    case 22:   $ob .= "Stop";	break;
	    case 23:   $ob .= "Spacer";	break;
	    case 24:   $ob .= "Pump";	break;
	    case 25:   $ob .= "Lever";	break;
	    case 26:   $ob .= "Nut";	break;
	    case 27:   $ob .= "Pad";	break;
	    case 28:   $ob .= "Ball";	break;
	    case 29:   $ob .= "Cage";	break;
	    case 30:   $ob .= "Bead";	break;
	    case 31:   $ob .= "Light";	break;
	}
	$id >>= 5;
    }

    return $ob;
}

# Convert an obscured value (most likely from an "edit" parameter)
# back to a $id value that can be used in a SQL query
function unobscure($ob)
{
    # Convert the string from base-32 (using words instead of digits)
    # into a number.
    $id = 0;
    $shifter = 0;
    while ($ob != "")
    {
	# Get the next word.  Each word starts with a single character,
	# and continues for any number of lowercase letters.
	for ($i = 1; $i < strlen($ob) && ctype_lower(substr($ob, $i, 1)); $i++) {
	}
	$word = substr($ob, 0, $i);
	$ob = substr($ob, $i);

	# Convert the word into bits, and merge into number
	switch ($word) {
	    case "Skewer":	$id |= 0 << $shifter;	break;
	    case "Axle":	$id |= 1 << $shifter;	break;
	    case "Hub":	$id |= 2 << $shifter;	break;
	    case "Cog":	$id |= 3 << $shifter;	break;
	    case "Spoke":	$id |= 4 << $shifter;	break;
	    case "Valve":	$id |= 5 << $shifter;	break;
	    case "Rim":	$id |= 6 << $shifter;	break;
	    case "Tube":	$id |= 7 << $shifter;	break;
	    case "Patch":	$id |= 8 << $shifter;	break;
	    case "Tire":	$id |= 9 << $shifter;	break;
	    case "Fork":	$id |= 10 << $shifter;	break;
	    case "Head":	$id |= 11 << $shifter;	break;
	    case "Frame":	$id |= 12 << $shifter;	break;
	    case "Bar":	$id |= 13 << $shifter;	break;
	    case "Grip":	$id |= 14 << $shifter;	break;
	    case "Brake":	$id |= 15 << $shifter;	break;
	    case "Cable":	$id |= 16 << $shifter;	break;
	    case "Crank":	$id |= 17 << $shifter;	break;
	    case "Pedal":	$id |= 18 << $shifter;	break;
	    case "Tape":	$id |= 19 << $shifter;	break;
	    case "Saddle":	$id |= 20 << $shifter;	break;
	    case "Chain":	$id |= 21 << $shifter;	break;
	    case "Stop":	$id |= 22 << $shifter;	break;
	    case "Spacer":	$id |= 23 << $shifter;	break;
	    case "Pump":	$id |= 24 << $shifter;	break;
	    case "Lever":	$id |= 25 << $shifter;	break;
	    case "Nut":	$id |= 26 << $shifter;	break;
	    case "Pad":	$id |= 27 << $shifter;	break;
	    case "Ball":	$id |= 28 << $shifter;	break;
	    case "Cage":	$id |= 29 << $shifter;	break;
	    case "Bead":	$id |= 30 << $shifter;	break;
	    case "Light":	$id |= 31 << $shifter;	break;
	    default: return 0;
	}

	$shifter += 5;
    }

    # Reverse the numerical obscuring
    $id ^= ($id << 7) & 128;
    $id ^= ($id << 5) & 64;
    $id ^= ($id << 3) & 32;
    $id ^= ($id << 1) & 16;
    $id -= 137;
    return $id;
}

# Convert a time string from "hh:mm:ss" format to "h:mmpm" format
function hmmpm($hhmmss)
{
  return date("g:ia", strtotime($hhmmss));
}

# Return the result of adding minutes to a given time of day
function endtime($eventtime, $eventduration)
{
  return date("g:ia", strtotime("$eventtime + $eventduration minutes"));	
}

# Mangle an email address.  The result is an HTML string that uses images
# and superfluous tags to make the email address very hard for a spammer
# to harvest, but it still looks fairly normal on the screen.
function mangleemail($email)
{
    if ($email == "")
	return "";
    $mangle = str_replace("@", "<img border=0 src=\"".IMAGES."/at.gif\" alt=\" at \" />", $email);
    $mangle = str_replace(".com", "<img border=0 src=\"".IMAGES."/dotcom.gif\" alt=\" daht comm\" />", $mangle);
    $mangle = str_replace(".org", "<img border=0 src=\"".IMAGES."/dotorg.gif\" alt=\" daht oh are gee\" />", $mangle);
    $mangle = str_replace(".net", "<img border=0 src=\"".IMAGES."/dotnet.gif\" alt=\" daht nett\" />", $mangle);
    $mangle = str_replace(".edu", "<img border=0 src=\"".IMAGES."/dotedu.gif\" alt=\" daht eedee you\" />", $mangle);
    $mangle = str_replace(".us", "<img border=0 src=\"".IMAGES."/dotus.gif\" alt=\" daht you ess\" />", $mangle);
    $mangle = substr($mangle,0,1)."<span>".substr($mangle,1)."</span>";
    return $mangle;
}

# Convert an event's description to HTML.  This involves replacing HTML
# special characters with their equivalent entities, replacing "@" with
# an image of an "at" sign (a light form of email mangling), interpreting
# asterisks as boldface markers, converting URLs to links.
function htmldescription($descr)
{
    # Remove trailing whitespace, including trailing blank lines.
    $html = preg_replace("/[\r\n\t ]+$/", "", $descr);

    # Protect against HTML's special characters.
    $html = htmlentities($html);
    #$html = str_replace("&", "&amp;", $html);
    #$html = str_replace("<", "&lt;", $html);
    #$html = str_replace(">", "&gt;", $html);

    # Convert any "http://site/dir/" strings and "www.domain.com" names to
    # links.  For the sake of simplicity, we do not support using "&" in URLs.
    $html = preg_replace("/(https?:\/\/[^ \t\r\n\"&]*[a-zA-Z0-9\/])/", "<a href=\"$1\" class=\"smallhref\">$1</a>", $html);
    $html = preg_replace("/([^\\/])(www\\.[0-9a-zA-Z-.]*[0-9a-zA-Z-])($|[^\\/])/", "$1<a href=\"http://$2/\" class=\"smallhref\">$2</a>$3", $html);

    # Double spaces become a space and &nbsp; so they're still displayed as
    # double spaces.
    $html = str_replace("  ", " &nbsp;", $html);

    # Blank lines become <p>.  Other hard breaks become <br>
    $html = preg_replace("/\n\n\n*/", "<p>", $html);
    $html = str_replace("\n", "<br>", $html);

    # Text surrounded by asterisks should be boldface
    $html = preg_replace("/\*([0-9a-zA-Z][0-9a-zA-Z,.!?'\" ]*[0-9a-zA-Z,.!?'\"])\*/", "<strong>$1</strong>", $html);

    # Mask email addresses by replacing "@" with a graphical image of an "@"
    $html = str_replace("@", "<img src=\"".IMAGES."/at.gif\" alt=\"[at]\">", $html);

    # If it ends with an Portland Wheelmen ride spec, make that be a link
    # to their website's description.
    $html = preg_replace('/PWTC level[^,]*/', '<a href="http://www.pwtc.com/RideRating">$0</a>', $html);

    return $html;
}

# Convert text entered by the user into a format that is easy to compare.
# Specifically, this converts to lowercase and strips out meaningless chars.
# For example, "Col. Summer's Park" is converted to "col. summers park"
function canonize($guess)
{
    # Convert to lowercase
    $guess = strtolower($guess);

    # Remove anything other than letters, digits, periods, or spaces
    $guess = preg_replace("/[^a-z0-9. ]/", "", $guess);

    # Reduce multiple spaces to single spaces
    $guess = preg_replace("/   */", " ", $guess);

    # Reduce multiple periods or spaces with a single period and space.
    $guess = preg_replace("/[. ][. ][. ]*/", ". ", $guess);

    return $guess;
}


# Return the URL for a calendar view that includes a given date.  The $date
# should be supplied in MySQL's "YYYY-MM-DD" format.  The $id indicate which
# event on that date we want to see.
function viewurl($date, $id)
{
    # If no date, then just use view3week.php
    if (!$date)
	return "view3week.php";

    # Extract the day-of-month from the date.  It'll be incorporated into
    # the returned URL.
    list($yyyy, $mm, $dd) = explode('-', $date);

    # if within Pedalpalooza range, then use that calendar
    if ($date >= PPSTART && $date <= PPEND)
	return PPURL."#$dd-$id";

    # if within range of the 3-week calendar, use that
    $numweeks = 3;
    $now = getdate();
    $noon = $now[0] + (12 - $now["hours"]) * 3600; # approximately noon today
    $startdate = $noon - 86400 * $now["wday"];
    $enddate = $startdate + ($numweeks * 7 - 1) * 86400;
    $startdate = date("Y-m-d", $startdate);
    $enddate = date("Y-m-d", $enddate);
    if ($date >= $startdate && $date <= $enddate)
	return "view3week.php#$dd-$id";

    # otherwise we'll need to use the monthly calendar, and pass is a specific
    # month and year.
    return "viewmonth.php?year=$yyyy&month=$mm&startdate=$startdate&enddate=$enddate#$dd-$id";
}

# Process text supplied by the user to avoid dangerous characters
function safeinput($input)
{
	# First, replace common UTF-8 characters with ASCII characters
	$input = str_replace(
	array("\xe2\x80\x98", "\xe2\x80\x99", "\xe2\x80\x9c", "\xe2\x80\x9d",
		"\xe2\x80\x93", "\xe2\x80\x94", "\xe2\x80\xa6"),
	array("'", "'", '"', '"', '-', '--', '...'),
	$input);

	# Next, replace Microsoft "smart quotes" with real characters
	$input = str_replace(
	array("\\x91", "\\x92", "\\x93", "\\x94", "\\x96", "\\x97", "\\x85"),
	array("'", "'", '"', '"', '-', '--', '...'),
	$input);

	# Any other non-ASCII characters are removed
	$build = "";
	for ($i = 0; $i < strlen($input); $i++) {
	    $c = substr($input, $i, 1);
	    if (($c < "\x7e" && $c >= ' ') || $c == "\n")
		$build .= $c;
	}
	$input = $build;

	# return it
	return $input;
}

#ex:set shiftwidth=4 embedlimit=99999:
?>

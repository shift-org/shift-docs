<?php
# This is a fragment of PHP code.  It defines functions for generating a
# days' tiny entries (used in the weekly grid at the top of many views)
# and full entries (used in the body below the grid).
#
# IMPORTANT: THIS FILE MUST NOT OUTPUT ANYTHING!  It is included in some
# pages which alter the header.
#
# It is sensitive to the following HTTP parameters (which would be passed to
# the page that includes this file):
#
#   p=...	p=y to use printer-friendly formatting.
#
#   i=...	i=n to inhibit event images.
#
# It uses the following global variables, which should be declared in the
# file that includes this one:
#
#   $conn	A connection to the MySQL server
#
#   $imageover	Used to handle images that overlap entries.  It should be
#		initialized to 0
#
# In addition, it assumes the following CSS classes are defined:
#
#   div.tiny    { font-size: xx-small; font-stretch: ultra-condensed; }
#   div.tinier  { font-size: xx-small; font-stretch: ultra-condensed; }
#   dt.canceled { text-decoration: line-through; }
#   dd.canceled { text-decoration: line-through; }


# Return the URL for Trimet's trip planner
function trimeturl($sqldate, $eventtime, $address)
{
    # Generate $addr and maybe $city from $address
    $cities = array('BE=Beaverton', 'CA=Canby', 'CO=Cornelius', 'DU=Durham',
		    'ES=Estacada', 'FA=Fairview', 'FO=Forest Grove',
		    'GL=Gladstone', 'GR=Gresham', 'HA=Happy Valley',
		    'HI=Hillsboro', 'JA=Johnson City', 'KI=King City',
		    'LA=Lake Oswego', 'MA=Maywood Park', 'MI=Milwaukie',
		    'MO=Molalla', 'OR=Oregon City', 'PO=Portland',
		    'RI=Rivergrove', 'SH=Sherwood', 'TI=Tigard', 'TR=Troutdale',
		    'TU=Tualatin', 'WE=West Linn', 'WI=Wilsonville',
		    'WO=Wood Village');
    $city = "";
    for ($i = 0; $i < count($cities) && $city == ''; $i++) {
	$codename = explode('=', $cities[$i]);
	$addr = str_replace(", ${codename[1]}", '', $address);
	if ($addr != $address)
	    $city = $codename[0];
    }
    

    # Reformat the date from YYYY/MM/DD to MM/DD/YY
    $on = date("m/d/y", strtotime($sqldate));

    # Reformat the time from hh:mm:ss to hh:mm+pm
    $hhmmss = explode(':', $eventtime);
    $hour = $hhmmss[0] + 0;
    $minute = $hhmmss[1];
    if ($hour == 0) {
	$hour = 12;
	$ampm = "a.m.";
    } else if ($hour > 12) {
	$hour -= 12;
	$ampm = "p.m.";
    } else if ($hour == 12) {
	$ampm = "p.m.";
    } else {
	$ampm = "a.m.";
    }
    $by = "$hour:$minute+$ampm";

    $url = "http://trimet.org/go/cgi-bin/plantrip.cgi?to=".urlencode($addr);
    if ($city)
	$url .= "&Dcty=$city";
    $url .= "&by=$by&on=$on";
    return $url;
}

# Generate the HTML for all entries in a given day, in the tiny format
# used in the weekly grid near the top of the page.
function tinyentries($day, $exclude = FALSE, $loadday = FALSE)
{
    global $conn;
    $dayofmonth = substr($day, -2);
    $result = mysql_query("SELECT calevent.id, newsflash, title, tinytitle, eventtime, audience, area, eventstatus, descr, review, highlight FROM calevent, caldaily WHERE calevent.id=caldaily.id AND eventdate=\"${day}\" AND eventstatus<>\"E\" AND eventstatus<>\"S\" ORDER BY eventtime", $conn) or die(mysql_error());
    while ($record = mysql_fetch_array($result)) {
	if ($exclude && $record["review"] == "E")
	    continue;
	$id = $record["id"];
	$tinytitle = htmlspecialchars($record["tinytitle"]);
	$title = htmlspecialchars($record["title"]);
	if ($record["eventstatus"] == "C") {
	    $eventtime = "Cancel";
	    $decor = "line-through;";
	} else {
	    $eventtime = hmmpm($record["eventtime"]);
	    $decor = "none";
	}
	if ($record["audience"] == "F") {
	    $timecolor = "green";
	} elseif ($record["audience"] == "G") {
	    $timecolor = "black";
	} else {
	    $timecolor = "red";
	}
	if ($record["newsflash"] != "") {
	    $titlecolor = "magenta";
	} else if ($record["area"] == "V") {
	    $titlecolor = "blue";
	} else {
	    $titlecolor = "black";
	}
	if ($record['highlight']) {
	    if (strlen(strtok($tinytitle, " ")) < 12)
		print "<div style=\"background-color: #ffd000;\">";
	    else if (strlen(strtok($tinytitle, " ")) < 16)
		print "<div class=\"tiny\" style=\"background-color: #ffd000;\">";
	    else
		print "<div class=\"tinier\" style=\"background-color: #ffd000;\">";
	} else {
	    if (strlen(strtok($tinytitle, " ")) < 10)
		print "<div class=\"tiny\">";
	    else
		print "<div class=\"tinier\">";
	}
	if ($loadday)
	    $onclick = " onclick=\"loadday('$day', ".($exclude?"true":"false").", $id); return false;\"";
	else
	    $onclick = "";
	print "<a href=\"#${dayofmonth}-${id}\" title=\"${title}\" style=\"color:${titlecolor}; text-decoration: $decor;\"$onclick>";
	print "<strong style=\"color:${timecolor};\">${eventtime}</strong>";
	if (strpos($record["descr"], "\$") != FALSE)
	    print "&nbsp;<strong>\$\$</strong>";
	print "&nbsp;${tinytitle}</a></div>";
    }
}

# Generate the HTML entry for a single event
function fullentry($record)
{
    global $conn;
    global $imageover;

    # 24 hours ago.  We compare timestamps to this in order to
    # detect recently changed entries.
    $yesterday = date("Y-m-d H:i:s", strtotime("yesterday"));

    # extract info from the record
    $id = $record["id"];
    $title = htmlspecialchars(strtoupper($record["title"]));
    if ($record["eventstatus"] == "C") {
	$eventtime = "CANCELED";
	$eventduration = 0;
    } else {
	$eventtime = hmmpm($record["eventtime"]);
	$eventduration = $record["eventduration"];
    }
    $dayofmonth = substr($record["eventdate"], -2);
    $timedetails = $record["timedetails"];
    if ($record["audience"] == "F" && $record["area"] == "P") {
	$badge = "ff.gif";
	$badgealt = "FF";
	$badgehint = "Family Friendly";
    }
    if ($record["audience"] == "G" && $record["area"] == "P") {
	$badge = "";
	$badgealt = "";
	$badgehint = "";
    }
    if ($record["audience"] == "A" && $record["area"] == "P") {
	$badge = "beer.gif";
	$badgealt = "21+";
	$badgehint = "Adult Only (21+)";
    }
    if ($record["audience"] == "F" && $record["area"] == "V") {
	$badge = "ffwa.gif";
	$badgealt = "FF,WA";
	$badgehint = "Family Friendly, Meet in/around Vancouver";
    }
    if ($record["audience"] == "G" && $record["area"] == "V") {
	$badge = "washington.gif";
	$badgealt = "WA";
	$badgehint = "Meet in/around Vancouver";
    }
    if ($record["audience"] == "A" && $record["area"] == "V") {
	$badge = "beerwa.gif";
	$badgealt = "21+,WA";
	$badgehint = "Adult Only (21+), Meet in/around Vancouver";
    }
    $address = htmlspecialchars($record["address"]);
    if ($record["locname"])
	$address = htmlspecialchars($record["locname"]).", $address";
    $locdetails = htmlspecialchars($record["locdetails"]);
    $descr = htmldescription($record["descr"]);
    $newsflash = htmlspecialchars($record["newsflash"]);
    $name = htmlspecialchars(ucwords($record["name"]));
    $email = $record["hideemail"] ? "" : htmlspecialchars($record["email"]);
    $email = mangleemail($email);
    $phone = $record["hidephone"] ? "" : htmlspecialchars($record["phone"]);
    $contact = $record["hidecontact"] ? "" : htmlspecialchars($record["contact"]);
    $weburl = $record["weburl"];
    $webname = $record["webname"];
    if ($webname == "" || array_key_exists('p', $_REQUEST))
	$webname = $weburl;
    $webname = htmlspecialchars($webname);
    $forum = mysql_query("SELECT modified FROM calforum WHERE id=${id} ORDER BY modified DESC", $conn) or die(mysql_error());
    $forumimg = "images/forum.gif";
    $forumqty = mysql_num_rows($forum);
    $forumtitle = "$forumqty message".($forumqty == 1 ? "" : "s");
    if ($forumqty > 0)
    {
	$msg = mysql_fetch_array($forum);
	$msgmod = $msg["modified"];
	# Format the timestamp -- varies with SQL ver.
	if (strlen($msgmod) == 14) {
	    # older MySQL uses YYYYMMDDhhmmss format
	    $msgmod = substr($msgmod, 0, 4) . "-"
		    . substr($msgmod, 4, 2) . "-"
		    . substr($msgmod, 6, 2) . " "
		    . substr($msgmod, 8, 2) . ":"
		    . substr($msgmod, 10, 2) . ":"
		    . substr($msgmod, 12, 2);
	}
	$forumtitle = "$forumtitle, newest ".substr($msgmod, 0, 10);
	if (strcmp($msgmod, $yesterday) > 0)
	    $forumimg = "images/forumflash.gif";
    }

    # get the image info
    $image = "";
    if ($record["image"] && !isset($_REQUEST["i"])) {
	$t = pathinfo($record["image"]);
	$t = $t["extension"];
	$image = "eventimages/$id.$t";
	$imageheight = $record["imageheight"];
	$imagewidth = $record["imagewidth"];

	# Defend against obnoxiously wide banners or zero-height images.
	if ($imagewidth > 300) {
		$imageheight = $imageheight * 300 / $imagewidth;
		$imagewidth = 300;
	}
	if ($imageheight < 1)
		$imagehight = 1;
    }
    

    if ($eventtime == "CANCELED")
	$style = "text-decoration: line-through;";
    else
	$style = "";
    print "<dt style=\"$style\">";
    if ($image && $imageover <= 0 && $imageheight > RIGHTHEIGHT / 2) {
	if ($imageheight > RIGHTHEIGHT) {
	    $imagewidth = $imagewidth * RIGHTHEIGHT / $imageheight;
	    $imageheight = RIGHTHEIGHT;
	}
	print "\n<img src=\"$image\" height=$imageheight width=$imagewidth align=\"right\" alt=\"\">\n";
    }
    print "<a href=\"calforum.php?id=$id\" name=\"${dayofmonth}-${id}\" style=\"$style\">${title}</a>\n";
    print "<a href=\"#${dayofmonth}-{$id}\"><img border=0 src=\"images/chain.gif\" alt=\"Link\" title=\"Link to this event\"></a>\n";
    if (isset($_COOKIE[ADMINCOOKIE]) && $_COOKIE[ADMINCOOKIE] == 'bikefun')
	print "<a href=\"calform.php?edit=".obscure($id)."\"><img src=\"images/edit.gif\" alt=\"[edit]\" border=0></a>\n";
    if ($badge != "") print "<img align=left src=\"".IMAGES."/$badge\" alt=\"$badgealt\" title=\"$badgehint\">\n";
    if ($image && ($imageover > 0 || $imageheight <= RIGHTHEIGHT / 2)) {
	if ($imageheight > LEFTHEIGHT) {
	    $imagewidth = $imagewidth * LEFTHEIGHT / $imageheight;
	    $imageheight = LEFTHEIGHT;
	}
	print "</dt><dd><img src=\"$image\" height=$imageheight width=$imagewidth align=\"left\" alt=\"\">\n";
    } else {
	print "</dt><dd>";
    }
    print "<div style=\"$style\">";
    if (TRUE || $record["addressverified"] == "Y")
	#print '<a href="http://tripplanner.bycycle.org/?region=portlandor&q='.urlencode($record["address"]).'" target="_BLANK">'.$address.'</a>';
	print '<a href="http://maps.google.com/?bounds=45.389771,-122.829208|45.659647,-122.404175&q='.urlencode($record["address"]).'" target="_BLANK">'.$address.'</a>';
    else
	print $address;
    if (!isset($_REQUEST['p']) || $_REQUEST['p'] == '') {
	print " <a href=\"".trimeturl($record["eventdate"], $record["eventtime"], $record["address"])."\" target=\"_BLANK\" title=\"TriMet trip planner\"><img alt=\"Take Trimet\" src=\"images/trimetrose.gif\" border=0></a>";
    }
    if ($locdetails != "") print " ($locdetails)";
    print "</div>\n";
    print "$eventtime";
    if ($eventtime == "CANCELED" && $newsflash != "")
	print " <font color=magenta>$newsflash</font>";
    if ($eventtime != "CANCELED") {
	if ($eventduration != 0)
	    print " - ".endtime($eventtime,$eventduration);
	if ($timedetails != "") print ", $timedetails";
	if ($record["datestype"] == "C" || $record["datestype"] == "S")
	    print ", ${record[dates]}";
    }
    print "<div style=\"$style\">\n";
    print "<em>$descr</em>\n";
    if ($newsflash != "" && $eventtime != "CANCELED") {
	print "<font color=magenta>$newsflash</font>";
    }
    print '<br>';
    if (strstr($name, '@'))
	print mangleemail($name);
    else
	print $name;
    if ($email != "") print ", $email";
    if ($weburl != "") print ", <a href=\"$weburl\">$webname</a>";
    if ($contact != "") print ", ".mangleemail($contact);
    if ($phone != "") print ", $phone";
    print "</div></dd>\n";
	
	print '<div style="clear: both;"></div>';
    print '<div title="Add to Calendar" class="addthisevent"> Add to Calendar 
        <span class="start">'; 
		print $record["eventdate"] . " " . $record["eventtime"] . '</span>
        <span class="timezone">America/Los_Angeles</span>'; 
        print '<span class="title">';
		print $record["name"] . '</span> 
        <span class="description">';
		print $record["descr"] . '</span> 
        <span class="location">';
		print $address . '</span> 
        <span class="date_format">MM/DD/YYYY</span>';
    print '</div>';


    # if this event has no image, then the next event's
    # image can be left-aligned.
    if ($image == "" || $imageover > 0 || $imageheight <= RIGHTHEIGHT / 2)
	$imageover = 0;
    else
	$imageover = $imageheight - RIGHTHEIGHT / 2;
}

# Generate the HTML for all entries in a given day, in the full format
# used in the lower part of the page.
function fullentries($day, $exclude = FALSE)
{
    global $conn;
    global $imageover;

    # The day separator line is about 20 pixels high.  We can
    # reduce $imageover by that much.
    $imageover -= 20;

    # for each event on this day...
    $result = mysql_query("SELECT * FROM calevent, caldaily WHERE calevent.id=caldaily.id AND eventdate=\"${day}\" AND eventstatus<>\"E\" AND eventstatus<>\"S\" ORDER BY eventtime", $conn) or die(mysql_error());
    if (mysql_num_rows($result) > 0)
	print ("<dl>\n");
    while ($record = mysql_fetch_array($result)) {
	if (!$exclude || $record["review"] != "E")
	    fullentry($record);
    }
    if (mysql_num_rows($result) > 0)
	print ("</dl>\n");
}
#ex:set sw=4 embedlimit=60000:
?>

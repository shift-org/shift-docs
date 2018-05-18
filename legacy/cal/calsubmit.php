<?php
# This PHP script is executed when calform.php's [Submit] button is clicked.
# It adds a new event, or updates/deletes an existing event.
#
# This script accepts many parameters.  You can search for $_REQUEST to
# find all of them, but the most important are:
#
#    edit=	Obscured version of the event ID.  See the obscure() and
#		unobscure() functions defined in "include/common.php"
#
#    action=	One of "Add", "Update", or "Delete" (case-insensitive, and
#		can be abbreviated to the first three characters)

include('include/repeat.php');
include('include/repeatdebug.php');
include('include/common.php');
include('include/daily.php');



# This calls addslashes if a value contains any unslashed quotes
function maybeaddslashes($str)
{
    $quote = strpos($str, "'");
    if ($quote === FALSE)
	$quote = strpos($str, '"');
    if ($quote === FALSE || $quote === 0 || substr($str, $quote - 1, 1) == "\\")
	return $str;
    return addslashes($str);
}

# Copy an event record and a daily record, to make an exception.
function makeexception($id, $date)
{
    global $conn;

    # First read the non-exception records
    $event = mysql_query("SELECT * FROM calevent WHERE id=$id", $conn) or die('Looking up event, '.mysql_error());
    $daily = mysql_query("SELECT * FROM caldaily WHERE id=$id AND eventdate=\"$date\"", $conn) or die('Looking up daily, '.mysql_error());
    if (mysql_num_rows($event) != 1 || mysql_num_rows($daily) != 1)
	die('Trouble making the exception record.  Drat!');
    $event = mysql_fetch_array($event);
    $daily = mysql_fetch_array($daily);

    # Copy the event record, so it has a new $id.  Initially, the only
    # change is that the "dates" field will be the one exceptional date.
    $sql = 'INSERT INTO calevent (';
    $values = 'VALUES (';
    $sql .= 'name, ';            $values .= "\"${event[name]}\",";
    $sql .= 'email, ';           $values .= "\"${event[email]}\",";
    $sql .= 'hideemail, ';       $values .= "${event[hideemail]},";
    $sql .= 'emailforum, ';      $values .= "${event[emailforum]},";
    $sql .= 'printemail, ';      $values .= "${event[printemail]},";
    $sql .= 'phone, ';           $values .= "\"${event[phone]}\",";
    $sql .= 'hidephone, ';       $values .= "${event[hidephone]},";
    $sql .= 'printphone, ';      $values .= "${event[printphone]},";
    $sql .= 'weburl, ';          $values .= "\"${event[weburl]}\",";
    $sql .= 'webname, ';         $values .= '"'.maybeaddslashes($event['webname']).'",';
    $sql .= 'printweburl, ';     $values .= "${event[printweburl]},";
    $sql .= 'contact, ';         $values .= "\"${event[contact]}\",";
    $sql .= 'hidecontact, ';     $values .= "${event[hidecontact]},";
    $sql .= 'printcontact, ';    $values .= "${event[printcontact]},";
    $sql .= 'title, ';           $values .= '"'.maybeaddslashes($event['title']).'",';
    $sql .= 'tinytitle, ';       $values .= '"'.maybeaddslashes($event['tinytitle']).'",';
    $sql .= 'audience, ';        $values .= "\"${event[audience]}\",";
    $sql .= 'descr, ';           $values .= '"'.maybeaddslashes($event['descr']).'",';
    $sql .= 'printdescr, ';      $values .= '"'.maybeaddslashes($event['printdescr']).'",';
    $sql .= 'image, ';	     $values .= "\"${event[image]}\",";
    $sql .= 'imagewidth, ';      $values .= "${event[imagewidth]},";
    $sql .= 'imageheight, ';     $values .= "${event[imageheight]},";
    $sql .= 'dates, ';           $values .= '"'.date('l, F j', strtotime($date)).'",';
    $sql .= 'datestype,';	     $values .= "\"O\",";
    $sql .= 'eventtime, ';       $values .= "\"${event[eventtime]}\",";
    $sql .= 'eventduration, ';   $values .= "\"${event[eventduration]}\",";
    $sql .= 'timedetails, ';     $values .= "\"${event[timedetails]}\",";
    $sql .= 'locname, ';         $values .= '"'.maybeaddslashes($event['locname']).'",';
    $sql .= 'address, ';         $values .= "\"${event[address]}\",";
    $sql .= 'addressverified, '; $values .= "\"${event[addressverified]}\",";
    $sql .= 'locdetails, ';      $values .= '"'.maybeaddslashes($event['locdetails']).'",';
    $sql .= 'area, ';            $values .= "\"${event[area]}\",";
    $sql .= 'external) ';        $values .= "\"${event[external]}\")";
    $sql = $sql.$values; 
    mysql_query($sql, $conn) or die('Adding exceptional event, '.mysql_error());
    $exceptionid = mysql_insert_id($conn) or die('Retrieving the ID, '.mysql_error());

    # Copy the daily record, making it be the exception
    $sql = 'INSERT INTO caldaily (';
    $values = ' VALUES (';
    $sql .= 'id,';            $values .= "${exceptionid},";
    $sql .= 'newsflash,';           $values .= "\"${daily[newsflash]}\",";
    $sql .= 'eventdate,';       $values .= "\"${date}\",";
    $sql .= 'eventstatus,';        $values .= "\"A\",";
    $sql .= 'exceptionid)';        $values .= "0)";
    $sql = $sql.$values; 
    mysql_query($sql, $conn) or die('Adding exceptional date, '.mysql_error());

    # If it has an image, copy the image
    if ($event['image']) {
	$t = pathinfo($event['image']);
	$ext = $t['extension'];
	link("eventimages/$id.$ext", "eventimages/$exceptionid.$ext");
    }

    # Return the exceptionid
    return $exceptionid;
}

include(INCLUDES.'/header.html');
print "<h1>Submitted</h1>\n";

# fetch the form parameters
$action = strtolower(substr($_REQUEST['action'], 0, 3));
if ($action != 'del' && $action != 'add' && $action != 'upd')
	$action = $_REQUEST['action'];
$name = $_REQUEST['name'];
$email = $_REQUEST['email'];
$hideemail = ($_REQUEST['hideemail'] =='Y') ? 1 : 0;
$emailforum = ($_REQUEST['emailforum'] =='Y') ? 1 : 0;
$printemail = ($_REQUEST['printemail'] =='Y') ? 1 : 0;
$phone = $_REQUEST['phone'];
$hidephone = ($_REQUEST['hidephone'] =='Y') ? 1 : 0;
$printphone = ($_REQUEST['printphone'] =='Y') ? 1 : 0;
$weburl = $_REQUEST['weburl'];
$webname = $_REQUEST['webname'];
$printweburl = ($_REQUEST['printweburl'] =='Y') ? 1 : 0;
$contact = $_REQUEST['contact'];
$hidecontact = ($_REQUEST['hidecontact'] =='Y') ? 1 : 0;
$printcontact = ($_REQUEST['printcontact'] =='Y') ? 1 : 0;
$title = safeinput($_REQUEST['title']);
$tinytitle = safeinput($_REQUEST['tinytitle']);
$audience = $_REQUEST['audience'];
$descr = safeinput($_REQUEST['descr']);
$printdescr = safeinput($_REQUEST['printdescr']);
$newsflash = safeinput($_REQUEST['newsflash']);
$dates = $_REQUEST['dates'];
$eventtime = $_REQUEST['eventtime'];
$eventduration = $_REQUEST['eventduration'];
$timedetails = $_REQUEST['timedetails'];
$locname = safeinput($_REQUEST['locname']);
$address = safeinput($_REQUEST['address']);
$addressverified = $_REQUEST['addressverified'];
$locdetails = safeinput($_REQUEST['locdetails']);
$area = $_REQUEST['area'];
$id = unobscure($_REQUEST['edit']);
$comment = wordwrap(stripslashes($_REQUEST['comment']), 60);
$highlight = $_REQUEST['highlight'];
if ($highlight == '1')
    $highlight = 1;
else
    $highlight = 0;

# parse the $dates value, and convert it to a list of specific dates
$daylist = repeatdates($dates);

# retrieve the old image name (if any), and review status
$oldimage = '';
$record = '';
if ($id) {
    $result = mysql_query("SELECT * FROM calevent WHERE id=$id", $conn) or die('Retrieveing old image name, '.mysql_error());
    $record = mysql_fetch_array($result);
    $oldimage = $record['image'];
    $t = pathinfo("$oldimage");
    $oldext = $t['extension'];
    $oldreview = $t['review'];
}

# fetch the new image parameter
$imgchange = $_REQUEST['imgchange'];
if ($imgchange == 'delete') {
	$changeimage = true;
	$image = "";
	$imageheight = 0;
	$imagewidth = 0;
} else if ($imgchange == 'keep') {
	$changeimage = false;
} else {
	$changeimage = false;
	$image = $_FILES['image']['name'];
	$imagetmp = $_FILES['image']['tmp_name'];
	if (!is_uploaded_file($imagetmp))
		$image = "";
	if ($image != "") {
		list($imagewidth, $imageheight) = getimagesize($imagetmp);
		if ($imagewidth == 0 || $imageheight == 0) {
			$image = "";
			$imagewidth = 0;
			$imageheight = 0;
		} else {
			$changeimage = true;
			$t = pathinfo("$image");
			$imageext = $t['extension'];
		}
	} else {
	    $imagewidth = 0;
	    $imageheight = 0;
	}
}

# figure out the implied new value for the "review" flag
if ($_COOKIE[ADMINCOOKIE] == 'bikefun')
    $review = 'A'; # Calendar Crew changed it, must like it now
else if ($oldreview == 'S')
    $review = 'R'; # Organizer changed it after being asked to do so
else
    $review = 'I'; # Must inspect

# sanity checks
if ($action != 'add' && $action != 'upd' && $action != 'del' && $action != PPNAME && !preg_match('/\d\d\d\d-\d\d-\d\d/', $action) )
    die("missing params - action='$action'");
if ($name == "" || $email == "")
    die("missing params - name='$name' email='$email'");
if ($action != 'del' && ($dates == "" || $eventtime == ""))
    die("missing params - action='$action' dates='$dates' eventtime='$eventtime'");
if ($action != 'del' && !$daylist[1])
    die("invalid date string - dates='$dates'");

# If we're editing an existing event, then fetch its daily list and merge
# it into the $daylist.
if ($id) {
    # Fetch the old dates
    $olddates = dailystatus($id);

    # Merge the old and new lists.
    $daylist = mergedates($daylist, $olddates);
} else {
    # all dates will be added
    for ($i = 1; $daylist[$i]; $i++) {
	$daylist[$i]['changed'] = 'Y';
	$daylist[$i]['olddate'] = 'N';
    }
}

# For SQL we only store the first letter of the datestype
$sqldatestype = strtoupper(substr($daylist['datestype'],0,1));

# construct a SQL statement to insert/update/delete the record
$details = "";
$exceptions = "";
switch ($action)
{
  case 'add':
	$sql = 'INSERT INTO calevent (';
	$values = ' VALUES (';
	$sql .= 'name,';        $values .= "\"${name}\",";
	$sql .= 'email,';       $values .= "\"${email}\",";
	$sql .= 'hideemail,';   $values .= "${hideemail},";
	$sql .= 'emailforum,';  $values .= "${emailforum},";
	$sql .= 'printemail,';  $values .= "${printemail},";
	$sql .= 'phone,';       $values .= "\"${phone}\",";
	$sql .= 'hidephone,';   $values .= "${hidephone},";
	$sql .= 'printphone,';  $values .= "${printphone},";
	$sql .= 'weburl,';      $values .= "\"${weburl}\",";
	$sql .= 'webname,';     $values .= '"'.maybeaddslashes($webname).'",';
	$sql .= 'printweburl,'; $values .= "${printweburl},";
	$sql .= 'contact,';     $values .= "\"${contact}\",";
	$sql .= 'hidecontact,'; $values .= "${hidecontact},";
	$sql .= 'printcontact,';$values .= "${printcontact},";
	$sql .= 'title,';       $values .= '"'.maybeaddslashes($title).'",';
	$sql .= 'tinytitle,';   $values .= '"'.maybeaddslashes($tinytitle).'",';
	$sql .= 'audience,';    $values .= "\"${audience}\",";
	$sql .= 'descr,';       $values .= '"'.maybeaddslashes($descr).'",';
	$sql .= 'printdescr,';  $values .= '"'.maybeaddslashes($printdescr).'",';
	if (changeimage) {
		$sql .= 'image,'; $values .= "\"${image}\",";
		$sql .= 'imagewidth,'; $values .= "${imagewidth},";
		$sql .= 'imageheight,'; $values .= "${imageheight},";
	}
	$sql .= 'dates,';       $values .= "\"${dates}\",";
	$sql .= 'datestype,';   $values .= "\"$sqldatestype\",";
	$sql .= 'eventtime,';   $values .= "\"${eventtime}\",";
	$sql .= 'eventduration,';$values.= "\"${eventduration}\",";
	$sql .= 'timedetails,'; $values .= "\"${timedetails}\",";
	$sql .= 'locname,';     $values .= '"'.maybeaddslashes($locname).'",';
	$sql .= 'address,';     $values .= "\"${address}\",";
	$sql .= 'addressverified,'; $values .= "\"${addressverified}\",";
	$sql .= 'locdetails,';  $values .= '"'.maybeaddslashes($locdetails).'",';
	$sql .= 'area,';        $values .= "\"${area}\",";
	$sql .= 'review,';        $values .= "\"${review}\",";
	$sql .= 'highlight)';   $values .= "${highlight})";
	$sql = $sql.$values; 
	mysql_query($sql, $conn) or die('Adding event, '.mysql_error());
	$id = mysql_insert_id($conn);

	# Also add the caldaily records
	for ($i = 1; $daylist[$i]; $i++) {
	    $status = $_REQUEST['status'.$daylist[$i]['suffix']];
	    $newsflash = $_REQUEST['newsflash'.$daylist[$i]['suffix']];
	    $sqlstatus = statusname($status);
	    $sqldate = $daylist[$i]['sqldate'];
	    switch ($status) {
		case 'Added':
		case 'Skipped':
		    $sql = 'INSERT INTO caldaily (';
		    $values = ' VALUES (';
		    $sql .= 'id,';          $values .= "\"${id}\",";
		    $sql .= 'eventdate,';   $values .= "\"".$daylist[$i]['sqldate']."\",";
		    $sql .= 'eventstatus)';	$values .= "\"$sqlstatus\")";
		    $sql = $sql.$values; 
		    mysql_query($sql, $conn) or die('Adding date, '.mysql_error());
		    break;
		default:
		    $details .= " ! Bad status for $sqldate: \"$status\"\n";
	    }
	}

	$action = 'added';
	break;

  case 'upd':
	$sql = 'UPDATE calevent SET ';
	$sql = $sql."name = \"$name\", ";
	$sql = $sql."email = \"$email\", ";
	$sql = $sql."hideemail = $hideemail, ";
	$sql = $sql."emailforum = $emailforum, ";
	$sql = $sql."printemail = $printemail, ";
	$sql = $sql."phone = \"$phone\", ";
	$sql = $sql."hidephone = $hidephone, ";
	$sql = $sql."printphone = $printphone, ";
	$sql = $sql."weburl = \"$weburl\", ";
	$sql = $sql.'webname = "'.maybeaddslashes($webname).'", ';
	$sql = $sql."printweburl = $printweburl, ";
	$sql = $sql."contact = \"$contact\", ";
	$sql = $sql."hidecontact = $hidecontact, ";
	$sql = $sql."printcontact = $printcontact, ";
	$sql = $sql.'title = "'.maybeaddslashes($title).'", ';
	$sql = $sql.'tinytitle = "'.maybeaddslashes($tinytitle).'", ';
	$sql = $sql."audience = \"$audience\", ";
	$sql = $sql.'descr = "'.maybeaddslashes($descr).'", ';
	$sql = $sql.'printdescr = "'.maybeaddslashes($printdescr).'", ';
	if ($changeimage) {
	    $sql = $sql."image = \"$image\", ";
	    $sql = $sql."imageheight = $imageheight, ";
	    $sql = $sql."imagewidth = $imagewidth, ";
	}
	$sql = $sql."dates = \"$dates\", ";
	$sql = $sql."datestype = \"$sqldatestype\", ";
	$sql = $sql."eventtime = \"$eventtime\", ";
	$sql = $sql."eventduration = $eventduration, ";
	$sql = $sql."timedetails = \"$timedetails\", ";
	$sql = $sql.'locname = "'.maybeaddslashes($locname).'", ';
	$sql = $sql."address = \"$address\", ";
	$sql = $sql."addressverified = \"$addressverified\", ";
	$sql = $sql.'locdetails = "'.maybeaddslashes($locdetails).'", ';
	$sql = $sql."area = \"$area\", ";
	$sql = $sql."review = \"$review\"";
	if ($_REQUEST['highlight'] == '1' || $_REQUEST['highlight'] == '0')
	    $sql = $sql.", highlight = $highlight";
	$sql = $sql." WHERE id = $id";
	mysql_query($sql, $conn) or die('Updating event, '.mysql_error());
	$action = 'updated';

	# build a detailed list of changes
	if (stripslashes($title) != $record['title'])
	    $details .= " * Title changed to \"$title\"\n";
	if (stripslashes($tinytitle) != $record['tinytitle'])
	    $details .= " * Tiny-Title changed to \"$tinytitle\"\n";
	if ($audience != $record['audience']) {
	    if ($audience == 'F')
		$details .= " * Audience changed to \"Family Friendly\"\n";
	    else if ($audience == 'A')
		$details .= " * Audience changed to \"Adult Only (21+)\"\n";
	    else
		$details .= " * Audience changed to \"General\"\n";
	}
	if (stripslashes($descr) != $record['descr'])
	    $details .= " * Description changed\n";
	if (stripslashes($printdescr) != $record['printdescr'])
	    $details .= " * Print description changed\n";
	if (stripslashes($newsflash) != $record['newsflash']) {
	    if ($newsflash == "")
		$details .= " * Newsflash removed\n";
	    else if ($record['newsflash'] == "")
		$details .= " * Newsflash added\n";
	    else
		$details .= " * Newsflash changed\n";
	}
	if ($changeimage) {
	    if ($image == "")
		$details .= " * Image removed\n";
	    else if ($record['image'] == "")
		$details .= " * Image added: \"$image\"\n";
	    else
		$details .= " * Image changed to \"$image\"\n";
	}
	if ($dates != $record['dates'])
	    $details .= " * Dates changed to $dates\n";
	if ($eventtime != $record['eventtime'])
	    $details .= ' * Time changed to '.hmmpm($eventtime)."\n";
	if ($eventduration != $record['eventduration'])
	    $details .= " * Duration changed to $eventduration minutes.\n";
	if (stripslashes($timedetails) != $record['timedetails'])
	    $details .= " * Time-Details changed to \"$timedetails\"\n";
	if (stripslashes($locname) != $record['locname'])
	    $details .= " * Venue name changed to \"$locname\"\n";
	if (stripslashes($address) != $record['address']) {
	    $details .= " * Address changed to \"$address\"\n";
	    if ($record['addressverified'] != 'Y' && $addressverified == 'Y')
		$details .= "   (This was done to make the address be mappable by online maps)\n";
	}
	if (stripslashes($locdetails) != $record['locdetails'])
	    $details .= " * Location-Details changed to \"$locdetails\"\n";
	if ($area != $record['area']) {
	    if ($area == 'P')
		$details .= " * Area changed to \"Portland\"\n";
	    else
		$details .= " * Area changed to \"Vancouver\"\n";
	}
	if (stripslashes($name) != $record['name'])
	    $details .= " * Organizer-Name changed to \"$name\"\n";
	if (stripslashes($email) != $record['email'])
	    $details .= " * Email changed to \"$email\"\n";
	if ($hideemail != $record['hideemail']) {
	    if ($hideemail)
		$details .= " * Hide-Email flag turned on\n";
	    else
		$details .= " * Hide-Email flag turned off\n";
	}
	if ($emailforum != $record['emailforum']) {
	    if ($emailforum)
		$details .= " * Email Forum Messages flag turned on\n";
	    else
		$details .= " * Email Forum Messages flag turned off\n";
	}
	if ($phone != $record['phone'])
	    $details .= " * Phone changed to \"$phone\"\n";
	if ($hidephone != $record['hidephone']) {
	    if ($hidephone)
		$details .= " * Hide-Phone flag turned on\n";
	    else
		$details .= " * Hide-Phone flag turned off\n";
	}
	if (stripslashes($weburl) != $record['weburl'])
	    $details .= " * Web-Site-URL changed to \"$weburl\"\n";
	if (stripslashes($webname) != $record['webname'])
	    $details .= " * Web-Site-Name changed to \"$webname\"\n";
	if ($contact != $record['contact'])
	    $details .= " * Contact changed to \"$contact\"\n";
	if ($hidecontact != $record['contact']) {
	    if ($hidecontact)
		$details .= " * Hide-Contact flag turned on\n";
	    else
		$details .= " * Hide-Contact flag turned off\n";
	}
	if ($highlight != $record['highlight']
	    && ($_REQUEST['highlight'] == '1' || $_REQUEST['highlight'] == '2')) {
	    if ($highlight)
		$details .= " * Highlighted by the calendar crew\n";
	    else
		$details .= " * Highlight was removed\n";
	}

	# Also add/update the caldaily records
	for ($i = 1; $daylist[$i]; $i++) {
	    $status = $_REQUEST['status'.$daylist[$i]['suffix']];
	    $newsflash = $_REQUEST['newsflash'.$daylist[$i]['suffix']];
	    $sqlstatus = statusname($status);
	    $sqldate = $daylist[$i]['sqldate'];
	    $changed = ($status == $daylist[$i]['status'] && $status != 'Added') ? 'N' : 'Y';
	    switch ($status) {
		case 'Added':
		case 'Skipped':
		case 'Canceled':
		case 'As Scheduled':
		    if ($daylist[$i]['olddate'] == 'Y') {
			$sql = 'UPDATE caldaily SET ';
			$sql .= "eventstatus = \"$sqlstatus\", ";
			$sql .= "newsflash = \"$newsflash\" ";
			$sql .= "WHERE id=$id AND eventdate = \"$sqldate\"";
			$act = 'Updating';
		    } else {
			$sql = 'INSERT INTO caldaily (';
			$values = ' VALUES (';
			$sql .= 'id,';         $values .= "\"${id}\",";
			$sql .= 'eventdate,';  $values .= "\"$sqldate\",";
			$sql .= 'eventstatus,';$values .= "\"$sqlstatus\",";
			$sql .= 'newsflash)';  $values .= "\"$newsflash\")";
			$sql = $sql.$values; 
			$act = 'Adding';
		    }
		    mysql_query($sql, $conn) or die("$act a \"$status\" date, ".mysql_error());
		    break;

		case 'Deleted':
		    $sql = "DELETE FROM caldaily WHERE id=$id AND eventdate = \"$sqldate\"";
		    mysql_query($sql, $conn); # or die(mysql_error());
		    break;

		case 'Exception':
		    # does it already have an exception id?
		    $exceptionid = 0;
		    $result = mysql_query("SELECT exceptionid FROM caldaily WHERE id=$id AND eventdate=\"$sqldate\"", $conn);
		    if ($result && mysql_num_rows($result) > 0) {
			$exceptiondaily = mysql_fetch_array($result);
			$exceptionid = $exceptiondaily["exceptionid"];
			if (!$exceptionid)
			    $exceptionid = 0;
		    }
		    if (!$exceptionid) {
			# We need to create an $exceptionid by copying the
			# calevent record and caldaily record.  The calevent
			# record will have its "dates" set to this specific
			# day but will otherwise start out identical.
			$exceptionid = makeexception($id, $sqldate);
		    }
		    $sql = 'UPDATE caldaily SET ';
		    $sql .= "eventstatus = \"$sqlstatus\", ";
		    $sql .= "newsflash = \"$newsflash\", ";
		    $sql .= "exceptionid = $exceptionid ";
		    $sql .= "WHERE id=$id AND eventdate = \"$sqldate\"";
		    mysql_query($sql, $conn) or die('Updating an "Exception" date, '.mysql_error());
		    $exceptions .= '<li><a href="calform.php?edit='.obscure($exceptionid).'">Edit the '.date('l F j', $daylist[$i]['timestamp']).' exception</a>';
		    if ($changed == 'Y')
			$exceptions .= "&lt;-- NEW";
		    break;

		default:
		    $details .= " ! Bad status for $sqldate: \"$status\"\n";
	    }
	    if ($changed == 'Y' && $status != 'Added')
		$details .= ' * '.date('D M j', $daylist[$i]['timestamp'])." status changed to $status\n";
	    if ($daylist[$i]['newsflash'] != $newsflash)
		$details .= ' * '.date('D M j', $daylist[$i]['timestamp'])." newsflash changed\n";
	}
	break;

  case 'del':
	$sql = "DELETE FROM calevent WHERE id=$id";
	mysql_query($sql, $conn) or die(mysql_error());
	$sql = "DELETE FROM caldaily WHERE id=$id OR exceptionid=$id";
	mysql_query($sql, $conn) or die(mysql_error());
	$sql = "DELETE FROM calforum WHERE id=$id";
	mysql_query($sql, $conn) or die(mysql_error());
	if ($oldimage != "") {
		unlink("eventimages/$id.$oldext");
	}
	$changeimage = false;
	$id = "";
	$action = 'deleted';
	break;
}

if ($changeimage) {
    if ($oldimage != "") {
	unlink("eventimages/$id.$oldext");
    }
    if ($image != "" && is_uploaded_file($imagetmp)) {
	move_uploaded_file($imagetmp, "eventimages/$id.$imageext");
	chmod("eventimages/$id.$imageext", 0644);
    }
}
	
if ($_COOKIE[ADMINCOOKIE] == 'bikefun')
    print "<p>You have <strong>successfully $action</strong> the ".htmlspecialchars(stripslashes($tinytitle))." event.\n";
else
    print "<p>Your event has been <strong>successfully $action</strong>.\n";
if ($action != 'deleted') {
    if ($details != "") {
	$htmldetails = htmlspecialchars($details);
	$htmldetails = str_replace(' * ', '<li>', $htmldetails);
	$htmldetails = str_replace('   ', '<br>', $htmldetails);
	print "<ul>$htmldetails</ul>";
    }
    $ob = obscure($id);
    print "If you wish to edit this event, go to here:\n";
    print "<a href=\"calform.php?edit=$ob\">Shift&nbsp;Cal&nbsp;".htmlspecialchars(stripslashes($tinytitle))."</a>.\n";
    print "You should probably bookmark that link\n";
    print "(add it to your favorites) by right-clicking on it.\n";
    if ($_REQUEST['minorchange'] != 'on') {
	print "I'm sending you email with that link in it,\n";
	print "but if your email address is wrong then that won't\n";
	print "help much, so bookmark that link!\n";
    } else {
	print "I am *NOT* sending you email with that link.\n";
    }

    if ($exceptions != "") {
	print "<p>In addition, you have the following exceptions.\n";
	print "You can edit these now by clicking on them.  You\n";
	print "can also edit them later by going to your generic\n";
	print "event via the above link, scrolling down to the\n";
	print "\"Date(s)\" list, and clicking on the \"Exception\"\n";
	print "link there.\n";
	print "<ul>\n";
	print $exceptions;
	print "</ul>\n";
    }
}

# send email
if ($_REQUEST['minorchange'] != 'on') {
    if ($_COOKIE[ADMINCOOKIE] == 'bikefun')
	$msgbody =  "Your event has been $action by the Calendar Crew.\n";
    else
	$msgbody =  "Your event has been successfully $action.\n";
    if ($action != 'deleted') {
	$msgbody .= "It is scheduled for ${_REQUEST[dates]} at ".hmmpm($_REQUEST['eventtime'])."\n";
	if ($exceptions != "") {
	    $exceptbody = 'with the following exceptions:';
	    $last = "";
	    for ($i = 1; $daylist[$i]; $i++) {
		if ($_REQUEST['status'.$daylist[$i]['suffix']] == 'Exception') {
		    if ($last != "")
			$exceptbody .= "$last, ";
		    $last =  date('l F j', $daylist[$i]['timestamp']);
		}
	    }
	    if ($exceptbody == "")
		$exceptbody = $last;
	    else if ($last != "")
		$exceptbody .= "and $last\n";
	    $msgbody .= wordwrap($exceptbody);
	}
	if ($details != "")
	    $msgbody .= "\n$details";
    }
    if ($comment)
	$msgbody .= "\n$comment\n";
    if ($action != 'deleted') {
	# Construct a URL.  We didn't have to do that before because
	# the browser knew the URL of this confirmation page and could
	# convert a relative URL to an absolute one itself.  The mail
	# client isn't that clever.
	$url = 'http://';
	if ($_SERVER[HTTP_HOST])
	    $url .= $_SERVER[HTTP_HOST];
	else
	    $url .= $_SERVER[SERVER_NAME];
	$url .= dirname($_SERVER[REQUEST_URI]) . "/calform.php?edit=$ob";

	$msgbody .= "\n";
	$msgbody .= "If you wish to edit or cancel this event, go to this address:\n";
	$msgbody .= "\n";
	$msgbody .= "     $url\n";
	$msgbody .= "\n";
	$msgbody .= "If you have questions, contact the Calendar Crew\n";
	$msgbody .= 'at '.SHIFTEMAIL."\n";
    }
    $to = stripslashes($_REQUEST['email']);
    $subject = '[Shift Cal] '.stripslashes($_REQUEST['title']);
    $headers = 'From: '.SHIFTEMAIL."\r\n"
	     . 'CC: '.SHIFTEMAIL."\r\n"
	     . "List-Help: <$url>";
    mail($to, $subject, $msgbody, $headers);
}

# Update the list of known venues
if ($locname != "" && ($addressverified == 'Y' || $area == 'V')) {
    # First try to update an unlocked version of the record.  If that fails
    # then try to add it.  Duplicates are automatically rejected, so that
    # can fail if we have a locked version on file already; this is not
    # an error so just ignore it if that insertion fails!
    $canon = canonize($locname);
    if (!mysql_query("INSERT INTO caladdress (canon, locname, address, area, locked) VALUES (\"$canon\", \"$locname\", \"$address\", \"$area\", 0)", $conn)) {
	mysql_query("UPDATE caladdress SET locname=\"$locname\", address=\"$address\", area=\"$area\" WHERE canon=\"$canon\" AND locked=0", $conn);
    }
}
?>
<hr>
<center>
<button onclick="window.location.replace('calform.php');">Add Another Event</button>
<?php
    print "<button onclick=\"window.location.replace('".viewurl($daylist[1]['sqldate'], $id)."');\">View Calendar</button>\n";
    if ($_COOKIE[ADMINCOOKIE] == 'bikefun') {
	print "<button onclick=\"window.location.replace('admreview.php".($_REQUEST['reviewdates'] ? '?dates='.$_REQUEST['reviewdates'] : "")."#a_$id');\">Edit Print Descriptions</button>\n";
	print "<button onclick=\"window.location.replace('admin.php');\">Administration Menu</button>\n";
    }
?>
</center>
<?php
	include(INCLUDES.'/footer.html');
	# ex:set sw=4 embedlimit=99999:
?>

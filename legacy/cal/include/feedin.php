<?php
# This file defines a feedin($source, $newevents) function which takes a
# source ID and an array of events, and then adds/deletes/updates the
# calendar's mySQL tables to match.
#
# This file is specifically written to help import events from Portland Wheelmen
# Touring Club's calendar, via the pwtc.php script.  However, while pwtc.php
# is extremely PWTC-specific, it is hoped that the code here will work for
# any future calendars that we want to import.

include_once('include/common.php');

# Search $calevents for a given $external value, and return its index.
# If no such record exists, then return -1.
function findevent($calevents, $external)
{
    foreach ($calevents as $i => $e) {
	if ($e['external'] == $external)
	    return $i;
    }
    return -1;
}

# Given an event id and the source name of an image, return the local pathname
# of the image in the "eventimages" directory.
function imagename($id, $image)
{
    $t = pathinfo($image);
    $ext = $t['extension'];
    return "eventimages/$id.$ext";
}

# Generate a tinytitle from a normal title
function mktinytitle($title)
{
    $t = preg_replace('/^An? /', '', $title);
    $t = preg_replace('/ (Ride|Loop)/', '', $t);
    if (strlen($t) > 25)
	$t = preg_replace('/ - .*/', '', $t);
    if (strlen($t) > 25)
	$t = preg_replace('/:.*/', '', $t);
    if (strlen($t) > 25)
	$t = preg_replace('/\s*\bThe\s+/', ' ', $t);
    if (strlen($t) > 25)
	$t = preg_replace('/\s*([[:punct:]])\s+/', '$1', $t);
    if (strlen($t) > 25)
	$t = preg_replace('/\s*\bOf\s+/', ' ', $t);
    return $t;
}

# Compare $newevents to previously downloaded events from a given source,
# and update the local SQL files accordingly.  $newevents is an array of
# calevent records.  Each calevent record is an associative array, similar
# to what mysql_fetch_assoc() returns.  Each also has a $newevents['caldaily']
# field, which is an array of caldaily records.
#
# Most fields are optional.  The 'name', 'title', 'audience', 'descr',
# 'eventtime', 'address', 'area', 'source', and 'external' fields are
# required.  Some omitted fields will be derived from supplied fields,
# e.g. 'tinytitle' from 'title'.  Others may have defaults or be left
# unset.
function feedin($source, $newevents)
{
    global $conn;

    # These lists of field names are handy...
    $strfields = array('name', 'email', 'phone', 'weburl', 'webname',
			'contact', 'title', 'tinytitle', 'audience',
			'descr', 'printdescr', 'dates', 'datestype',
			'eventtime', 'timedetails', 'locname', 'address',
			'addressverified', 'locdatails', 'area',
			'source', 'external');
    $numfields = array('hideemail', 'emailforum', 'printemail',
			'hidephone', 'printphone', 'printweburl',
			'hidecontact', 'printcontact', 'eventduration');

    # Open a connection to MySQL, if we don't have one already
    if (!$conn) {
	
	
    }

    # Start by adding used=false to each event and its daily records
    foreach ($newevents as $i=>$e) {
	$newevents[$i]['used'] = FALSE;
	foreach ($newevents[$i]['caldaily'] as $j=>$d)
	    $newevents[$i]['caldaily'][$j]['used'] = FALSE;
    }

    # For each event on file from this source...
    $events = mysql_query("SELECT * FROM calevent WHERE source=\"$source\"", $conn) or die('Reading existing events, '.mysql_error());
    while (($oldev = mysql_fetch_assoc($events)) !== FALSE) {
	$id = $oldev['id'];

	# Look for it in $newevents
	$i = findevent($newevents, $oldev['external']);

	# if not found, then delete the event from SQL
	if ($i < 0) {
	    $sql = "DELETE FROM caldaily WHERE id=$id";
	    print("\t$sql\n");
	    mysql_query($sql, $conn) or die('Deleting from caldaily, '.mysql_error());
	    $sql = "DELETE FROM calevent WHERE id=$id";
	    print("\t$sql\n");
	    print("\t(That was the ".$oldev['title']." event)\n");
	    mysql_query($sql, $conn) or die('Deleting from calevent, '.mysql_error());
	    continue;
	}

	# else we need to update the record.
	$newev = $newevents[$i];
	$sql = 'UPDATE calevent SET ';
	$anychange = FALSE;
	if (isset($newev['image']) && $oldev['image'] != $newev['image']) {
	    if ($oldev['image'] != '')
		remove(imagename($id, $oldev['image']));
	    if ($newev['image'] != '') {
		list($w,$h) = getimagesize($newev['image']);
		$sql .= "imageheight=$h,imagewidth=$w,";
		link($newev['image'], imagename($id, $newev['image']));
	    }
	    $sql .= 'image="'.$newev['image'].'",';
	    $anychange = TRUE;
	}
	foreach ($strfields as $f) {
	    if (isset($newev[$f]) && $newev[$f] != $oldev[$f]) {
		$sql .= "$f=\"".$newev[$f]."\", ";
		$anychange = TRUE;
	    }
	}
	foreach ($numfields as $f) {
	    if (isset($newev[$f]) && $newev[$f] != $oldev[$f]) {
		$sql .= "$f=\"".$newev[$f]."\", ";
		$anychange = TRUE;
	    }
	}
	$sql .= 'review="I" ';
	$sql .= "WHERE id=$id";
	if ($anychange) {
	    print("\t$sql\n");
	    mysql_query($sql, $conn) or die('Updating calevent, '.mysql_error());
	}
	$newevents[$i]['used'] = TRUE;

	# Also need to update the caldaily records
	$dailys = mysql_query("SELECT * FROM caldaily WHERE id=$id", $conn);
	while (($dold = mysql_fetch_assoc($dailys)) != FALSE) {
	    # Look for this date in the new caldailys
	    $found = FALSE;
	    foreach ($newev['caldaily'] as $i => $dnew) {
		if ($dold['eventdate'] == $dnew['eventdate']) {
		    # Assume it is kept without any changes
		    $newev['caldaily'][$i]['used'] = TRUE;
		    $found = TRUE;
		    break;
		}
	    }
    
	    # If not in new caldailys then delete from the SQL table
	    if (!$found) {
		$sql = "DELETE FROM caldaily WHERE id=$id AND date=\"".$dold['eventdate'].'"';
		print("\t$sql\n");
		print("\t(new date is \"".$newev['caldaily'][0]['eventdate'].'"'.(($newev['caldaily'][0]['eventdate']==$dold['eventdate'])?'==':'!=').'"'.$dold['eventdate']."\")\n");
		mysql_query($sql, $conn);
	    }
	}
	# Any new caldaily records not found in SQL table need to be added
	foreach ($newev['caldaily'] as $dnew) {
	    if (!$dnew['used']) {
		$sql = 'INSERT INTO caldaily (id,eventdate,eventstatus) ';
		$sql .= "VALUES ($id, \"".$dnew['eventdate'].'","A")';
		print("\t$sql\n");
		mysql_query($sql, $conn);
	    }
	}
    }

    # Any $newevents records that still contain used=FALSE need to be added.
    foreach ($newevents as $newev) {
	if ($newev['used'])
	    continue;

	# If no tinytitle then generate one from title
	if (!isset($newev['tinytitle']))
	    $newev['tinytitle'] = mktinytitle($newev['title']);

	# Insert the details into calevent
	$sql = 'INSERT INTO calevent (';
	$values = ' VALUES (';
	foreach ($strfields as $f) {
	    if (array_key_exists($f, $newev)) {
		$sql .= "$f,";
		$values .= '"'.$newev[$f].'",';
	    }
	}
	foreach ($numfields as $f) {
	    if (array_key_exists($f, $newev)) {
		$sql .= "$f,";
		$values .= $newev[$f].',';
	    }
	}
	if (isset($newev['image']) && $newev['image'] != '') {
	    list($w, $h) = getimagesize($newev['image']);
	    $sql .= 'image,imageheight,imagewidth,';
	    $values .= '"'.$newev['image']."\",$h,$w,";
	}
	$sql .= 'review)';
	$values .= '"I")';
	$sql .= $values;
	print("\t$sql\n");
	mysql_query($sql, $conn) or die('Inserting into calevent, '.mysql_error());
	$id = mysql_insert_id($conn);
	if (isset($newev['image']) && $newev['image'] != '') {
	    link($newev['image'], imagename($id, $newev['image']));
	}

	# Also need to insert the caldaily records
	foreach ($newev['caldaily'] as $newd) {
	    $sql = "INSERT INTO caldaily (id, eventdate, eventstatus) VALUES ($id, \"".$newd['eventdate'].'", "A")';
	    print("\t$sql\n");
	    mysql_query($sql, $conn) or die('Inserting into caldaily, '.mysql_error());
	}
    }
}

# ex:set shiftwidth=4 smarttab makeprg="php -l $2"
?>

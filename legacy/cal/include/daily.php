<?php
# This file contains a few functions for scanning caldaily records.  It is
# used by calsubmit.php and vfydates.php to check the status of an event's
# days.


# Convert a status code from a letter to a full word, or vice-versa.
function statusname($status)
{
	switch ($status) {
	  case "Added":		return "A";
	  case "As Scheduled":	return "A";
	  case "A":		return "As Scheduled";
	  case "Skipped":	return "S";
	  case "S":		return "Skipped";
	  case "Canceled":	return "C";
	  case "C":		return "Canceled";
	  case "Deleted":	return "D";
	  case "D":		return "Deleted";
	  case "Exception":	return "E";
	  case "E":		return "Exception";
	}
}

# Return an array of daily status records for a given event.  It is assumed
# that a connection to the database is already established, and its connection
# resource is stored in $conn
function dailystatus($id)
{
    global $conn;

    # start with an empty list
    $days = array();

    # figure out what "today" is
    $date = time();
    $tm = getdate($date);
    $date += (12 - $tm["hours"]) * 3600; # Roughly noon today
    $sqltoday = date("Y-m-d", $date);

    # fetch the caldaily records
    $result = mysql_query("SELECT * FROM caldaily WHERE id=$id AND eventdate>=\"$sqltoday\" ORDER BY eventdate", $conn);
    if (!$result)
	return $days;

    # build a $days element for each record
    for ($i = 1; $i <= mysql_num_rows($result); $i++)
    {
	# get the record
	$record = mysql_fetch_array($result);

	# append it to $days, in a format that resembles the format
	# of the repeatdates() function in repeat.php.
	$days[$i]["timestamp"] = strtotime($record["eventdate"]) + 3601;
	$days[$i]["sqldate"] = $record["eventdate"];
	$days[$i]["suffix"] = date("Mj", $days[$i]["timestamp"]);
	$days[$i]["newsflash"] = $record["newsflash"];
	$days[$i]["status"] = statusname($record["eventstatus"]);
	$days[$i]["exceptionid"] = $record["exceptionid"];
	$days[$i]["olddate"] = "Y";
    }

    # return the list
    return $days;
}


# This function merges two date lists.  Both lists are assumed to be sorted
# in ascending order by sqldate.  This also adds a "changed" flag to each
# record.
function mergedates($newdates, $olddates)
{
    # reset the $mergeddates list and the counters
    $mergeddates = array();
    $n = $o = $m = 1;

    # as long as we have records remaining in both input lists...
    while ($newdates[$n] && $olddates[$o]) {
	if ($newdates[$n]["sqldate"] == $olddates[$o]["sqldate"]) {
	    # keep the old record, including its old status
	    $mergeddates[$m] = $olddates[$o];
	    $mergeddates[$m]["changed"] = "N";
	    $mergeddates[$m]["newdate"] = "Y";
	    $n++;
	    $o++;
	    $m++;
	} else if ($newdates[$n]["sqldate"] < $olddates[$o]["sqldate"]) {
	    # keep the new record
	    $mergeddates[$m] = $newdates[$n];
	    $mergeddates[$m]["changed"] = "Y";
	    $mergeddates[$m]["olddate"] = "N";
	    $n++;
	    $m++;
	} else {
	    # keep the old record except that if its status is "As Scheduled"
	    # then it should be changed to either "Canceled" or "Deleted"
	    # depending on how far in the future it is.
	    $mergeddates[$m] = $olddates[$o];
	    if ($olddates[$o]["status"] == "As Scheduled") {
		if ($olddates[$o]["timestamp"] - time() > 60 * 86400)
		    $mergeddates[$m]["status"] = "Deleted";
		else
		    $mergeddates[$m]["status"] = "Canceled";
	    }
	    $mergeddates[$m]["changed"] = "Y";
	    $mergeddates[$m]["newdate"] = "N";
	    $o++;
	    $m++;
	}
    }

    # at this point, at least one list has been exhausted but the other one
    # may still contain useful records.  IT IS IMPOSSIBLE FOR BOTH LISTS TO
    # CONTAIN MORE RECORDS since we would still be in the above loop if that
    # was the case.

    # Any remaining records in $newdates are added
    while ($newdates[$n]) {
	$mergeddates[$m] = $newdates[$n];
	$mergeddates[$m]["status"] = "Added";
	$mergeddates[$m]["changed"] = "Y";
	$mergeddates[$m]["olddate"] = "N";
	$n++;
	$m++;
    }

    # Any remaining records in $olddates are canceled or deleted
    while ($olddates[$o]) {
	$mergeddates[$m] = $olddates[$o];
	if ($olddates[$o]["status"] == "As Scheduled") {
	    if ($olddates[$o]["timestamp"] - time() > 60 * 86400)
		$mergeddates[$m]["status"] = "Deleted";
	    else
		$mergeddates[$m]["status"] = "Canceled";
	}
	$mergeddates[$m]["changed"] = "Y";
	$mergeddates[$m]["newdate"] = "N";
	$o++;
	$m++;
    }

    # Scan the list for any "Canceled" records adjacent to an "Added" record,
    # and if its newflash is empty then change it to "Moved to ...".
    for ($m = 1; $mergeddates[$m]; $m++)
    {
	if ($mergeddates[$m]["status"] == "Canceled" && $mergeddates[$m]["newsflash"] == "") {
	    if ($mergeddates[$m + 1]["status"] == "Added")
		$mergeddates[$m]["newsflash"] = "Moved to ".date("F j", $mergeddates[$m + 1]["timestamp"]);
	    else if ($mergeddates[$m - 1]["status"] == "Added")
		$mergeddates[$m]["newsflash"] = "Moved to ".date("F j", $mergeddates[$m - 1]["timestamp"]);
	}
    }

    # Carry forward the datestype and canonical fields
    $mergeddates["canonical"] = $newdates["canonical"];
    $mergeddates["datestype"] = $newdates["datestype"];

    # Return the merged list
    return $mergeddates;
}

#vi:se sw=4 embedlimit=99999:
?>

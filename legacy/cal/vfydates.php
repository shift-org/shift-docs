<?php
# This is an AJAX request.  It is passed a "dates" string, which it decodes.
# It can also be passed the id of an existing event, in which case it'll merge
# any information about currently booked dates with the new "dates" list.
# It returns an XML document describing all affected dates.  Parameters are:
#
# dates=	The "dates" string to parse.
#
# id=		Optional.  The id of an existing event, whose current days
#		will be merged into the "dates" list.
#
# reload=	Optional.  If "true" then any dates that match dates= but
#		aren't already booked for id= will be marked as "Deleted"
#		instead of "Added".  calform.php will pass reload=true when
#		you start editing an existing event, but not when change the
#		"dates" input field.

include("include/repeat.php");
include("include/common.php");
include("include/daily.php");

# This sends an XML response
header("Content-type: text/xml");
print "<"."?xml version=\"1.0\" encoding=\"iso-8859-1\" ?".">\n";

# Open a connection to the SQL server



# Parse the "dates" parameter to generate the list of new dates
$newdates = repeatdates($_REQUEST["dates"]);
$canonical = $newdates["canonical"];
$datestype = $newdates["datestype"];

if (!$newdates[1]) {
    # No dates?  That means we parsed it correctly but there were no
    # dates that satisfied the criteria.
    print "<vfydates>\n";
    print "  <error>No matching dates</error>\n";
    print "</vfydates>\n";
} else  if ($newdates[365]) {
    # Every day matches?  That means we failed to parse anything in
    # the date.
    print "<vfydates>\n";
    print "  <error>Date not understood</error>\n";
    print "</vfydates>\n";
} else {
    # If we're editing an existing event, then fetch its daily list and merge
    # it into the $newdates.
    if ($_REQUEST["id"]) {
	# Fetch the old dates
	$olddates = dailystatus($_REQUEST["id"]);

	# Merge the old and new lists.
	$newdates = mergedates($newdates, $olddates);
    } else {
	# all dates will be added.  Just merge in some new fields.
	for ($i = 1; $newdates[$i]; $i++) {
	    $newdates[$i]["changed"] = "Y";
	    $newdates[$i]["olddate"] = "N";
	}
    }

    # If this is a reload, not a change to the "dates" input, then any
    # missing dates must have been deleted instead of added.  HOWEVER since
    # it would be nice if one could extend a repeating event by reloading
    # it and saving it, without changing a bunch of dates from "Deleted" to
    # "Added", so if the list ends with a bunch of "Added" dates then leave
    # them that way.
    if ($_REQUEST["reload"]) {
        for ($i = 1; $newdates[$i]; $i++) {
	}
	for ($i--; $i >= 1 && $newdates[$i]["status"] == "Added"; $i--) {
	}
	for (; $i >= 1; $i--) {
	    if ($newdates[$i]["status"] == "Added") {
		$newdates[$i]["status"] = "Deleted";
		$newdates[$i]["changed"] = "N";
		$newdates[$i]["olddate"] = "Y";
	    }
	}
    }

    print "<vfydates>\n";

    # If an id was passed, include it in the response
    if ($_REQUEST["id"]) {
	print "  <id>${_REQUEST[id]}</id>\n";
    }

    # Output a canonical version of the date
    print "  <canonical>$canonical</canonical>\n";

    # Classify the date type
    print "  <datestype>$datestype</datestype>\n";

    # Output the list of dates
    print "  <datelist>\n";
    for ($i = 1; $newdates[$i]; $i++) {
	print "    <date>\n";
	print "      <timestamp>".$newdates[$i]["timestamp"]."</timestamp>\n";
	print "      <hrdate>".date("D M j", $newdates[$i]["timestamp"])."</hrdate>\n";
	print "      <suffix>".$newdates[$i]["suffix"]."</suffix>\n";
	print "      <status>".$newdates[$i]["status"]."</status>\n";
	print "      <exception>".obscure($newdates[$i]["exceptionid"])."</exception>\n";
	print "      <newsflash>".htmlspecialchars($newdates[$i]["newsflash"])."</newsflash>\n";
	print "      <change>".$newdates[$i]["changed"]."</change>\n";
	print "      <newdate>".$newdates[$i]["newdate"]."</newdate>\n";
	print "      <olddate>".$newdates[$i]["olddate"]."</olddate>\n";
	print "    </date>\n";
    }
    print "  </datelist>\n";
    print "</vfydates>\n";
}
#ex:set shiftwidth=4:
?>

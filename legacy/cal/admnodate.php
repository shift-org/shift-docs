<?php
# This page is used by administrators to edit the list of known venues.
# The response is always an HTML table listing the known venues, with each
# field being editable.  When you change anything, the page is reloaded with
# parameters to indicate what the change was; this page performs the changes
# before sending back the modified list.  Parameters include:

    include("include/common.php");
    
    

    $loggedin = 0;
    if ($_POST["user"] == ADMINUSER && $_POST["pass"] == ADMINPASS) {
	setcookie(ADMINCOOKIE, "bikefun", time()+3600, "/");
	$loggedin = 1;
    } else if ($_COOKIE[ADMINCOOKIE] == "bikefun") {
	$loggedin = 1;
    }

    include(INCLUDES."/header.html");

    # The administrator has the option of deleting an event
    if ($loggedin && $_REQUEST['delevent']) {
	$id = $_REQUEST['delevent'];
	mysql_query("DELETE FROM calevent WHERE id=$id", $conn);
	mysql_query("DELETE FROM caldaily WHERE id=$id", $conn);
    }
?>
<style type="text/css">
    td {text-align: center;}
</style>
<script type="text/javascript">
/* Ask for confirmation, and then resubmit /admnodate.php with a parameter to
 * delete an event
 */
function delevent(id, title)
{
	if (confirm("Really delete the \""+title+"\" event?")) {
		location.replace("admnodate.php?delevent="+id);
	}
}
</script>
<?php
    if (!$loggedin) {
	print "<h1>No Permission</h1>\n";
	print "You must log in as the administrator before you're allowed\n";
	print "to do that.  You can log in <a href=\"admin.php\">here</a>.\n";
    } else {
	print "<h1>Events with no dates</h1>\n";
	print "<table><tr><td>\n";
	print "This table lists any events that have no actual date records.\n";
	print "This should never happen!  If the list isn't empty then\n";
	print "something's wrong.\n";
	print "The most likely cause is that somebody's robot is\n";
	print "submitting random data into a calsubmit.php request.\n";
	print "</td><td>\n";
	print "<button onclick=\"location.replace('admin.php')\">Administration Menu</button>\n";
	print "</td></tr></table>\n";
	print "<p>\n";
	print "<table border=1 bgcolor=\"#ffe880\">\n";
	print "  <tr background=\"".IMAGES."/owall.gif\"><th>Title</th><th>Intended dates</th><th>email address</th><th>X</th><th>When Added</th></tr>\n";

	# Fetch a list of all events
	$events = mysql_query("SELECT modified, id, title, dates, email FROM calevent ORDER BY id", $conn) or die("Fetching events: ".mysql_error());

	# Check whether each one has any date records
	while ($record = mysql_fetch_array($events)) {
	    $days = mysql_query("SELECT * FROM caldaily WHERE id=${record[id]}", $conn);
	    if (mysql_num_rows($days) == 0) {
		print "  <tr><td><a href=\"".CALURL."calform.php?edit=".obscure($record["id"])."\">${record[title]}</a></td><td>${record[dates]}</td><td>${record[email]}</td><td><img border=0 src=\"".IMAGES."/forumdel.gif\" alt=\"X\" onClick=\"delevent(${record[id]}, '${record[title]}')\" title=\"Delete this event without sending email\"></td><td>${record[modified]}</td></tr>\n";
	    }
	}
	print "</table>\n";
    }

    include(INCLUDES."/footer.html");
    #ex:set sw=4:
?>

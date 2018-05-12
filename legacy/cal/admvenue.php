<?php
# This page is used by administrators to edit the list of known venues.
# The response is always an HTML table listing the known venues, with each
# field being editable.  When you change anything, the page is reloaded with
# parameters to indicate what the change was; this page performs the changes
# before sending back the modified list.  Parameters include:
#
# canon=	The canonical version of a name.  This is used to identify an
#		existing record to be modified or deleted.  Without this, any
#		location values will imply that a new record should be added.
#
# locname=	The name of the venue.  This should be punctuated and
#		capitalized exactly as you want it to appear to the user.
#
# address=	A manually-verified address for the venue.  This should be
#		punctuated and capitalized exactly as you want it to appear
#		to the user.
#
# area=		P for portland or V for vancouver.
#
# locked=	1 to lock the entry, or 0 to unlock it.  Generally, if you've
#		gone to the trouble of manually adding/updating an entry then
#		you want to lock it.

    include("include/common.php");
    
    

    $loggedin = 0;
    if ($_POST["user"] == ADMINUSER && $_POST["pass"] == ADMINPASS) {
	setcookie(ADMINCOOKIE, "bikefun", time()+3600, "/");
	$loggedin = 1;
    } else if ($_COOKIE[ADMINCOOKIE] == "bikefun") {
	$loggedin = 1;
    }

    include(INCLUDES."/header.html");
?>
<style type="text/css">
    td {text-align: center;}
</style>
<script type="text/javascript" src="<?php echo CALURL; ?>js/xmlextras.js"></script>
<script type="text/javascript">
function changecaladdr(canon, locname, address, area, locked)
{
	    var conn = XmlHttp.create();
	    var url = "admvenue.php?canon=" + encodeURIComponent(canon);
	    url += "&locname=" + encodeURIComponent(locname);
	    url += "&address=" + encodeURIComponent(address);
	    url += "&area=" + encodeURIComponent(area);
	    url += "&locked=" + encodeURIComponent(locked);
	    conn.open("GET", url, false);
	    conn.send(null);
	    document.getElementById(canon).src = (locked ? "images/locked.gif" : "images/unlocked.gif");
}
</script>
<?php
    if (!$loggedin) {
	print "<h1>No Permission</h1>\n";
	print "You must log in as the administrator before you're allowed\n";
	print "to do that.  You can log in <a href=\"admin.php\">here</a>.\n";
    } else {
	# If an edit was passed, perform it
	if ($_REQUEST["canon"] && $_REQUEST["delete"]) {
	    mysql_query("DELETE FROM caladdress WHERE canon = \"${_REQUEST[canon]}\"", $conn) || die(mysql_error());
	} else if ($_REQUEST["canon"]) {
	    $canon = canonize($_REQUEST["locname"]);
	    if (!$canon)
		die("canonize(\"${_REQUEST[locname]}\") returned \"$canon\"");
	    $comma = "";
	    $sql = "UPDATE caladdress SET";
	    if ($_REQUEST["locname"]) {
		$sql .= "$comma canon=\"$canon\"";
		$comma = ",";
		$sql .= ", locname=\"${_REQUEST[locname]}\"";
	    }
	    if ($_REQUEST["address"]) {
		$sql .= "$comma address=\"${_REQUEST[address]}\"";
		$comma = ",";
	    }
	    if ($_REQUEST["area"]) {
		$sql .= "$comma area=\"${_REQUEST[area]}\"";
		$comma = ",";
	    }
	    if ($_REQUEST["locked"] != "") {
		$sql .= "$comma locked=${_REQUEST[locked]}";
		$comma = ",";
	    }
	    $sql .= " WHERE canon = \"${_REQUEST[canon]}\"";
	    mysql_query($sql, $conn) || die(mysql_error());
	    die("happy"); # Just to avoid sending back a bunch of ignored text
	} else if ($_REQUEST["locname"] && $_REQUEST["address"] && $_REQUEST["area"]) {
	    $canon = canonize($_REQUEST["locname"]);
	    if (!$canon)
		die("canonize(\"${_REQUEST[locname]}\") returned \"$canon\"");
	    mysql_query("INSERT INTO caladdress (canon, locname, address, area, locked) VALUES (\"$canon\", \"${_REQUEST[locname]}\", \"${_REQUEST[address]}\", \"${_REQUEST[area]}\", 1)", $conn) || die(mysql_error());
	}

	# Output the form.
	print "<center><h1>Venue Editor</h1>\n";
	print "For editing by administrators only!<br>\n";
	print "<button onclick=\"window.location.replace('admin.php');\">Administration Menu</button>\n";
	$result = mysql_query("SELECT * FROM caladdress ORDER BY canon", $conn) or die(mysql_error());
	print "<p>There are currently <strong>".mysql_num_rows($result)."</strong> known venues<p>";
	print "<p>\n";
	print "<table border=1 bgcolor=\"#ffe880\">\n";
	print "  <tr background=\"".IMAGES."/owall.gif\"><th>Name of Business or Park</th><th>Address</th><th>Area</th><th>Lock</th><th>Actions</th></tr>\n";
	while ($record = mysql_fetch_array($result)) {
	    $canon = $record["canon"];
	    $locname = addslashes($record["locname"]);
	    $address = addslashes($record["address"]);
	    $area = $record["area"];
	    print "  <tr>\n";
	    print "    <td>\n";
	    print "      <input type=text size=30 name=locname value=\"${record[locname]}\" onChange=\"changecaladdr('$canon',this.value,'$address','$area',1);\">\n";
	    print "    </td>\n";
	    print "    <td>\n";
	    print "      <input type=text size=30 name=address value=\"${record[address]}\" onChange=\"changecaladdr('$canon','$locname',this.value,'$area',1);\">\n";
	    print "    </td>\n";
	    print "    <td>\n";
	    print "      <select name=area onClick=\"changecaladdr('$canon','$locname','$address',this.value,1);\">\n";
	    print "        <option value=P".($record["area"]=="P"?" selected":"").">Portland</option>\n";
	    print "        <option value=V".($record["area"]!="P"?" selected":"").">Vancouver</option>\n";
	    print "      </select>\n";
	    print "    </td>\n";
	    print "    <td>\n";
	    if ($record["locked"])
		$imgsrc = "images/locked.gif";
	    else
		$imgsrc = "images/unlocked.gif";
	    print "      <img id=\"$canon\" src=\"$imgsrc\" onClick=\"changecaladdr('$canon','$locname','$address', '$area', (this.src.substr(this.src.lastIndexOf('/')) == '/unlocked.gif' ? 1 : 0));\">\n";
	    print "    </td>\n";
	    print "    <td>\n";
	    print "      <button onClick=\"window.location.replace('admvenue.php?canon='+encodeURIComponent('$canon')+'&delete=Y')\">Delete</button>\n";
	    print "    </td>\n";
	    print "  </tr>\n";
	}
	print "  <tr>\n";
	print "    <td colspan=5 align=center>\n";
	print "      <div style=\"text-align: left\">\n";
	print "      <ul>\n";
	print "        <li>To <strong>change</strong> a record, simply edit its fields above.<br>The change will be stored when you move the cursor out of that field.\n";
	print "        <li>To <strong>delete</strong> a record, click its [Delete] button above.\n";
	print "        <li>To <strong>add</strong> a record, fill in its fields below and click [Add].\n";
	print "      </ul>\n";
	print "      </div>\n";
	print "    </td>\n";
	print "  </tr>\n";
	print "  <tr>\n";
	print "    <form action=\"admvenue.php\">\n";
	print "      <td><input type=text size=30 name=locname></td>\n";
	print "      <td><input type=text size=30 name=address></td>\n";
	print "      <td><select name=area><option value=\"P\" selected>Portland</option><option value=\"V\">Vancouver</option></select></td>\n";
	print "      <td><img src=\"images/locked.gif\"></td>\n";
	print "      <td><input type=submit value=\"Add\"></td>\n";
	print "    </form>\n";
	print "  </tr>\n";
	print "</table>\n";
	print "<p>\n";
	print "</center>\n";
    }

    include(INCLUDES."/footer.html");
    #ex:set sw=4:
?>

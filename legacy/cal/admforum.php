<?php
# This page is used by administrators to scan and clean up recent forum
# messages.  The response is always an HTML listing combining all events'
# forums.  Each message has a "delete" button.  Parameters include:
#
#   days=	Number of days back to look.  Optional; defaults to 30.
#
#   delmsg=	MSGID of a specific message to delete.
#
#   edit=	ID of a message

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
<?php
    print "  dt { background: url(".IMAGES."/oocorner.gif) no-repeat; }\n";
    print "  div.msglist { border: inset #ffc969; padding: 2; background: url(".IMAGES."/owall.gif); }\n";
    print "  div.organizer { text-align: left; background: url(".IMAGES."/owall.gif); }\n";
?>
  div.hr {font-size: 1; height:3; margin: 0; width: 100%; background-color: #ff9a00;}
  div.msg { text-align: left; background: #ffc969; }
  dt.organizer { font-style: italic; }
  dd.organizer { font-style: italic; }
  dt { font-size: larger; font-weight: bold;}
  dd { margin-left: 50px; margin-bottom: 10px; }
  dl { background: #ffc969; margin: 5px; }
</style>
<?php
    if (!$loggedin) {
	print "<h1>No Permission</h1>\n";
	print "You must log in as the administrator before you're allowed\n";
	print "to do that.  You can log in <a href=\"admin.php\">here</a>.\n";
    } else {
	# If supposed to delete a message, do that.
	if ($_REQUEST["delmsg"] && $_REQUEST["edit"]) {
	    $id = unobscure($_REQUEST["edit"]);
	    mysql_query("DELETE FROM calforum WHERE msgid=\"${_REQUEST[delmsg]} AND id=$id\"", $conn) || die(mysql_error());
	}

	# Figure out what "recent" means
	$recent = time();
	if ($_REQUEST["days"])
	    $recent -= 86400 * $_REQUEST["days"];
	else
	    $recent -= 86400 * 30;
	$recent = date("Y-m-d", $recent);

	# List recent messages
	print "<center><h1>Recent Forum Messages</h1>\n";
	print "For use by administrators only!<br>\n";
	print "This lists forum messages that were posted since <strong>$recent</strong><br>\n";
	print "<button onclick=\"window.location.replace('admin.php');\">Administration Menu</button><br>\n";
	print "<div class=msglist><dl>\n";
	$result = mysql_query("SELECT title, calevent.id AS id, calforum.modified AS modified, msgid, organizer, calforum.name AS name, subject, msg FROM calforum, calevent WHERE calevent.id = calforum.id AND calforum.modified >= \"$recent\" ORDER BY modified DESC", $conn) or die("fetching messages, ".mysql_error());
	while ($record = mysql_fetch_array($result)) {
	    # Format the timestamp -- varies with SQL version
	    if (strlen($record["modified"]) == 14) {
		# older versions of MySQL use YYYYMMDDhhmmss format
		$modified = substr($record["modified"], 0, 4) . "-"
			  . substr($record["modified"], 4, 2) . "-"
			  . substr($record["modified"], 6, 2) . " "
			  . substr($record["modified"], 8, 2) . ":"
			  . substr($record["modified"], 10, 2) . ":"
			  . substr($record["modified"], 12, 2);
	    } else {
		# newer versions of MySQL use YYYY-MM-DD hh:mm:ss format,
		# but (on Thinkhost at least) the timezone is wrong so
		# we need to tweak the hour.
		$hh = substr($record["modified"], 11, 2);
		if ($hh >= TZTWEAK)
		    $hh -= TZTWEAK;
		$modified = substr($record["modified"], 0, 11)
			  . $hh
			  . substr($record["modified"], 13);
	    }

	    print "<div class=hr></div>\n";
	    if ($record["organizer"])
		print "<div class=organizer>\n<dt class=organizer>";
	    else
		print "<div class=msg>\n<dt>";
	    print "<font size=\"-2\">".htmlspecialchars($record["name"])." ($modified) ".htmlspecialchars($record["title"])."</font><br>\n";
	    print htmlspecialchars($record["subject"])."\n";
	    print "<a onClick=\"return confirm('Do you really want to delete this message?');\" href=\"admforum.php?edit=".obscure($record["id"])."&delmsg=".$record["msgid"]."\">\n";
	    print "  <img border=0 src=\"images/forumdel.gif\" alt=\"Delete\" title=\"Delete this message\">\n";
	    print "</a>\n";
	    print "</dt>\n";
	    if ($record["organizer"])
		print "<dd class=organizer>";
	    else
		print "<dd>";
	    print htmldescription($record["msg"])."</dd>\n";
	    print "</div>\n";
	}
	print "</dl></div>\n";
	print "<center>Newer messages at top, older messages at bottom</center>\n";
    }
    print "</center>\n";

    include(INCLUDES."/footer.html");
    #ex:set sw=4:
?>

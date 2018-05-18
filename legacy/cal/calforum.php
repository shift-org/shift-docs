<?php
# This PHP script is used both for viewing a given event's forum, and
# optionally for adding a new message to that forum.
#
# Parameters are:
#
#    id=	Id used by random public users to select the event whose
#		forum should be shown/added to.
#
#    edit=	Obscured id, used by the organizer or "admin" to select
#		the event whose forum should be shown/added to.
#
#    delmsg=	MsgId of a message to be deleted.  Only the event organizer
#		or calendar administrator can do this; i.e., you must also
#		supply the edit=... parameter for the message's obscured
#		event id.
#
#    name=	When adding a message, this is the name of the submitter.
#
#    subject=	When adding a message, this is the message's subject line.
#
#    msg=	When adding a message, this is the body of the message.
#
#    address=	This is a bogus input.  In the message form, this is an
#		<input type=text ...> which is hidden via CSS.  Message
#		submissions from human users should therefore always have
#		an empty address field.  Hopefully robots will mistakenly
#		fill in that field, though, giving us a way to detect them
#		and block their spam.

	include("include/common.php");

	# Make sure we have an "id" or "edit" parameter, identifying the event
	if ($_REQUEST["edit"] != "") {
	    $id = unobscure($_REQUEST["edit"]);
	    $organizer = 1;
	} else {
	    $id = $_REQUEST["id"];
	    $organizer = 0;
	}
	if ($id == "") die("You must pass an 'id' parameter");

	# Also check whether we're logged in as the administrator
	if ($_COOKIE[ADMINCOOKIE] == "bikefun")
	    $admin = 1;
	else
	    $admin = 0;

	# Fetch info about this event
	$result = mysql_query("SELECT id, descr, title, tinytitle, dates, eventtime, name, email, emailforum, image FROM calevent WHERE id=\"${id}\"", $conn) or die(mysql_error());
	if (mysql_num_rows($result) == 0) die("Event #$id not found");
	$event = mysql_fetch_array($result);

	# Look up the date of the event
	$result = mysql_query("SELECT eventdate FROM caldaily WHERE id=$id AND eventstatus<>\"C\" AND eventstatus<>\"E\" AND eventstatus<>\"S\" AND eventdate>=\"".date("Y-m-d")."\" ORDER BY eventdate", $conn);
	if ($result === FALSE || mysql_num_rows($result) == 0)
	    $result = mysql_query("SELECT eventdate FROM caldaily WHERE id=$id AND eventstatus<>\"C\" AND eventstatus<>\"E\" AND eventstatus<>\"S\" ORDER BY eventdate DESC", $conn);
	if ($result === FALSE || mysql_num_rows($result) == 0)
	    $date = date('Y-m-d');
	else {
	    $date = mysql_fetch_array($result);
	    $date = $date['eventdate'];
	}
    
  // prepare some variables for the header.
  $event_title = $event['title'] . ' - ' . date("F jS, Y", strtotime($date)) . ' |  S H I F T to bikes!';    
  $event_image = "eventimages/" . $event['id']. "." . pathinfo($event['image'])['extension'];    
  
	include("include/header-calforum.php");  
?>
<?php
# This computes the checksum.  There's also a JavaScript version of
# it down below.  The idea is that a human using a real browser will
# have a checksum computed in a compatible way, while a robot that
# is merely faking it will have no checksum.  For the sake of
# cross-platform compatibility, we only sum up the ASCII letters.
function checksum($str)
{
    $sum = 0;
    for ($i = 0; $i < strlen($str); $i++) {
	$ch = ord(substr($str, $i));
	if (($ch >= 65 && $ch <= 90) || ($ch >= 97 && $ch <= 122))
	    $sum += $ch;
    }
    return $sum;
}
?>
<script type="text/javascript">
function checksum(str)
{
    sum = 0;
    for (i = 0; i < str.length; i++) {
	ch = str.charCodeAt(i);
	if ((ch >= 65 && ch <= 90) || (ch >= 97 && ch <= 122))
	    sum += ch;
    }
    return sum;
}
</script>
<?php
	# Do we have parameters for a new message?
	if ($admin)
	    $name = 'Shift Calendar Crew';
	else if ($organizer)
	    $name = $event['name'];
	else
	    $name = $_REQUEST['name'];
	$subject = safeinput($_REQUEST['subject']);
	$msg = safeinput($_REQUEST['msg']);
	if ($name != "" && $subject != "" && $_REQUEST["msg"] != "") {
	    # Guard against spam.
	    $spamdict = array("http","online","pill","drug","tablet","antidepression","medication","prescription","money","viagra","viagara","vi@gra","oxycontin","oxycodone","puppy","veterinary","pharmacy","gambling","casino", "cialis", "ambien", "bbw", "xanax", "rx", "valium");
	    $spamminess = 0;
	    $combined = "$name$subject$msg";
	    if (preg_match("/<[Aa][[:space:]]/", $combined))
		$spamminess += 100;
	    $nonascii = preg_split("/[^\012-\176]/", $combined);
	    $spamminess += count($nonascii) * 300 / strlen($combined);
	    foreach($spamdict as $spamword) {
		$found = stripos($combined, $spamword);
		while ($found !== FALSE) {
		    $spamminess += 60;
		    $found = stripos($combined, $spamword, $found + 1);
		}
	    }
	    print "<!-- spamminess=$spamminess -->\n";
	    if ($spamminess >= 100)
		print "<blink><font color=red>Your spammish-looking message is rejected</font></blink>\n";
	    else if (checksum($_REQUEST['msg']) != $_REQUEST['checksum'])
		print "<blink><font color=red>Your miscoded message is rejected</font></blink>\n";
	    else if ($_REQUEST['address'])
		print "<blink><font color=red>Your robot-generated message is rejected</font></blink>\n";
	    else {
		# Guard against duplicate messages
		$result = mysql_query("SELECT msgid FROM calforum WHERE id=\"${id}\" AND name=\"$name\" AND subject=\"$subject\" AND msg=\"$msg\"", $conn) or die(mysql_error());
		if (mysql_num_rows($result) > 0)
		    print "<blink><font color=red>Duplicate message rejected</font></blink>\n";
		else {
		    # Add this message
		    $sql = "INSERT INTO calforum (";
		    $values = " VALUES (";
		    $sql .= "id,";        $values .= '"'.$id.'",';
		    $sql .= "organizer,"; $values .= '"'.($organizer||$admin).'",';
		    $sql .= "name,";      $values .= "\"$name\",";
		    $sql .= "subject,";   $values .= "\"$subject\",";
		    $sql .= "msg)";       $values .= "\"$msg\")";
		    $sql = $sql.$values; 
		    mysql_query($sql, $conn) or die(mysql_error());

		    # Also email a copy to the event organizer, unless we are
		    # the event organizer
		    if ((!$organizer || $admin) && $event["emailforum"]) {
			# Construct a URL for the PP calendar pages
			$url = "http://";
			if ($_SERVER[HTTP_HOST])
			    $url .= $_SERVER[HTTP_HOST];
			else
			    $url .= $_SERVER[SERVER_NAME];
			$url .= dirname($_SERVER[REQUEST_URI]);

			# Find the obscured version of the event ID used by
			# the web site to recognize the event organizer.
			$ob = obscure($id);

			# Construct a message body
			$msgbody = "The following was posted to the forum for your\n";
			$msgbody .= $event["tinytitle"]." event.\n";
			$msgbody .= "See the bottom for instructions on how to use the forum.\n";
			$msgbody .= "-------------------------------------------------------------\n";
			$msgbody .= "$name wrote:\n";
			$msgbody .= wordwrap(stripslashes($msg), 60)."\n";
			$msgbody .= "-------------------------------------------------------------\n";
			$msgbody .= "The forum tries to highlight message from the event organizer\n";
			$msgbody .= "differently from other user's message.  For this to work right\n";
			$msgbody .= "you must enter the forum via the following link...\n";
			$msgbody .= "\n";
			$msgbody .= "   COMPOSE MESSAGE: $url/calforum.php?edit=$ob\n";
			$msgbody .= "\n";
			$msgbody .= "If you don't want to receive forum messages via email anymore,\n";
			$msgbody .= "you'll need to edit your event to turn off the \"send forum\n";
			$msgbody .= "messages here\" checkbox.  Do that at...\n";
			$msgbody .= "\n";
			$msgbody .= "   EDIT EVENT: $url/calform.php?edit=$ob\n";

			# Send it
			$to = $event["email"];
			$subject = "[Shift Cal ${event[tinytitle]}] ".stripslashes($subject);
			$headers = "From: ".SHIFTEMAIL."\r\n"
				 . "List-Help: <$url/calform.php?edit=$ob>\r\n"
				 . "List-Post: <$url/calforum.php?edit=$ob>";
			mail($to, $subject, $msgbody, $headers);
		    }
		}
	    }
	}

	# Do we have parameters for deleting a message?
	if (($admin || $organizer) && $_REQUEST["delmsg"])
	{
	    $sql = "DELETE FROM calforum WHERE id=$id AND msgid=$_REQUEST[delmsg]";
	    mysql_query($sql, $conn) or die(mysql_error());
	}
?>
<style type="text/css">
<?php
    print "  dt { background: url(".IMAGES."/oocorner.gif) no-repeat; }\n";
    print "  div.msglist { border: inset #ffc969; padding: 2; background: url(".IMAGES."/owall.gif); }\n";
    print "  div.organizer { background: url(".IMAGES."/owall.gif); }\n";
?>
  div.hr {font-size: 1; height:3; margin: 0; width: 100%; background-color: #ff9a00;}
  div.msg { background: #ffc969; }
  div.event { text-align: left; width: 80%; padding: 10px; background-color: #ff9a00; border: groove #ff9a00; }
  dt.organizer { font-style: italic; }
  dd.organizer { font-style: italic; }
  dt { font-size: larger; font-weight: bold;}
  dd { margin-left: 50px; margin-bottom: 10px; }
  dl { background: #ffc969; margin: 5px; }
  td.lbl { vertical-align: top; }
  td.in {background: #ffe880; }
  input.subject { font-size: 20; font-weight: bold; }
</style>
<script type="text/javascript">
    /**/
    function checkpost(form)
    {
	if (form.name.value == "" ) {
	    alert("The name field is required.\nIf you aren't comfortable giving\nyour real name, then make one up.");
	    form.name.focus();
	    return false;
	}
	if (form.subject.value == "") {
	    alert("The subject field is required.");
	    form.subject.focus();
	    return false;
	}
	if (form.msg.value == "") {
	    alert("The body shouldn't be empty.\nAt the very least, it should\ncontain the same text as the subject.");
	    form.msg.focus();
	    return false;
	}
	//alert("name="+form.name.value+"\nsubject="+form.subject.value+"\nmsg="+form.msg.value);

	// Compute the checksum of the body
	form.checksum.value = checksum(form.msg.value);
	return true;
    }
</script>
<div id="content" class="content">
<?php
	# Output the basic information about the event
	print "<h1>Forum for ".htmlspecialchars($event["tinytitle"])."</h1>\n";
	print "<center>\n";
	print "<div class=event>\n";
	print "  <span style=\"font-size:large; font-weight: bolder;\">".htmlspecialchars($event["title"])."</span></br>\n";
	print "  <strong> ${event[dates]}, ".hmmpm($event["eventtime"])."</strong>\n";
	print "  <br>".htmldescription($event["descr"])."\n";
	print "</div>\n";
	print "</center>\n";
?>
<center>
<?php
	print "<button onClick=\"window.location.replace('".viewurl($date, $id)."');\">View Calendar</button>\n";
	if ($organizer || $admin)
	    print "<button onClick=\"window.location.replace('calform.php?edit=".obscure($id)."');\">Edit Event</button>\n";
	if ($admin)
	    print "<button onClick=\"window.location.replace('admin.php');\">Administration Menu</button>\n";
?>
</center>
<hr>
<?php
	# Output the forum messages
	$result = mysql_query("SELECT * FROM calforum WHERE id=\"${id}\" ORDER BY modified", $conn) or die(mysql_error());
	if (mysql_num_rows($result) == 0)
	    print "<center><h2><em>No messages yet</em></h2></center>\n";
	else {
	    print "<center>Older messages at top, newer messages at bottom</center>\n";
	    print "<div class=msglist><dl>\n";
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
		print "<font size=\"-2\">".htmlspecialchars($record["name"])." ($modified)</font><br>\n";
		print htmlspecialchars($record["subject"])."\n";
		if ($organizer || $admin) {
		    print "<a onClick=\"return confirm('Do you really want to delete this message?');\" href=\"calforum.php?edit=".obscure($record["id"])."&delmsg=".$record["msgid"]."\">\n";
		    print "  <img border=0 src=\"images/forumdel.gif\" alt=\"Delete\" title=\"Delete this message\">\n";
		    print "</a>\n";
		}
		print "</dt>\n";
		if ($record["organizer"])
		    print "<dd class=organizer>";
		else
		    print "<dd>";
		print htmldescription($record["msg"])."</dd>\n";
		print "</div>\n";
	    }
	    print "</dl></div>\n";
	    print "<center>Older messages at top, newer messages at bottom</center>\n";
	}
?>
<hr>
<center>
  To post a message, fill in the following then click the "Send Message" button.
  <br>Messages that are off-topic, rude, or otherwise inappropriate may be deleted.
  <br><font color=red>*</font> All fields are required.
  <form id="post" action="calforum.php" method="POST" onSubmit="return checkpost(this);">
<?php
    if ($organizer)
	print "    <input type=hidden name=edit value=\"".obscure($id)."\">\n";
    else
	print "    <input type=hidden name=id value=\"$id\">\n";
    print "    <table cellpadding=1 border=1 background=\"".IMAGES."/owall.gif\">\n";
?>
      <tr>
	<td class=lbl><font color=red>*</font>Name:</td>
	<td class=in>
<?php
	if ($admin)
	    print "        <input type=text name=name size=20 value=\"".htmlspecialchars($name)."\" disabled> (You came here via the <a href=\"admin.php\">admin</a> page)</td>\n";
	else if ($organizer)
	    print "        <input type=text name=name size=20 value=\"".htmlspecialchars($name)."\" disabled> (You are the event organizer)</td>\n";
	else
	    print "        <input type=text name=name size=20> (If you're shy, invent a nickname)</td>\n";
?>
	<input type=text name="address" style="display:none">
	<input type=hidden name="checksum">
      </tr>
      <tr>
	<td class=lbl><font color=red>*</font>Subject:</td>
	<td class=in><input type=text name=subject class=subject size=40></td>
      </tr>
      <tr>
	<td class=lbl><font color=red>*</font>Body:</td>
	<td class=in><textarea name=msg rows=5 cols=60></textarea></td>
      </tr>
      <tr>
	<td class=lbl colspan=2 align=center>
	  <input type=submit value="Send Message">
	</td>
      </tr>
    </table>
  </form>
  <script type="text/javascript" language="JavaScript">
<?php
	if ($admin || $organizer)
	    print "document.forms.post.subject.focus();\n";
	else
	    print "document.forms.post.name.focus();\n";
?>
  </script>
</center>
</div>
<?php
	include(INCLUDES."/footer.html");
#ex:se sw=4:
?>

<?php
# TO DO:
#   * Add buttons to export the data in various formats, including simple
#     HTML, XML, CSV, and a rough-draft of the Bulletin.  (Most of these
#     formats already exist; I just need hooks to them.  Also, they will
#     need to be tweaked to handle backreferences correctly.)

# This page is used by administrators to edit the print descriptions of
# events in a given range.  You must be logged in as the administrator
# to use this page.
#
# If no range is given, then it will ask for a date range before it
# shows any events.
#
# The response is always an HTML table listing the print data of the events,
# with extra facilities for editing them.  The actual changing is done via
# the vfyreview.php request.
#
# dates=	Date range, typically "month" or "mm/dd - mm/dd"

    # Disable the cache
    header( "Expires: ". gmdate("D, d M Y H:i:s") . "GMT" );
    header( "Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT" );
    header( "Cache-Control: no-cache, must-revalidate" );
    header( "Pragma: no-cache" );

    include("include/common.php");
    include("include/repeat.php");
    
    

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
    form		{ border: none; margin: 0; padding: 0; }
    table.events	{ border: medium solid black; border-collapse: collapse; background: #d8c8b0; }
    td.date		{ border-top: thin solid black; border-bottom: thin dotted black; }
    td.buttons		{ border-right: thin dotted black; vertical-align: top;}
    td.event		{ width: 35em; vertical-align: top;}
    span.button		{ border: medium outset; cursor: pointer; height: 10px; width: 10px; font-size: 3pt;}


    tr.Inspect		{ background: pink; }
    tr.Approved		{ background: #c0ffc0; }
    tr.Exclude		{ background: #e0d0b8; }
    tr.SentEmail	{ background: #f0f060; }
    tr.Revised		{ background: pink; }

    div.titleInspect	{ font-weight: bold; text-transform: uppercase; }
    div.titleApproved	{ font-weight: bold; text-transform: uppercase; }
    div.titleExclude	{ font-weight: bold; text-transform: uppercase; color: #808080; }
    div.titleSentEmail	{ font-weight: bold; text-transform: uppercase; }
    div.titleRevised	{ font-weight: bold; text-transform: uppercase; }

    div.titleInspect:hover	{ color: blue; cursor: pointer; text-transform: none; }
    div.titleApproved:hover	{ color: blue; cursor: pointer; text-transform: none; }
    div.titleExclude:hover	{ color: blue; cursor: pointer; text-transform: none; }
    div.titleSentEmail:hover	{ color: blue; cursor: pointer; text-transform: none; }
    div.titleRevised:hover	{ color: blue; cursor: pointer; text-transform: none; }

    div.addressInspect	{ font-weight: bold; }
    div.addressApproved	{ font-weight: bold; }
    div.addressExclude	{ display: none; visibility: hidden; }
    div.addressSentEmail { font-weight: bold; }
    div.addressRevised	{ font-weight: bold; }

    div.timeInspect	{ font-weight: normal; }
    div.timeApproved	{ font-weight: normal; }
    div.timeExclude	{ display: none; visibility: hidden; }
    div.timeSentEmail	{ font-weight: normal; }
    div.timeRevised	{ font-weight: normal; }

    div.descInspect	{ font-weight: normal; }
    div.descApproved	{ font-weight: normal; }
    div.descExclude	{ display: none; visibility: hidden; }
    div.descSentEmail	{ font-weight: normal; }
    div.descRevised	{ font-weight: normal; }

    div.descInspect:hover	{ color: blue; cursor: pointer; }
    div.descApproved:hover	{ color: blue; cursor: pointer; }
    div.descExclude:hover	{ display: none; visibility: hidden; }
    div.descSentEmail:hover	{ color: blue; cursor: pointer; }
    div.descRevised:hover	{ color: blue; cursor: pointer; }

    div.contactInspect	{ font-weight: normal; }
    div.contactApproved	{ font-weight: normal; }
    div.contactExclude	{ display: none; visibility: hidden; }
    div.contactSentEmail { font-weight: normal; }
    div.contactRevised	{ font-weight: normal; }
    a.button { border: medium outset #ffd080; background: #ffd080; text-decoration: none; padding-left: 2px; padding-right: 2px; cursor: pointer; white-space: nowrap;}
</style>
<script type="text/javascript" src="<?php echo CALURL; ?>js/xmlextras.js"></script>
<script type="text/javascript">
<?php print "SHIFTEMAIL = \"".SHIFTEMAIL."\";\n"; ?>
</script>
<script type="text/javascript">

// This array is used to keep track of each event's review status, so we
// can distinguish between actual changes and merely setting it to what
// it was already set to.
var review = new Array();

// This adds a wordWrap function to the String class
String.prototype.wordWrap = function(width,newline)
{
    var i, word, col, s;

    // Replace all spans of whitespace with a single space
    s = this.replace(/\s+/g, " ");

    // Remove trailing whitespace
    s = s.replace(/\s*$/, "");

    // Replace some spaces with newlines, to keep the lines short
    col = 0;
    word = -1;
    for (i = 0; i < s.length; i++) {
	if (s.charAt(i) == " ")
	    word = i;
	if (++col >= width && word >= 0) {
	    s = s.substr(0, word) + newline + s.substr(word + 1);
	    col = i - word;
	    word = -1;
	}
    }

    // Return the altered string
    return s;
}


// This function generates the body of an email message to be sent to an
// event organizer when the event's review status is changed to "SendEmail".
function emailbody(eventid)
{
    var title = document.getElementById("title_"+eventid).innerHTML;
    var desc = document.getElementById("desc_"+eventid).innerHTML;
    var editurl = document.getElementById("editurl_"+eventid).innerHTML;

    // Return the email body.  IF YOU CHANGE THE BODY HERE, THEN YOU SHOULD
    // CHANGE IT IN VFYREVIEW.PHP TOO
    return "Please edit the PRINT DESCRIPTION of your "+title+"\n"+
	    "event as soon as possible.  Right now the calendar crew\n"+
	    "doesn't feel it is \"print ready\" and the print deadline\n"+
	    "is May 10.  The current PRINT DESCRIPTION is:\n"+
	    "\n"+
	    desc.wordWrap(60, "\n")+"\n"+
	    "\n"+
	    "You can edit your event here:\n"+
	    editurl;
}

// This asks for confirmation when the user changes an event's status to
// "SendEmail".
function confirmemail(eventid)
{
    var email = document.getElementById("email_"+eventid).innerHTML;
    return confirm( "Do you really want to send this \"canned\" email\n"+
		    "message to "+email+"?\n"+
		    "--------------------------------------------\n"+
		    emailbody(eventid));
}

// Change the CSS class of a DOM element
function changeclass(eventId, classname)
{
    var element = document.getElementById(eventId);
    element.setAttribute("class", classname);     // For all but Microsoft
    element.setAttribute("className", classname); // For Microsoft

    // For "tr_" elements, we also need to look by name.  This is because
    // for repeating events, all but the first instance are uneditable but
    // we still want to change the colors.  Similarly, we want to adjust the
    // text color for the "title_".
    if (eventId.substr(0,3) == "tr_" || eventId.substr(0,6) == "title_") {
	var elements = document.getElementsByName(eventId);
	var i;
	for (i = 0; i < elements.length; i++) {
	    elements[i].setAttribute("class", classname);     // For all but Microsoft
	    elements[i].setAttribute("className", classname); // For Microsoft
	}
    }
}


// Change the review status of an event.  This also changes the event's
// appearance in this page.
function changereview(eventid, newreview, newtinytitle, newprintdescr)
{
    // If no change then do nothing
    if (newreview == review[eventid] && !newtinytitle && !newprintdescr)
	return;

    // For "SentEmail" confirm it first
    if (newreview == "SentEmail" && !confirmemail(eventid)) {
	// the input should revert back to its previous value
	document.getElementById("review_"+eventid).value = review[eventid];
	return;
    }

    // Fetch the "edit" value, which is packed into the document
    var edit = document.getElementById("edit_"+eventid).value;

    var conn = XmlHttp.create();
    var url = "vfyreview.php?edit="+edit;
    url += "&review=" + newreview;
    if (newtinytitle)
	url += "&tinytitle=" + encodeURIComponent(newtinytitle);
    if (newprintdescr)
	url += "&printdescr=" + encodeURIComponent(newprintdescr);
    conn.open("GET", url, false);
    conn.send(null);
    if (conn.responseText.indexOf("Success!") < 0) {
	// No success!  Better tell the user...
	alert("response:\n"+conn.responseText);
    } else {
	changeclass("tr_"+eventid, newreview);
	changeclass("title_"+eventid, "title"+newreview);
	changeclass("address_"+eventid, "address"+newreview);
	changeclass("time_"+eventid, "time"+newreview);
	changeclass("desc_"+eventid, "desc"+newreview);
	changeclass("contact_"+eventid, "contact"+newreview);
	review[eventid] = newreview;
	document.getElementById("review_"+eventid).value = newreview;

	// For "SentEmail" change the text from "Send Email" to "Sent Email".
	// (The email is actually sent by the PHP code on Shift's web host.)
	if (newreview == "SentEmail") {
	    var options = document.getElementById("review_"+eventid).options;
	    var i;
	    for (i = 0; i < options.length; i++) {
		if (options[i].text == "Send Email")
		    options[i].text = "Sent Email";
	    }
	}
    }
}

</script>
<div id="bigtip" style="margin:0;padding:0;z-index:1;position:absolute;visibility:hidden;background: #ffc969 url(images/oocorner.gif) no-repeat; border: medium solid brown;"></div>
<script type="text/javascript">
// These functions implement the "bigtip" functionality.  This is basically
// like a glorified version of the title=... attribute.  It allows you to
// use full HTML in the pop-up window.
//
// Usage:
//       onMouseOver="bigtip('some HTML text')" onMouseOut="bigtipclear()"
//       onMouseOver="bigtipfetch(id, sqldate)" onMouseOut="bigtipclear()"
//       onMouseOver="bigtipdelayed(id, sqldate)" onMouseOut="bigtipclear()"
//////////////////////////////////////////////////////////////////////////////

// Configuration constants
var bigtipoffsetY = 12;     // y offset of tooltip, relative to mouse
var bigtipfudge = -120;     // amount to compensate for mysterious drift

//////////////////////////////////////////////////////////////////////////////

// Browser version sensing, and mouse tracking
var bigtipie = document.all // MSIE,Opera
var bigtipns6 = document.getElementById && !bigtipie  // Netscape,Mozilla,Firefox
var bigtipmousey = 0;
var bigtipbottom = 0;
var bigtipobj = "";
if (bigtipie)
    bigtipobj = document.all["bigtip"]
else if (bigtipns6)
    bigtipobj = document.getElementById("bigtip")

// This function assigns the text, and optionally the background color or width,
// to use for the next big tip.
function bigtip(htmltext)
{
    var winwidth;

    if (bigtipns6||bigtipie){
	if (typeof htmltext == "undefined" || htmltext == "") {
	    /* no text given, so hide the tip */
	    bigtipobj.style.visibility = "hidden";
	} else {
	    /* find the width of the browser window */
	    if (bigtipie && !window.opera) {
		var ietruebody;
		if (document.compatMode && document.compatMode != "BackCompat")
		    ietruebody = document.documentElement;
		else
		    ietruebody = document.body;
		winwidth = ietruebody.clientWidth;
	    } else
		winwidth = window.innerWidth - 20;

	    /* set the bigtip width to 80% of the brower width, and center it */
	    bigtipobj.style.width = Math.floor(winwidth * 0.8) + "px";
	    bigtipobj.style.left = Math.floor(winwidth * 0.1) + "px";

	    /* store the text */
	    bigtipobj.style.visibility = "hidden";
	    bigtipobj.innerHTML = htmltext;

	    /* adjust the position */
	    if (bigtipbottom < bigtipobj.offsetHeight)
		bigtipobj.style.top = (bigtipmousey - bigtipobj.offsetHeight - bigtipoffsetY + bigtipfudge) + "px";
	    else
		bigtipobj.style.top = (bigtipmousey + bigtipoffsetY + bigtipfudge) + "px";
	    bigtipobj.style.visibility = "visible";
	}
    }
}

// This function should be called whenever the mouse moves.  It tracks the
// mouse position in JavaScript variables, where bigtip() can examine it.
function bigtipposition(e)
{
    var winheight;
    if (bigtipie && !window.opera) {
	var ietruebody;
	if (document.compatMode && document.compatMode != "BackCompat")
	    ietruebody = document.documentElement;
	else
	    ietruebody = document.body;
	winheight = ietruebody.clientHeight;
	bigtipbottom = winheight - event.clientY;
	bigtipmousey = event.clientY + ietruebody.scrollTop;
    } else {
	winheight = window.innerHeight - 20;
	bigtipbottom = winheight - e.clientY;
	bigtipmousey = e.pageY;
    }
}

// Arrange for bigtipposition() to be called whenever the mouse moves
document.onmousemove = bigtipposition;

var bigtiptimer; // Timer used to delay loading of a bigtip
var bigtipconn; // Connection used for fetching full text of a given event

// Fetch the full text of a given event and show it in the bigtext window.
function bigtipfetch(id, sqldate)
{
    var url = "viewsingle.php?id=" + id;
    url += "&sqldate=" + sqldate;

    // cancel a pending fetch, if any
    bigtipclear();

    // Fetch the new URL and show it as a bigtip
    bigtipconn = XmlHttp.create();
    bigtipconn.open("GET", url, true);
    bigtipconn.onreadystatechange = function() {
	if (bigtipconn.readyState == 4) {
	    bigtip(bigtipconn.responseText);
	    bigtipconn = null;
	}
    }
    bigtipconn.send(null);
}

// wait 1 second and then fetch an event's full text
function bigtipdelayed(id, sqldate)
{
    bigtipclear();
    bigtiptimer = setTimeout("bigtipfetch("+id+", \""+sqldate+"\")", 2000);
}

function bigtipclear()
{
    // cancel a pending timer, if any
    if (bigtiptimer != null)
    {
	clearTimeout(bigtiptimer);
	bigtiptimer = null;
    }

    // cancel a pending fetch, if any
    if (bigtipconn != null) {
	bigtipconn.abort();
	bigtipconn = null;
    }

    // hide the bigtip
    bigtipobj.style.visibility = "hidden";
    bigtipobj.style.left = "-1000px";
}
</script>
<div id="quickedit" style="margin:0;padding:0;z-index:1;position:absolute;visibility:hidden;background: #ffc969; border: medium solid brown;">
  <form onSubmit="qesubmit(); return false;">
    <input id="qeid" type=hidden name="id" value="">
    <input id="qetinytitle" name="tinytitle" size=24>
    <br>
    <textarea id="qeprintdescr" name="printdescr" cols=45 rows=5></textarea>
    <br>
    <input type=submit value="CHANGE!">
    <input type=button value="Cancel" onClick="qehide()">
  </form>
</div>
<script type="text/javascript">
// The following functions, together with the above hidden <div> block,
// implement the "quick edit" window for editing an event's description
// without loading a whole new page.

// Hide the quickedit <div> block.
function qehide()
{
    // hide it
    var e = document.getElementById("quickedit");
    e.style.visibility = "hidden";
    e.style.left = "-1000px";

    // empty the form
    document.getElementById("qeid").value = "";
    document.getElementById("qetinytitle").value = "";
    document.getElementById("qeprintdescr").value = "";
}

// Show the quickedit <div> block as a pop-up window near the cursor,
// and fill it with values from a given event.
function qeshow(eventid)
{
    // fill in the form
    var e = document.getElementById("qeid");
    if (e.value != "") {
	qehide();
    }
    e.value = eventid;
    document.getElementById("qetinytitle").value = document.getElementById("title_"+eventid).innerHTML;
    document.getElementById("qeprintdescr").value = document.getElementById("desc_"+eventid).innerHTML;

    // find the width of the browser window
    if (bigtipie && !window.opera) {
	var ietruebody;
	if (document.compatMode && document.compatMode != "BackCompat")
	    ietruebody = document.documentElement;
	else
	    ietruebody = document.body;
	winwidth = ietruebody.clientWidth;
    } else
	winwidth = window.innerWidth - 20;

    // Choose a position & show the form
    e = document.getElementById("quickedit");
    if (bigtipbottom < e.offsetHeight)
	e.style.top = (bigtipmousey - e.offsetHeight - bigtipoffsetY + bigtipfudge) + "px";
    else
	e.style.top = (bigtipmousey + bigtipoffsetY + bigtipfudge) + "px";
    e.style.left = Math.floor((winwidth - e.offsetWidth) / 2) + "px";
    e.style.visibility = "visible";
}

// Process the result of an edit.  This is called when the user clicks the
// [CHANGE!] button on the quick edit form.
function qesubmit()
{
    // Exract values from form
    var eventid = document.getElementById("qeid").value;
    var tinytitle = document.getElementById("qetinytitle").value;
    var printdescr = document.getElementById("qeprintdescr").value;

    // Send changes to web host

    // Update the title and description in this page
    document.getElementById("title_"+eventid).innerHTML = tinytitle;
    document.getElementById("desc_"+eventid).innerHTML = printdescr;

    // Change the status to "Approved" and store the new printdescr
    changereview(eventid, "Approved", tinytitle, printdescr);

    // Hide the window
    qehide();
}

</script>
<?php
    if (!$loggedin) {
	print "<h1>No Permission</h1>\n";
	print "You must log in as the administrator before you're allowed\n";
	print "to do that.  You can log in <a href=\"admin.php\">here</a>.\n";
	print "</body></html>\n";
	exit();
    }
?>
<h1>Print Description Editor</h1>
This page allows you to edit print descriptions before the print deadline.
This is also where you go to export the event data to a desktop publisher.
<p>
<center>
  <table>
    <tr>
      <td valign=middle>Date range:</td>
      <td align=left valign=middle>
	<form action="admreview.php">
<?php
    print "<input type=text size=30 name=\"dates\" value=\"".$_REQUEST["dates"]."\" onChange=\"submit()\">\n";
    if ($_REQUEST["dates"] == "")
	print "</td></tr><tr><td></td><td>Enter the dates of the<br>events you want to edit.\n";
    else {
	$daylist = repeatdates($_REQUEST["dates"]);
	if ($daylist[365])
	    $daylist = array();
	if (!$daylist[1])
	    print "</td></tr><tr><td></td><td><font color=red>Invalid date range.</font><br>Date ranges are typically<br>a month name, or of the<br>form \"MM/DD&nbsp;-&nbsp;MM/DD\"";
    }
?>
        </form>
      </td>
    </tr>
    <tr>
      <td></td>
      <td>
        <table>
          <tr>
<?php
    print "            <td width=0><form><input type=submit value=\"".PPNAME."\"><input type=hidden name=\"dates\" value=\"".PPDATES."\"></form></td>\n";
    $now = getdate();
    $month = $now["month"];
    print "            <td width=0><form><input type=submit value=\"$month\"><input type=hidden name=\"dates\" value=\"$month\"></form></td>\n";
    if ($now["mday"] < 20)
	$now = getdate($now[0] + (86400 * 32));
    else
	$now = getdate($now[0] + (86400 * 12));
    $month = $now["month"];
    print "            <td width=0><form><input type=submit value=\"$month\"><input type=hidden name=\"dates\" value=\"$month\"></form></td>\n";
?>
	  </tr>
	  <tr>
	    <td align=center colspan=3>
	      <input type=submit value="Administrator Menu" onClick="window.location.replace('admin.php')">
	    </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  <p>
  <table class="events">
<?php
    # For each day...
    for ($i = 1; $daylist[$i]; $i++) {

	# Fetch the event info for each event on this day
	$sql = "SELECT calevent.id, name, email, printemail, phone, printphone, weburl, printweburl, contact, printcontact, tinytitle, descr, printdescr, audience, dates, datestype, eventtime, eventduration, timedetails, locname, address, locdetails, area, review, eventstatus, newsflash, eventdate  FROM calevent, caldaily WHERE calevent.id = caldaily.id AND eventstatus<>\"S\" AND eventstatus<>\"C\" AND eventdate=\"".$daylist[$i]["sqldate"]."\" ORDER BY eventtime, tinytitle";
	$result = mysql_query($sql, $conn) or die(mysql_error());

	# Generate a pretty version of the date
	$prettydate = date("l F j", $daylist[$i]["timestamp"]);

	# If any events then show the date
	if (mysql_num_rows($result) > 0) {
	    print "    <tr>\n";
	    print "      <td class=\"date\" colspan=2>$prettydate</td>\n";
	    print "    </tr>\n";
	}

	# For each event...
	while ($record = mysql_fetch_array($result)) {
	    # Extract a few fields into variables
	    $id = $record["id"];
	    switch ($record["audience"]) {
	      case "F":	$audience = ", family";	break;
	      case "A": $audience = ", 21+";	break;
	      default:  $audience = "";		break;
	    }
	    switch ($record["review"]) {
	      case "A": $review = "Approved";	break;
	      case "E": $review = "Exclude";	break;
	      case "S":	$review = "SentEmail";	break;
	      case "R":	$review = "Revised";	break;
	      default:	$review = "Inspect";	break;
	    }
	    $contact = $record["name"];
	    if ($record["printphone"])
		$contact = "$contact, ".$record["phone"];
	    if ($record["printemail"])
		$contact = "$contact, ".$record["email"];
	    if ($record["printweburl"])
		$contact = "$contact, ".$record["weburl"];

	    # Be wary of dollar values in the online *or* print description
	    $dollars = -1;
	    preg_match_all('/\$([0-9]*)/', $record["descr"], $found);
	    foreach ($found[1] as $match) {
		if ($match == "") {
		    if ($dollars < 0)
			$dollars = 0;
		}
		else if ($match > $dollars) {
		    $dollars = $match + 0;
		}
	    }
	    preg_match_all('/\$([0-9]*)/', $record["printdescr"], $found);
	    foreach ($found[1] as $match) {
		if ($match == "") {
		    if ($dollars < 0)
			$dollars = 0;
		}
		else if ($match > $dollars) {
		    $dollars = $match + 0;
		}
	    }
	    if ($dollars == -1)
		$dollars = "";
	    else if ($dollars == 0)
		$dollars = "\$";
	    else
		$dollars = "\$$dollars";

	    # Generate a row
	    $firstinstance = repeatfirstinstance($record, $prettydate);
	    if ($firstinstance == NULL) {
		# Initialize a javascript array element describing this event.
		print "    <"."script type=text/javascript>\n";
		print "      review[$id] = \"$review\";\n";
		print "    <"."/script>\n";
		
		# Output a row for editing this event
		print "    <tr id=\"tr_$id\" class=\"$review\">\n";
		print "      <input type=hidden id=\"edit_$id\" value=\"".obscure($id)."\">\n";
		print "      <td class=\"buttons\" onMouseOver=\"bigtipdelayed($id, '".$record["eventdate"]."');\" onMouseOut=\"bigtipclear();\">\n";
		print "        <a name=\"a_$id\"></a>\n";
		print "        <select id=\"review_$id\" name=\"review_$id\" onChange=\"changereview($id, this.value);\">\n";
		print "          <option value=Inspect ".($review=="Inspect"?"selected":"").">Inspect</option>\n";
		print "          <option value=Approved ".($review=="Approved"?"selected":"").">Approved</option>\n";
		print "          <option value=Exclude ".($review=="Exclude"?"selected":"").">Exclude</option>\n";
		if ($review == "SentEmail")
		    print "          <option value=SentEmail selected>Sent Email</option>\n";
		else
		    print "          <option value=SentEmail>Send Email</option>\n";
		print "          <option value=Revised ".($review=="Revised"?"selected":"").">Revised</option>\n";
		print "        </select>\n";
		print "        <br><a title=\"Edit in the big form\" href=\"calform.php?edit=".obscure($id)."&reviewdates=".$_REQUEST["dates"]."\"><img src=\"images/edit.gif\" alt=\"[edit]\" border=0></a>\n";
		print "	   <span class=\"button\" title=\"Inspect\" style=\"border-color: red; background: red;\" onClick=\"changereview($id, 'Inspect')\">&nbsp;&nbsp;</span>\n";
		print "	   <span class=\"button\" title=\"Approved\" style=\"border-color: green; background: green;\" onClick=\"changereview($id, 'Approved')\">&nbsp;&nbsp;</span>\n";
		print "	   <span class=\"button\" title=\"Exclude\" style=\"border-color: #c0c0c0; background: #c0c0c0;\" onClick=\"changereview($id, 'Exclude')\">&nbsp;&nbsp;</span>\n";
		if ($dollars != "" && $review != "Exclude") {
		    if (strstr($record["printdescr"], "$") == FALSE)
			print "	   <br><span style=\"font-size: xx-large; font-weight: bold; color: red;\">$dollars</span>\n";
		    else
			print "	   <br><span style=\"font-size: xx-large; font-weight: bold;\">$dollars</span>\n";
		}
		print "      </td>\n";

		print "      <td class=\"event\">\n";
		print "        <div id=\"title_$id\" class=\"title$review\" title=\"Click to edit\" onClick=\"qeshow($id)\">".$record["tinytitle"]."</div>\n";
		print "        <div id=\"address_$id\" class=\"address$review\">".$record["address"].($record["locname"]==""?"":", ".$record["locname"]).($record["locdetails"]==""?"":" (".$record["locdetails"].")")."</div>\n";
		print "        <div id=\"time_$id\" class=\"time$review\">".hmmpm($record["eventtime"]).($record["timedetails"]==""?"":" (".$record["timedetails"].")")."$audience</div>\n";
		print "        <div id=\"desc_$id\" class=\"desc$review\" title=\"Click to edit\" onClick=\"qeshow($id)\">".$record["printdescr"]."</div>\n";
		print "        <div id=\"contact_$id\" class=\"contact$review\">$contact</div>\n";
		print "        <span id=\"email_$id\" style=\"display: none; visibility: hidden;\">".$record["email"]."</span>";
		print "        <span id=\"editurl_$id\" style=\"display: none; visibility: hidden;\">".CALURL."calform.php?edit=".obscure($record["id"])."</span>";
		print "      </td>\n";

		print "    </tr>\n";
	    } else {
		# Output a row that backreferences the original event
		print "    <tr name=\"tr_$id\" class=\"$review\">\n";
		print "      <td onMouseOver=\"bigtipdelayed($id, '".$record["eventdate"]."');\" onMouseOut=\"bigtipclear();\"></td>\n";
		print "      <td>\n";
		print "        <div name=\"title_$id\" class=\"title$review\">".$record["tinytitle"]."</div>\n";
		print "        <div name=\"time_$id\">See <a href=\"#a_$id\">".$firstinstance["date"]."</a> for full details</div>\n";
		print "      </td>\n";
		print "    </tr>\n";
	    }
	}
    }
?>
  </table>
</center>
This lists all events in the date range, sorted by date and time.
For repeating events, only the first instance has a full listing;
the later repeats refer back to the first instance.
Each event is tagged with a status code.
The meanings of these status codes are:
<table style="margin-left: 5em; width: 80%; border-collapse: collapse; ">
  <tr><td valign=top><strong>Inspect: </strong></td><td>The event organizer has either just added or edited this event, so you need to inspect it.</td><tr>
  <tr><td valign=top><strong>Approved: </strong></td><td>You have inspected it and are satisfied.</td><tr>
  <tr><td valign=top><strong>Exclude: </strong></td><td>You have inspected it and decided to omit it from the printed calendar.</td><tr>
  <tr><td valign=top><strong>SentEmail: </strong></td><td>You have asked the organizer to edit it, but they haven't yet.</td><tr>
  <tr><td valign=top><strong>Revised: </strong></td><td>You asked the organizer to edit it, and they did.  You need to inspect it.</td><tr>
</table>
<p>
You can change the status code via the event's pull-down menu, or via tiny
colored buttons under the menu.
Changing the status to "Send Email" will automatically generate and send an
email message asking the organizer to clean up their print description.
<p>
You can edit the title or print description yourself by clicking on it;
this will bring up a quick little editing window.
You can also click the "<img src="images/edit.gif" alt="[Edit]" border=0>"
button to edit it in the big full-featured form.
<p>
The rows are color coded.
<span style="font-weight: bold; color:red">Red</span> means you should inspect it now.
<span style="font-weight: bold; color:yellow">Yellow</span> means you should inspect it later, unless you hit the print deadline.
<span style="font-weight: bold; color:green">Green</span> means you have inspected it and approved it.
<span style="font-weight: bold; color:gray">Gray</span> means you have decided to exclude it from the printed calendar.
<p>
If you let the mouse hover over the buttons for more than two seconds,
a window will pop up showing the full event from the online calendar.
<p>
You can export the calendar data by clicking one of the following buttons:
<a class=button href="viewbulletin.php?dates=<?php print $_REQUEST["dates"]; ?>" target="_BLANK">Bulletin</a>
<a class=button href="viewcsv.php?dates=<?php print $_REQUEST["dates"]; ?>" target="_BLANK">CSV Dump</a>
<a class=button href="viewtab.php?dates=<?php print $_REQUEST["dates"]; ?>" target="_BLANK">Tab Dump</a>
<?php
    include(INCLUDES."/footer.html");
    #ex:set sw=4:
?>

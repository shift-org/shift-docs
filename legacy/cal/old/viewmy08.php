<?php
# This is a simple list of the Pedalpalooza events.  Users can select events
# that interest them, and then do things with that list
#
# Parameters and cookies:
#
#   myevents    (cookie) Stores a list of events in a compact form.  The events
#               are comma-delimited.  The first letter of each value indicates
#               the date, relative to $startdate.  The rest is a base-36
#               encoding of the event ID.
#
#   sharename   Name of a shared list to update

    $startdate = "2008-06-12";
    $enddate = "2008-06-28";

    include("include/common.php");
    include(INCLUDES."/header.html");
    include("include/view.php");
    
    

    # Create the calshare table.  If the table already exists, then this
    # will fail harmlessly
    mysql_query("CREATE TABLE calshare (sharename VARCHAR(255), shareevents VARCHAR(255))", $conn);

    # If given a sharename, then update the calshare table
    if ($_REQUEST["sharename"]) {
	if ($_REQUEST["myevents"]) {
	    $sql = "UPDATE calshare SET shareevents='".$_REQUEST["myevents"]."' WHERE sharename='".$_REQUEST["sharename"]."'";
	    $result = mysql_query($sql, $conn) or die("Updating:".mysql_error());
	    if (mysql_affected_rows($conn) < 1) {
		$sql = "INSERT INTO calshare (shareevents, sharename) VALUES ('".$_REQUEST["myevents"]."', '".$_REQUEST["sharename"]."')";
		$result = mysql_query($sql, $conn) or die("Adding to calshare: ".mysql_error());
	    }
	} else {
	    $sql = "DELETE FROM calshare WHERE sharename='".$_REQUEST["sharename"]."'";
	    $result = mysql_query($sql, $conn) or die("deleting shared list:".mysql_error($conn));
	}
    }
?>
<script type="text/javascript" src="<?php echo CALURL; ?>js/xmlextras.js">
</script>
<script type="text/javascript">
var startdate = "<?php print $startdate; ?>";
</script>
<script type="text/javascript">
/* Create a cookie that will last 180 days */
function createCookie(name,value)
{
    days = (value == "" ? -1 : 180);
    if (days) {
      var date = new Date();
      date.setTime(date.getTime()+(days*24*60*60*1000));
      var expires = "; expires="+date.toGMTString();
    }
    else var expires = "";
    document.cookie = name+"="+value+expires+"; path=/"
}

/* Return a cookie's value, or null if it is not set */
function readCookie(name)
{
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
	var c = ca[i];
	while (c.charAt(0)==' ') c = c.substring(1,c.length);
	if (c.indexOf(nameEQ) == 0) {
	    value = c.substring(nameEQ.length,c.length);
	    return value;
	}
    }
    return null;
}

/* Erase a cookie */
function eraseCookie(name)
{
    createCookie(name,"");
}

/* Generate a string that uniquely identifies a Pedalpalooza event, given its
 * date and id.
 */
function maketoken(sqldate, id)
{
    /* Generate an uppercase letter for the date */
    day = Math.floor(sqldate.slice(-2));
    firstday = Math.floor(startdate.slice(-2));
    token = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    token = token.substr(day - firstday, 1);

    /* Generate a base-36 representation of the ID */
    base36 = "0123456789abcdefghijklmnopqrstuvwxyz";
    while (id > 0) {
	token = token + base36.substr(id % 36, 1);
	id = Math.floor(id / 36);
    }
    
    return token;
}

/* Update the counter at the bottom of the list */
function updatecount()
{
    var count = document.getElementById("count");
    var numevents;
    var list = readCookie("myevents");
    if (list == null || list == "") {
	numevents = 0;
    } else if (list.indexOf(",") < 0) {
	numevents = 1;
    } else {
	list = list.split(",");
	numevents = list.length;
    }
    count.innerHTML = numevents;
}

/* This is called whenever an event's checkbox is changed.  It looks at the
 * new state of the checkbox and either adds or removes the event from the
 * user's list of events (stored in a cookie)
 */
function toggle(checked, sqldate, id)
{
    token = maketoken(sqldate, id);
    list = readCookie("myevents");
    if (list == null || list == "") {
	if (checked)
	    createCookie("myevents", token);

	/* also change the row's background color */
	rowid = "row" + sqldate.substr(8) + "-" + id;
	tr = document.getElementById(rowid);
	//tr.style.backgroundColor = checked ? "#ffe080" : "#ff9a00";
	tr.style.backgroundColor = checked ? "#ffe080" : "";

	updatecount();
	return;
    }
    list = list.split(",");
    for (i = 0; i < list.length && list[i] < token; i++) {
    }
    if (i < list.length && list[i] == token && !checked) {
	list.splice(i, 1);
    }
    if (i > list.length && checked)
	list[i] = token;
    else if (checked)
	list.splice(i, 0, token);
    list = list.toString();
    createCookie("myevents", list);

    /* also change the row's background color */
    rowid = "row" + sqldate.substr(8) + "-" + id;
    tr = document.getElementById(rowid);
    //tr.style.backgroundColor = checked ? "#ffe080" : "#ff9a00";
    tr.style.backgroundColor = checked ? "#ffe080" : "";

    /* update the count */
    updatecount();
}

/* Return true if a given event's checkbox is checked, or false if it isn't.
*/
function ischecked(sqldate, id, list)
{
    var token, list, i;
    token = maketoken(sqldate, id);
    if (list == null)
	list = readCookie("myevents");
    if (list == null || list == "")
	return false;
    if (list == token)
	return true;
    list = list.split(",");
    for (i = 0; i < list.length; i++) {
	if (list[i] == token)
	    return true;
    }
    return false;
}

/* Initialize the checkboxes by examining the "myevents" cookie */
function initcheckboxes(list)
{
    var i, id, sqldate;
    var inputs = document.getElementsByTagName("input");
    for (i = 0; i < inputs.length; i++) {
	if (inputs[i].type == "checkbox" && inputs[i].id && inputs[i].id.indexOf("-") >= 0) {
	    /* extract the date and eventid from the HTML id */
	    id = inputs[i].id.split('-');
	    sqldate = startdate.substr(0,8) + id[0];
	    id = Math.floor(id[1]);

	    /* set or clear the checkbox, as appropriate */
	    inputs[i].checked = ischecked(sqldate, id);
	    tr = document.getElementById("row"+inputs[i].id);
	    //tr.style.backgroundColor = inputs[i].checked ? "#ffe080" : "#ff9a00";
	    tr.style.backgroundColor = inputs[i].checked ? "#ffe080" : "";
	}
    }

    /* update the count */
    updatecount();
}

/* Uncheck all checkboxes, and delete the cookie */
function resetcheckboxes()
{
    var i, id, sqldate;
    var inputs = document.getElementsByTagName("input");

    if (!confirm("Are you sure you want to uncheck all event boxes?"))
	return;

    /* reset all checkboxes */
    for (i = 0; i < inputs.length; i++) {
	if (inputs[i].type == "checkbox"
	 && inputs[i].id
	 && inputs[i].id.indexOf("-") >= 0) {
	    /* clear the checkbox, as appropriate */
	    inputs[i].checked = false;

	    /* reset the row color */
	    tr = document.getElementById("row"+inputs[i].id);
	    tr.style.backgroundColor = "#ff9a00";
	}
    }

    /* delete the cookie */
    eraseCookie("myevents");

    /* update the count */
    updatecount();
}


function useshare(sharename, shareevents)
{
    var i, id, sqldate, onlyshared, anyadded;
    var inputs = document.getElementsByTagName("input");

    /* see whether we'll be adding or removing */
    onlyshared = true;
    anyadded = false;
    for (i = 0; i < inputs.length; i++) {
	if (inputs[i].type == "checkbox"        /* it's a checkbox */
	 && inputs[i].id                        /* it has id, not just name */
         && inputs[i].id.indexOf("-") >= 0) {   /* id looks like event id */
	    /* extract the date and eventid from the HTML id */
	    id = inputs[i].id.split('-');
	    sqldate = startdate.substr(0,8) + id[0];
	    id = Math.floor(id[1]);

	    if (ischecked(sqldate, id, shareevents) && !inputs[i].checked)
		anyadded = true;
	    else if (inputs[i].checked)
		onlyshared = false;
	}
    }

    if (anyadded) {
	if (!confirm("Do you really want to merge "+sharename+" into your list?"))
	    return;
    } else {
	if (!confirm("All of these events are already in your list.\nDo you want to remove "+sharename+" from your list instead?"))
	    return;
    }

    if (anyadded)
    {
	/* we'll be adding */
	for (i = 0; i < inputs.length; i++) {
	    if (inputs[i].type == "checkbox"        /* it's a checkbox */
	     && inputs[i].id                        /* it has id, not just name */
	     && inputs[i].id.indexOf("-") >= 0) {   /* id looks like event id */
		/* extract the date and eventid from the HTML id */
		id = inputs[i].id.split('-');
		sqldate = startdate.substr(0,8) + id[0];
		id = Math.floor(id[1]);

		if (ischecked(sqldate, id, shareevents)) {
		    /* set the checkbox */
		    inputs[i].checked = true;
		    toggle(true, sqldate, id);
		}
	    }
	}
    } else {
	/* we'll be removing */
	for (i = 0; i < inputs.length; i++) {
	    if (inputs[i].type == "checkbox"     /* it's a checkbox */
	     && inputs[i].id                     /* it has id, not just name */
	     && inputs[i].id.indexOf("-") >= 0) {/* id looks like event id */
		/* extract the date and eventid from the HTML id */
		id = inputs[i].id.split('-');
		sqldate = startdate.substr(0,8) + id[0];
		id = Math.floor(id[1]);

		if (ischecked(sqldate, id, shareevents)) {
		    /* clear the checkbox */
		    inputs[i].checked = false;
		    toggle(false, sqldate, id);
		}
	    }
	}
    }

    /* update the count */
    updatecount();

    /* if all of the checked boxes are in the shareevents list, then
     * store the name in the "sharename" input.
     */
    if (anyadded && onlyshared) {
	document.getElementById("sharename").value = sharename;
    }
}

/* update the "events per sheet" guess for the PocketMod, as options change */
function guesspocketmod()
{
    var printdescr = document.getElementById("PMprintdescr").checked;
    var contact = document.getElementById("PMcontact").checked;
    var micro = document.getElementById("PMmicro").checked;
    var image = document.getElementById("PMimage").checked;
    var guess;

    guess = micro ? 55 : 42;
    if (printdescr)
	guess *= 33/53;
    if (contact)
	guess *= 44/55;
    if (image)
	guess *= 7/8;

    document.getElementById("pocketmodguess").innerHTML = Math.round(guess);
}
</script>
<div id="bigtip" style="margin:0;padding:0;z-index:1;position:absolute;visibility:hidden;background: #ffc969 url(images/oocorner.gif) no-repeat; border: medium solid brown;"></div>
<script type="text/javascript">
// Usage:
//       onMouseOver="bigtip('some HTML text')" onMouseOut="bigtipclear()"
//       onMouseOver="bigtipfetch(id, sqldate)" onMouseOut="bigtipclear()"
//       onMouseOver="bigtipdelayed(id, sqldate)" onMouseOut="bigtipclear()"
//////////////////////////////////////////////////////////////////////////////

// Configuration constants
var bigtipoffsetY = 12;     // y offset of tooltip, relative to mouse
var bigtipfudge = -120;     // amount to compensate for mysterious drift

//////////////////////////////////////////////////////////////////////////////

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
    bigtiptimer = setTimeout("bigtipfetch("+id+", \""+sqldate+"\")", 1000);
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
<style type="text/css">
  td.date {font-weight: bold; font-size: larger; background: url(images/oocorner.gif) no-repeat;}
    li { margin-top: 6px; margin-bottom: 6px; }
    a.button { border: medium outset #ffd080;
	       background: #ffd080;
	       text-decoration: none;
	       padding-left: 2px; padding-right: 2px;
	       cursor: pointer;
	       white-space: nowrap;}
    input.button { border: medium outset #ffd080;
	       background: #ffd080;
	       text-decoration: none;
	       padding-left: 2px; padding-right: 2px;
	       cursor: pointer;
	       white-space: nowrap;
	       font-size: medium;}
    div.form {margin-top: 10px; margin-left: 30px; }
    div.buttons { line-height: 175%; margin-left: 30px; margin-top: 4px; margin-bottom: 4px; }
</style>
<div class=content style="margin: 5px;">
  <center><h1>Custom Pedalpalooza 2008 Event List</h1></center>
  This is a simple listing of the Pedalpalooza 2008 events.
  Each event appears on a separate line, sorted by date and time.
  <p>
  There's a checkbox next to each event, so you can mark the events
  that you're interested in.
  This information is not sent anywhere; it is meant only to help you
  plan your fun.
  The list of checked events is stored in a cookie on your computer.
  <p>
  To wipe out all checkboxes, click here:
  <a class=button href="#" onClick="resetcheckboxes();">Clear My List</a>.
  <p>
<?php
    # Are there any shared lists?
    $result = mysql_query("SELECT * FROM calshare ORDER BY sharename", $conn) or die("fetching shared lists:".mysql_error($conn));
    if (mysql_num_rows($result) > 0) {
	print "  The following lists have been shared by other users.\n";
	print "  Though they aren't the \"definitive\" lists in any sense,\n";
	print "  they may still be a useful starting point for your own\n";
	print "  personal list.\n";
        print "  You can merge these lists into yours, or remove their\n";
	print "  events from your list, by clicking the buttons:\n";
	print "  <div class=buttons>";
	while ($record = mysql_fetch_array($result)) {
	    print "<a href=\"#\" class=button onClick=\"useshare('".addslashes($record[sharename])."', '".$record[shareevents]."')\">".htmlspecialchars($record[sharename])."</a>\n";
	}
	print "  </div>";
	print "  <p>\n";
    }
?>
  At the bottom of the form are buttons to generate printouts of your
  events in various formats.

  <table id=events border=1 background="images/owall.gif">
    <tr>
      <th>X</th>
      <th>Time</th>
      <th>Title</th>
      <th>Address</th>
      <th>Contact</th>
    </tr>

<?php
    # For each event...
    $result = mysql_query("SELECT * FROM calevent, caldaily WHERE eventdate >= '$startdate' AND eventdate <= '$enddate' AND eventstatus <> 'C' AND eventstatus <> 'E' AND eventstatus <> 'S' AND calevent.id = caldaily.id ORDER BY eventdate, eventtime", $conn) or die(mysql_error());
    $prevdate = "";
    while ($record = mysql_fetch_array($result)) {
	# At the start of each date, output a date line
	if ($record["eventdate"] != $prevdate) {
	    $prevdate = $record["eventdate"];
	    print "    <tr>\n";
	    print "      <td colspan=5 class=date>".date("l, F d", strtotime($record["eventdate"]))."</td>\n";
	    print "    </tr>\n";
	}

	$htmlid = date("d", strtotime($record["eventdate"]))."-".$record["id"];
	print "    <tr id=\"row$htmlid\">\n";

	print "      <td><input type=checkbox id=\"$htmlid\" onMouseOver=\"bigtipdelayed(".$record["id"].", '".$record["eventdate"]."');\" onMouseOut=\"bigtipclear();\" onClick=\"toggle(this.checked, '${record[eventdate]}', ${record[id]});\"></td>\n";

	$starttime = hmmpm($record["eventtime"]);
	$titlecolor = "";
	if ($record["area"] == "V")
	    $titlecolor = ' style="color: blue;"';
	$badge = "";
	if ($record["audience"] == "F") {
	    $badge = "ff.gif";
	    $badgealt = "[FF]";
	    $badgetitle = "Family Friendly";
	    $badgewidth = 22;
	    $badgeheight = 21;
	} else if ($record["audience"] == "A") {
	    $badge = "beer.gif";
	    $badgealt = "[21+]";
	    $badgetitle = "Adults (21+) only";
	    $badgewidth = 14;
	    $badgeheight = 24;
        }
	print "      <td>$starttime";
	if ($record["eventduration"] > 0)
	    print "-".endtime($starttime, $record["eventduration"]);
	print "      </td>\n";

	print "      <td>\n";
	if ($badge != "")
	    print "        <img border=0 src=\"".IMAGES."/$badge\" alt=\"$badgealt\" title=\"$badgetitle\" width=$badgewidth height=$badgeheight>\n";
	#print "        <a href=\"viewpp2008.php#$htmlid\" target=\"pp\"$titlecolor title=\"".htmlspecialchars($record["title"])."\">\n";
	print "        <a href=\"viewpp2008.php#$htmlid\" target=\"pp\"$titlecolor title=\"".htmlspecialchars($record["title"])."\">\n";
	print "          ".htmlspecialchars($record["tinytitle"])."\n";
	print "        </a>\n";
	print "      </td>\n";

	print "      <td>".htmlspecialchars($record["address"])."</td>\n";

	print "      <td>\n";
	print "        ".htmlspecialchars($record["name"])."\n";
	#print "        <a href=\"calforum.php?id=".$record["id"]."\"><img border=0 src=\"images/forum.gif\" alt=\"[forum]\"></a>\n";
	print "      </td>\n";

	print "    </tr>\n";
	
    }
?>
  </table>
  <p>
  Okay, now that you've marked the
  <span id="count" style="font-size: larger; font-weight: bold; color: #800000;">0</span>
  events you're interested in, here's what you can do with them...
  <h2>List Them on the Screen</h2>
  This lists the full details of each event in the same format as the main
  calendar view, only without the weekly calendar at the top.
  You can print out if you want.
  <div class="form">
    <a class=button href="viewmyfull08.php">Full descriptions</a> exactly like the main calendar view
  </div>
  <h2>Make a PocketMod</h2>
  A PocketMod is a clever way to fold a single sheet of paper to make
  a pocket reference.
  See <a href="http://pocketmod.com/">pocketmod.com</a> for folding
  instructions.
  The following form generates PocketMod pages containing your events.
  If you have too many events or too much detail to fit on a single
  PocketMod sheet, it'll generate multiple sheets which fit together
  to make one thick PocketMod.
  <div class="form">
    Every event includes date, title, time, and address.
    Other options are:<br>
    <form action="viewmypdf08.php">
      <input type=checkbox id="PMprintdescr" name="printdescr" value="yes" onClick="guesspocketmod()">Add a short description of each event<br>
      <input type=checkbox id="PMcontact" name="contact" value="yes" onClick="guesspocketmod()">Add contact info for each event<br>
      <input type=checkbox id="PMmicro" name="micro" value="yes" onClick="guesspocketmod()">Use a smaller font, to squeeze more events onto each sheet<br>
      <input type=checkbox id="PMimage" name="image" value="yes" onClick="guesspocketmod()">Show the poster art on the front page<br>
      <input class="button" type=submit value="Make a PocketMod">
      This should show about <span id="pocketmodguess" style="font-size: larger; font-weight: bold; color: #800000;">38</span> events per sheet.
    </form>
  </div>
  <h2>Share Your List</h2>
  You can share your list with the public, allowing them to merge your event
  list into their event list.
  For example, if you carefully create a list of the costumed rides and want
  to make it easy for other people to add all costumed rides to their lists,
  this is where you'd do that.
  Later, you (or anybody) can update the shared list by submitting a new
  version with the same descriptive name.
  You can also delete the shared list by submitting it without any events.
  <div class="form">
    <form action="viewmy08.php" method="POST" onSubmit="return confirm('Do you really want to share this list with the public?')">
      <strong>Descriptive name:</strong>
      <input type=text id=sharename name=sharename size=30>
      <br><em>The descriptive name should explain what the events have in common</em>
      <br><input type=submit class="button" value="Share This List">
    </form>
  </div>
</div>
<script type="text/javascript">
initcheckboxes();
guesspocketmod();
document.title = "Custom Pedalpalooza 2008 Event List";
</script>
<?php

    include(INCLUDES."/footer.html");
    #ex:set sw=4 it=s:
?>

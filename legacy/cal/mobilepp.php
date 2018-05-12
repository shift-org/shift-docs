<?php
# This is the *MOBILE* view of the Pedalpalooza calendar.  It can be
# called two ways: Without a "date=..." parameter, it returns the whole
# page complete with headers.  With a "date=..." parameter, it returns info
# about the requested date.

date_default_timezone_set('America/Los_Angeles');

include("include/common.php");

# Open the connection to MySQL



# Fetch the events for a given day, and return them as a mysql resource.
function fetchevents($date)
{
    global $conn;
    $day = date("Y-m-d", $date);
    $events = mysql_query("SELECT * FROM calevent, caldaily WHERE calevent.id=caldaily.id AND eventdate=\"${day}\" AND eventstatus<>\"E\" AND eventstatus<>\"S\" AND eventstatus<>\"C\" ORDER BY eventtime", $conn) or die(mysql_error());
    return $events;
}

# Output the details for events.  The events have already been fetched and are
# located in a mysql resource.
function listevents($events)
{
    if (mysql_num_rows($events) == 0)
	print '<em>No events</em>';
    else while ($record = mysql_fetch_array($events)) {
	$eventid = substr($record["eventdate"], -2).'-'.$record['id'];
	print '<div class="event">';
	print   "<a class=\"timetitle\" href=\"#\" onClick='return clickevent(\"$eventid\")'>".hmmpm($record['eventtime']).' '.htmlspecialchars($record['title']).'</a>';
	print   "<div class=\"detail\" id=\"$eventid\">";

	#time
	if ($record['eventduration'] || $record['timedetails']) {
	    if ($record['eventduration']) {
		print hmmpm($record['eventtime']).'-'.endtime($record['eventtime'],$record['eventduration']);
		if ($record['timedetails'])
		    print ', ';
	    }
	    if ($record['timedetails'])
		print htmlspecialchars($record['timedetails']);
	    print '<br />';
	}

	#place
	if ($record['locname'])
	    print htmlspecialchars($record['locname']).', ';
	print htmlspecialchars($record['address']);
	if ($record['locdetails'])
	    print ', '.htmlspecialchars($record['locdetails']);
	print '<br />';

	#description
	print htmlspecialchars($record['printdescr']);
	print '<br />';

	#contact
	$name = htmlspecialchars(ucwords($record["name"]));
	$email = $record["hideemail"] ? "" : htmlspecialchars($record["email"]);
	$email = mangleemail($email);
	$phone = $record["hidephone"] ? "" : htmlspecialchars($record["phone"]);
	$contact = $record["hidecontact"] ? "" : htmlspecialchars($record["contact"]);
	$weburl = $record["weburl"];
	$webname = $record["webname"];
	if ($webname == "" || $_REQUEST["p"] != "")
	    $webname = $weburl;
	$webname = htmlspecialchars($webname);
	print "$name";
	if ($email)
	    print ", $email";
	if ($phone)
	    print ", <a href=\"tel:$phone\">$phone</a>";
	if ($contact)
	    print ", $contact";
	if ($weburl)
	    print ", <a href=\"$weburl\">$webname</a>";
	
	print '</div>'; # class="detail"
	print '</div>'; # class="event"
    }
}

# Special case: If passed a date=... parameter, return only its events.
if ($_REQUEST['date']) {
    # The first line is the id of the <div> into which the data should go
    print $_REQUEST['id']."\n";

    # Fetch the events and return them in HTML format
    $events = fetchevents(strtotime($_REQUEST['date']));
    listevents($events);

    # Don't do the normal page stuff!
    exit(0);
}
####include("include/view.php");
?>
<html>
<head>
  <title>
<?php
print PPNAME.' '.substr(PPSTART, 0, 4);
?>
  </title>
<style type="text/css">
body { margin: 0; padding: 0; background: #ffc969; }
div.today { padding-top: 2px; border-top: 1px solid orange; border-bottom: 2px solid #ffc969; background: url(images/orangecorner.gif) no-repeat;}
div.date { padding-top: 2px; border-top: 1px solid orange; border-bottom: 2px solid #ffc969; background: url(images/oocorner.gif) no-repeat;}
div.dateevents { border-left: 3px solid orange; padding-left: 5px; display: none; }
div.event { }
div.detail { display: none; }
a.date { text-decoration: none; }
a.date:focus { font-size: larger; }
a.timetitle { text-decoration: none; }
a.timetitle:focus { font-size: larger; }
span.clipped { white-space: nowrap; overflow: hidden; }
</style>
<script type="text/JavaScript" src="<?php echo CALURL; ?>js/xmlextras.js"></script>
<script type="text/JavaScript">

// List of pending fetches
var getting = Array();

// Scan getting[] for completed fetches
function gotevents()
{
    for (i = 0; i < getting.length; i++) {
        if (getting[i].readyState == 4) {
	    var text = getting[i].responseText;
	    getting.splice(i, 1);

	    var newline = text.indexOf('\n');
	    var dateid = text.slice(0, newline);
	    var html = text.slice(newline + 1);
	    var div = document.getElementById(dateid);
	    div.innerHTML = html;
	}
    }
}

// When a date is clicked, toggle its visibility
function clickdate(date, dateid)
{
    var div = document.getElementById(dateid);
    if (div.style.display != "block") {
	div.style.display = "block";
	if (div.innerHTML == "") {
	    div.innerHTML = "<img src=\"images/spinner.gif\" alt=\"Fetching data...\" />";
	    var conn = XmlHttp.create();
	    conn.open("GET", "mobilepp.php?date="+date+"&id="+dateid, true);
	    i = getting.push(conn);
	    conn.onreadystatechange = gotevents;
	    conn.send(null);
	}
    } else
	div.style.display = "none";
    return false;
}

// When a time/title is clicked, toggle its visibility
function clickevent(eventid)
{
    var div = document.getElementById(eventid);
    if (div.style.display != "block")
	div.style.display = "block";
    else
	div.style.display = "none";
    return false;
}
</script>
</head>
<body>
  <span class="clipped">Mobile PP!  Click any line to expand/shrink it.</span>
  <br />
<?php
    # for each day...
    $today = strtotime(date("Y-m-d"));
    $tomorrow = $today + 86400;
    $enddate = strtotime(PPEND);
    for ($thisdate = strtotime(PPSTART); $thisdate <= $enddate; $thisdate += 86400) {
	#decide how to output this day
	$dateclass = ($thisdate == $today) ? "today" : "date";
	$dayofweek = date("D", $thisdate);
	$preload = ($thisdate == $today || $thisdate == $tomorrow ||
	  (($dayofweek == 'Sat' || $dayofweek == 'Sun') && $thisdate < $today + 7 * 86400));

	# fetch the events
	$events = fetchevents($thisdate);

	# scan the events for tinytitles to append after the date.  We'll
	# do this in three passes, with the most important first
	$headline = '';
	$len = 0;
	if (mysql_num_rows($events) > 0) {
	    while (($record = mysql_fetch_array($events)) && $len < 80) {
		if ($record['highlight']) {
		    if ($headline) {
			$headline .= ', '.htmlspecialchars($record['tinytitle']);
			$len += 2;
		    } else
			$headline = htmlspecialchars($record['tinytitle']);
		    $len += strlen($record['tinytitle']);
		}
	    }
	    mysql_data_seek($events, 0);
	    while (($record = mysql_fetch_array($events)) && $len < 80) {
		if (!$record['highlight'] && $record['image']) {
		    if ($headline) {
			$headline .= ', '.htmlspecialchars($record['tinytitle']);
			$len += 2;
		    } else
			$headline = htmlspecialchars($record['tinytitle']);
		    $len += strlen($record['tinytitle']);
		}
	    }
	    mysql_data_seek($events, 0);
	    while (($record = mysql_fetch_array($events))) {
		if (!$record['highlight'] && !$record['image']) {
		    if ($headline) {
			$headline .= ', '.htmlspecialchars($record['tinytitle']);
			$len += 2;
		    } else
			$headline = htmlspecialchars($record['tinytitle']);
		    $len += strlen($record['tinytitle']);
		}
	    }
	    mysql_data_seek($events, 0);
	}

	#output the day
	$datestr = date('D M j', $thisdate);
	$datearg = date('Y-m-d', $thisdate);
	$dateid = date("Mj", $thisdate);
	print "<div class=\"$dateclass\">";
	print   '<span class="clipped">';
	print     "<a class=\"date\" href=\"#\" onClick=\"return clickdate('$datearg', '$dateid')\"><strong>$datestr</strong>";
	if ($headline)
	    print ": $headline";
	print     '</a>';
	print   '</span>';
	print   "<div id=\"$dateid\" class=\"dateevents\">";
	if ($preload) {
	    listevents($events);
	}
	print   '</div>';
	print "</div>\n";

	# if today, then output JavaScript code to show today's events and
	# to scroll to today.  (We want to do this as soon as possible when
	# loading the page, since that's what the user probably wants to see.)
	if ($thisdate == $today) {
	    print "<script type=\"text/javascript\">\n";
	    print "clickdate('$datearg', '$dateid');\n";
	    #!!! scroll!
	    print "</script>\n";
	}
    }
?>
<script type="text/JavaScript">
//Preload the "spinner" graphic image
var spinner = new Image();
spinner.src = "images/spinner.gif";
</script>
</body>
</html>
<?php
    #ex:set sw=4 it=s:
?>

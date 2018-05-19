<html>
  <?php
    include("include/repeat.php");
    include("include/repeatdebug.php");
    #include("include/common.php");
    date_default_timezone_set("America/Los_Angeles");
  ?>
  <head>
    <title>Calendar Tester</title>
    <script type="text/javascript" src="<?php echo CALURL; ?>js/xmlextras.js"></script>
    <script type="text/javascript">
	// This is used by verifyaddress() to show the result of verification
	function showverify(result)
	{
	      var field = document.forms.cal.addressverified;
	      var explain = false;
	      var textspan = document.getElementById("verifiedstatus");
	      var text = "";
	      switch (result) {
		  case "":
		      field.value = "X";
		      text = "";
		      break;
		  case "...":
		      field.value = "V";
		      text = "<span style=\"text-decoration: blink;\">Verifying...</span>";
		      break;
		  case "Verified":
		      field.value = "Y";
		      text = "<font color=green>Verified</font>";
		      break;
		  case "Ambiguous":
		      field.value = "A";
		      text = "<font color=red>Ambiguous</font>";
		      explain = 1;
		      break;
		  case "Not Found":
		      field.value = "N";
		      text = "<font color=red>Not Found</font>";
		      explain = 1;
		      break;
		  default:
		      field.value = "X";
		      text = "<font color=red>" + result + "</font>";
		      explain = 1;
		      break;
	      }
	      // If Ambiguous or Not Found, then add a link for explanations
	      if (explain) {
		      text = text + " <a href=\"explain/address.html\" target=\"_BLANK\" onclick=\"window.open('explain/address.html', 'explain', 'width=600, height=500, menubar=no, status=no, location=no, toolbar=no, scrollbars=yes'); return false;\">What this means...</a>";
	      }
	      textspan.innerHTML = text;
	}



  function verifyvenue(value)
  {
	if (value == "") {
	    showverify("");
	} else {
	    // send a request to bycycle to parse this
	    var conn = XmlHttp.create();
	    var url = "vfyvenue.php?locname=" + encodeURIComponent(value);
	    conn.open("GET", url, true);
	    conn.onreadystatechange = function() {
		// if we've received the whole text...
		if (conn.readyState == 4) {
		    dom = XmlDocument.create();
		    dom.loadXML(conn.responseText);

		    // was it recognized?
		    results = dom.getElementsByTagName("result");
		    if (results.length > 0) {
			switch (results[0].firstChild.nodeValue) {
			    case "Verified":
                                // Set both the venue name and the address
				results = dom.getElementsByTagName("locname");
			        document.forms.cal.locname.value = results[0].firstChild.nodeValue;
				results = dom.getElementsByTagName("address");
			        document.forms.cal.address.value = results[0].firstChild.nodeValue;
                                document.forms.cal.addressverified.value = "Y";
                                break;

			    case "Known":
                                // Set the address but not the venue name.  This
                                // is because the venue name hasn't been checked
                                // by the calendar crew yet so it could be bad,
                                // and it's hard for the user to correct a venue
                                // name that came down from the server.
				results = dom.getElementsByTagName("address");
			        document.forms.cal.address.value = results[0].firstChild.nodeValue;
                                document.forms.cal.addressverified.value = "Y";
                                break;

			    case "Unknown":
                                // Leave it as-is.
				break;
			}
		    }
		    showverify("");
		}
	    }
	    showverify("venue...");
	    conn.send(null);
	}
  }

	function vfyaddress(value)
	{
	    conn = XmlHttp.create();
	    url = "vfyaddress.php?address=" + encodeURIComponent(value);
	    conn.open("GET", url, true);
	    conn.onreadystatechange = function() {
		// if we've receive the whole response... */
		if (conn.readyState == 4) {
		    // Parse it.
		    dom = XmlDocument.create();
		    dom.loadXML(conn.responseText);

		    // was it understood?
		    tmp = dom.getElementsByTagName("result");
		    if (tmp.length == 0) {
			showverify("Error");
		    } else {
			showverify(tmp[0].firstChild.nodeValue);

			// if a canonical address and locname was returned,
			// stuff it into the fields.
			tmp = dom.getElementsByTagName("address");
			if (tmp.length != 0) {
			    document.forms.cal.address.value = tmp[0].firstChild.nodeValue;
			}
			tmp = dom.getElementsByTagName("locname");
			if (tmp.length != 0) {
			    document.forms.cal.locname.value = tmp[0].firstChild.nodeValue;
			}

		    }
		}
	    }
	    showverify("...");
	    conn.send(null);
	}
    </script>
  </head>
  <body background="images/owall.gif">
    <h1>Calendar Tester</h1>
    Current date:
<?php
    print date("r U");
    $tm = getdate();
    print "<br>hour=${tm[hours]}";
    print ", date=${tm[0]}, tweaked=";
    print $tm[0]+(12-$tm["hours"])*3600;
    print "\n";
?>
    <p>
    This page contains forms for testing internal functions used by the calendar.
    Other pages of interest are:
    <table width="100%">
      <tr>
        <td><a href="calform.php">Event submission form</a></td>
	<td rowspan=4 align=center valign=middle>
	  Also notice the cool embedded "Today and Tomorrow"<br>
	  calendar on the right side of this page.
	</td>
	<td rowspan=4 align=left valign=middle>
	  <font size="+2">--&gt;</font>
	</td>
	<td rowspan=4 align=right>
	  <?php
	    include("viewtoday.php");
	  ?>
	</td>
      </tr>
      <tr><td><a href="view3week.php">Rolling 3-week view of the calendar</a></td></tr>
      <tr><td><a href="viewmonth.php">Monthly view of the calendar</a></td></tr>
      <tr><td><a href="viewhtml.php">Simple HTML dump of the events</a></td></tr>
      <tr><td><a href="rssfeeds.php">RSS feeds</a></td></tr>
      <tr><td><a href="caladmin.php">Administrator's page</a></td></tr>
    </table>
    <hr>
    <h2>Repeating Date Generator</h2>
      <form action="repeattest.php">
	Repeating Date: <input type=text name=repeat value="<?php print $_REQUEST["repeat"]; ?>">
	<input type=submit>
	<a href="explain/repeathelp.php" target="_BLANK" onclick="window.open('explain/repeathelp.php', 'explain', 'width=600, height=500, menubar=no, status=no, location=no, toolbar=no, scrollbars=yes'); return false;">About dates...</a>
      </form>
<?php
# Test the date repeat functions
if ($_REQUEST["repeat"]) {
	print "<p><h2>Results for '$_REQUEST[repeat]'</h2>";
	$tokens = datetokens($_REQUEST["repeat"]);
	print "<table>";

	print "<tr><td>Tokens:</td><td>[";
	for ($i = 1; $tokens[$i]; $i++)
		print ($i==1?"":", ").tokenstr($tokens[$i]);
	print "]</td></tr>";

	$tokens = datealso($tokens);
	print "<tr><td>Tweaked tokens:</td><td>[";
	for ($i = 1; $tokens[$i]; $i++)
		print ($i==1?"":", ").tokenstr($tokens[$i]);
	print "]</td></tr>";
	

	$rules = daterules($tokens);
	print "<tr><td valign=top>Rules:</td><td>";
	dumprules($rules);
	print "</td><tr>";

	print "<tr><td>String:</td><td>";
	print daterulestr($rules);
	print "</td><tr>";

	print "<tr><td>Canonical:</td><td>";
	print repeatcanonical($rules);
	print "</td><tr>";

	print "<tr><td valign=top>Actual Dates:</td><td>";
	$dates = repeatdates($_REQUEST["repeat"]);
	for ($i = 1; $dates[$i]; $i++) {
	    print $dates[$i]["sqldate"]." ";
	    print date("l, F d, Y", $dates[$i]["timestamp"])."<br>\n";
	}
	print "</td><tr>";
	print "</table>";

}
?>
    <hr>
      <h2>Email mangler</h2>
	<form action="repeattest.php">
	  Email: <input type=text size=40 name="email" value="<?php print $_REQUEST["email"]; ?>">
	  <input type=submit>
	  <a href="calemail.html" target="_BLANK" onclick="window.open('explain/email.html', 'explain', 'width=600, height=500, menubar=no, status=no, location=no, toolbar=no, scrollbars=yes'); return false;">About email...</a>
	</form>
<?php
	if ($_REQUEST["email"]) {
	    print "<h3>Results for '$_REQUEST[email]'</h3>\n";
	    $mangled = mangleemail($_REQUEST["email"]);
	    print "HTML: ".htmlspecialchars($mangled)."<br>\n";
	    print "Displayed as: $mangled\n";
	}
?>
    <hr>
      <h2>ID obscurer</h2>
	Each event has a $id number.  This is public; e.g., it's used as the
	anchor number for each event's long description in the PP calendar.
	However, to edit an event you must pass an obscured version of the
	event number, via an edit=... parameter.  These functions convert
	between the number and obscured edit string.
        <p>
	<form id="obscurer" action="repeattest.php">
	  <table>
	    <tr>
	      <td>Unobscured $id number:</td>
	      <td><input type=text name=id value="<?php print $_REQUEST["id"]; ?>" onchange="document.forms.obscurer.edit.value = '';"></td>
	    </td>
	    <tr>
	      <td align=center><strong>- or -</strong></td>
	    </tr>
	    <tr>
	      <td>Obscured $edit string:</td>
	      <td><input type=text name=edit value="<?php print $_REQUEST["edit"]; ?>" onchange="document.forms.obscurer.id.value = '';"></td>
	      <td><input type=submit></td>
	    </tr>
	  </table>
	</form>
<?php
	if ($_REQUEST["id"]) {
	    print "<h3>Results for \$id='$_REQUEST[id]'</h3>\n";
	    print "\$edit = ".obscure($_REQUEST["id"])."\n";
	}
	if ($_REQUEST["edit"]) {
	    print "<h3>Results for \$edit='$_REQUEST[edit]'</h3>\n";
	    print "\$id = ".unobscure($_REQUEST["edit"])."\n";
	}
?>
    <hr>
      <h2>Venue Address Finder</h2>
      If an event's location is a park or business, then you can enter its
      name and the form will try to look up its address.
      <form id=cal>
	<input type=hidden name=addressverified value="X">
	<table>
	  <tr><td>Venue:</td><td><input type=text size=30 name=locname onChange="verifyvenue(this.value);"></td></tr>
	  <tr><td>Address:</td><td><input type=text size=30 name=address onChange="verifyaddress(this.value);"><span id="verifiedstatus"></span></td></tr>
	</table>
      </form>
  </body>
</html>
<!-- ex: set shiftwidth=4 embedlimit=50000: -->

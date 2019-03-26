<?php
# This is the main event entry/editing form.  It supports the following
# parameters:
#
#	edit=...	The obscured id of an event to edit.  If this parameter
#			is omitted, you'll get the new event form; otherwise
#			you'll get the editing form for the given event.
#
#	form=...	This selects the version of the form to use initially.
#			"form=short" uses the short version, and "form=pp" uses
#			the *palooza version of the form.  Otherwise the
#			long version is used.  The user can change the version
#			by clicking a button at the top of the form.  The
#			same information is returned by the form regardless
#			of the version.

	include("include/common.php");
#	include(INCLUDES."/header.html");
	
	

	# If there's an "edit" parameter, then convert it to $id, retrieve
	# that event, and load its values into the form.
	$chkaudienceG = "checked";
	$thisdates = "";
	$thistime = "";
	$chkrepeatsN = "checked";
	$addressverified = "X";
	$chkemailforum = "checked";
	$chkareaP = "checked";
	$thisdatestype = "";
	$id = isset($_REQUEST['edit']) ? $_REQUEST['edit'] : '';
	if ($id != "")
	{
		$id = unobscure($id);
		$result = mysql_query("SELECT * FROM calevent WHERE id=$id", $conn);
		if ($result && mysql_num_rows($result) > 0)
		{
			$record = mysql_fetch_array($result);

			# remember what the date and time should be
			$thisdates = $record["dates"];
			$thistime = $record["eventtime"];
			switch ($record["datestype"]) {
			    case "O":	$thisdatestype = "one";		break;
			    case "C":	$thisdatestype = "consecutive";	break;
			    case "S":	$thisdatestype = "scattered";	break;
			}

			# checkbox values are easier to initialize if there's a
			# simple variable containing "checked" or ""
			$chkhidephone = $record["hidephone"] ? "checked" : "";
			$chkhideemail = $record["hideemail"] ? "checked" : "";
			$chkemailforum = $record["emailforum"] ? "checked" : "";
			$chkhidecontact = $record["hidecontact"] ? "checked" : "";
			$chkreqdate = $record["reqdate"] ? "checked" : "";
			$chkaudienceF = ($record["audience"]=="F") ? "checked" : "";
			$chkaudienceA = ($record["audience"]=="A") ? "checked" : "";
			$chkaudienceG = ($chkaudienceF || $chkaudienceA) ? "" : "checked";
			$chkrepeatsN = $record["repeats"] ? "" : "checked";
			$chkrepeatsY = $record["repeats"] ? "checked" : "";
			$chkareaP = $record["area"]!="V" ? "checked" : "";
			$chkareaV = $record["area"]=="V" ? "checked" : "";
			$addressverified = $record["addressverified"];

			# print field are selected via a set of flags in the
			# database, but by a single string in the form.
			$printsel = "N";
			$record["printphone"] && $printsel .= "P";
			$record["printemail"] && $printsel .= "E";
			$record["printweburl"] && $printsel .= "W";
			$record["printcontact"] && $printsel .= "C";
		}
		else
		{
			die("No such event");
		}
	}

	# Output a line for the time selector
	function generatetime($time, $label)
	{
		global $thistime;
		$formatted = hmmpm($time);
		$selected = ($time == $thistime) ? "selected" : "";
		print "<option value=\"$time\" $selected>$formatted $label</option>\n";
	}

	# Output a whole <select> clause for selecting dates.
	function generatedates($defdate, $id, $first, $qty)
	{
		global $conn;

		print "<select id='$id' onChange=\"document.getElementById('cal').dates.value = this.value; fix('dates');\">\n";
		print "  <option value=\"\">Choose a date</option>\n";
		$found = false;
		$when = strtotime($first);
		for ($i = 1; $i <= $qty; $i++) {
			$day = date("l, F j", $when);
			$sqldate = date("Y-m-d", $when);
			if ($day == $defdate) {
				$selected = " selected";
				$found = "true";
			} else {
				$selected = "";
			}
			$result = mysql_query("SELECT id FROM caldaily WHERE eventdate=\"$sqldate\" AND eventstatus<>\"C\" AND eventstatus<>\"E\" AND eventstatus<>\"S\"", $conn);
			$count = mysql_num_rows($result);
			if ($count == 0)
			    $count = "";
			else if ($count == 1)
			    $count = " (1 event)";
			else
			    $count = " ($count events)";
			print "<option value=\"$day\"$selected>$day$count</option>\n";
			$when += 86400;
		}
		if ($defdate != "" && !found) {
			print "<option value=\"$defdate\" selected>$defdate</option>\n";
		}
		print "</select>\n";
	}


?>
<script type="text/javascript" language="JavaScript" src="<?php echo CALURL; ?>js/xmlextras.js">
</script>
<script type="text/javascript" language="JavaScript">
    // These are some trivial functions, generated via PHP.  They are
    // all collected here so that little snippets of PHP code won't
    // mess up the syntax coloring of JavaScript code later in this file.
    function areacode() { return "<?php print AREACODE; ?>"; }
    function images() { return "<?php print IMAGES; ?>"; }
    function appendid() {
<?php
	if (isset($_REQUEST["edit"]))
	    print "return \"&id=".unobscure($_REQUEST["edit"])."\";";
	else
	    print "return \"\";";
?>
    }
    function printsel() { return "<?php print $printsel; ?>"; }
    function editparameter() { return "<?php print (isset($_REQUEST['edit']) ? $_REQUEST['edit'] : ''); ?>"; }
    function origdatestype() { return "<?php print $thisdatestype; ?>"; }
    function debugenabled() { return <?php print (!isset($_REQUEST['debug']) || $_REQUEST['debug'] == "") ? 'false' : 'true'; ?>; }
    var oldform = "<?php print (isset($_REQUEST['form']) ? $_REQUEST['form'] : 'long'); ?>";
</script>
<script type="text/javascript" language="JavaScript">
// We need to work around a number of Microsoft bugs.  Let's detect whether
// those bug fixes are necessary...
var microsoftsucks = (navigator.userAgent.indexOf("MSIE") > -1)?true:false;
if (microsoftsucks) {
    temp = navigator.appVersion.split("MSIE");
    temp = parseFloat(temp[1]);
    if (temp >= 7.0)
	microsoftsucks = false; // yeah, well, we'll see...
}

function SetCursorPos(win, textfield, pos)
{
    if (typeof textfield.selectionEnd != "undefined" &&
	typeof textfield.selectionStart != "undefined") {

	// Mozilla directly supports this
	textfield.selectionStart = pos;
	textfield.selectionEnd = pos;

    } else if (win.document.selection && textfield.createTextRange) {
	// IE has textranges. A textfield's textrange encompasses the
	// entire textfield's text by default
	var sel = textfield.createTextRange();

	sel.collapse(true);
	sel.move("character", pos);
	sel.select();
    }
}

function showcalendar(forpp)
{
    window.open(forpp ? PPURL : "view3week.php", "calendar", "");
    return 0;
}

// This is used to make the default eventtime be 7pm... but not until
// the user tries to actually edit that field.
function tweaktime()
{
    var field = document.forms.cal.eventtime;
    if (field.value == "") {
	field.value = "19:00:00";
    }
}

// This is called when the user submits the form, to verify that different
// fields don't clash.  In particular, if the user says "hide email" and
// then includes their email in the print contact info, then it asks for
// confirmation.
//
// Also, it splits the printwho value into its constituent printXXX params.
function doublecheck()
{
    var cal = document.forms.cal;

    // split printwho into a bunch of binary flags
    cal.printemail.value = (cal.printwho.value.indexOf("E") >= 0) ? "Y" : "N";
    cal.printphone.value = (cal.printwho.value.indexOf("P") >= 0) ? "Y" : "N";
    cal.printweburl.value = (cal.printwho.value.indexOf("W") >= 0) ? "Y" : "N";
    cal.printcontact.value = (cal.printwho.value.indexOf("C") >= 0) ? "Y" : "N";

    // look for clashes between "hide" and "print"
    if (cal.hideemail.checked && cal.printemail.value == "Y"
     && !confirm("You've checked the 'Hide Email' box, but you include your email\naddress in the Print Contact Info.  Is this really what you want?")) {
	formversion("long");
	return false;
    }
    if (cal.hidephone.checked && cal.printphone.value == "Y"
     && !confirm("You've checked the 'Hide Phone' box, but you include your phone\nnumber in the Print Contact Info.  Is this really what you want?"))
	return false;
    if (cal.hideemail.checked && cal.printcontact.value == "Y"
     && !confirm("You've checked the 'Hide Other Contact' box, but you include your other\ncontact info in the Print Contact Info.  Is this really what you want?"))
	return false;

    // if descr contains a dollar sign, then printdescr must too
    if (cal.descr.value.indexOf("$") >= 0 && cal.printdescr.value.indexOf("$") < 0) {
	alert("When the description mentions a dollar value, the print description must also mention it.");
	formversion("long");
	cal.printdescr.focus();
	return false;
    }

    // Try to avoid scheduling things during/after MCBF
    var evdate = new Date(cal.dates.value);
    evdate = evdate.toISOString().substr(5, 5);
    var mcbfdate = "<?php print substr(PPEND, 5); ?>";
    if (cal.tinytitle.value != "MCBF"			// not MCBF
     && evdate == mcbfdate				// same day as MCBF
     && cal.eventtime.value >= "12:00:00"		// during MCBF
     && !confirm("Traditionally the Multnomah County Bike Fair is the last event of Pedalpalooza and everybody wants to be there.  Are you sure you want your event to overlap the MCBF?"))
	return false;

    return true;
}

// Adjust the way dates are input.  This varies with the form (the chg
// parameter -- long, short, pp) and whether the current dates value is
// a single date or multiple dates.
function adjustdatesinput(chg)
{
    // Method of date input varies.  Usually it'll be indicated by the
    // form (long uses input text, others use select), but if the dates
    // string is already set to a multi-day value then the select method
    // won't work so we must use "long".
    dateinp = chg;
    if (olddatestype == "consecutive" || olddatestype == "scattered")
	dateinp = "long";

    // find the <select> tag, if any, that we'll be using
    switch (dateinp) {
        case "long":
	    sel = null;
	    break;

        case "short":
	    sel = document.getElementById("selectshort");
	    break;

        case "pp":
	    sel = document.getElementById("selectpp");
	    break;
    }

    // if we want to use a <select> tag, make sure the current date is
    // an option.  If it isn't, then we can't use any <select> tag.
    if (sel != null) {
	idx = -1;
	dates = document.forms.cal.dates.value;
	for (i = 0; i < sel.length && idx < 0; i++) {
	    if (sel.options[i].value == dates)
		idx = i;
	}
	if (idx >= 0)
	    sel.selectedIndex = idx;
	else
	    dateinp = "long";
    }

    // make the correct input be visible
    switch (dateinp) {
        case "long":
	    document.getElementById("dateslong").style.display = "block";
	    document.getElementById("datesshort").style.display = "none";
	    document.getElementById("datespp").style.display = "none";
	    break;

        case "short":
	    document.getElementById("dateslong").style.display = "none";
	    document.getElementById("datesshort").style.display = "block";
	    document.getElementById("datespp").style.display = "none";
	    break;

        case "pp":
	    document.getElementById("dateslong").style.display = "none";
	    document.getElementById("datesshort").style.display = "none";
	    document.getElementById("datespp").style.display = "block";
	    break;
    }
}

function formversion(chg)
{
    oldform = chg;

    // Adjust the buttons
    longbutton = document.getElementById("formatlong");
    shortbutton = document.getElementById("formatshort");
    ppbutton = document.getElementById("formatpp");
    clickedbg = "#ffe889";
    unclickedbg = "#ffc969";
    clickedborder = "medium inset";
    unclickedborder = "medium outset";
    switch (chg) {
	case "long":
	    longbutton.style.background = clickedbg;
	    shortbutton.style.background = unclickedbg;
	    ppbutton.style.background = unclickedbg;
	    longbutton.style.border = clickedborder;
	    shortbutton.style.border = unclickedborder;
	    ppbutton.style.border = unclickedborder;
	    break;

	case "short":
	    longbutton.style.background = unclickedbg;
	    shortbutton.style.background = clickedbg;
	    ppbutton.style.background = unclickedbg;
	    longbutton.style.border = unclickedborder;
	    shortbutton.style.border = clickedborder;
	    ppbutton.style.border = unclickedborder;
	    break;

	case "pp":
	    longbutton.style.background = unclickedbg;
	    shortbutton.style.background = unclickedbg;
	    ppbutton.style.background = clickedbg;
	    longbutton.style.border = unclickedborder;
	    shortbutton.style.border = unclickedborder;
	    ppbutton.style.border = clickedborder;
	    break;
    }

    // Short form hides a lot of rows
    olddisplay = document.getElementById("rowtinytitle").style.display;
    if (chg == "short")
	newdisplay = "none";
    else if (microsoftsucks)
	newdisplay = "inline";
    else
	newdisplay = "table-row";
    document.getElementById("rowtinytitle").style.display = newdisplay;
    document.getElementById("rowprintdescr").style.display = newdisplay;
    document.getElementById("rowimage").style.display = newdisplay;
    document.getElementById("rowlocdetails").style.display = newdisplay;
    document.getElementById("rowarea").style.display = newdisplay;
    document.getElementById("rowduration").style.display = newdisplay;
    document.getElementById("rowtimedetails").style.display = newdisplay;
    document.getElementById("rowphone").style.display = newdisplay;
    document.getElementById("rowweburl").style.display = newdisplay;
    document.getElementById("rowcontact").style.display = newdisplay;
    document.getElementById("rowprintedcontact").style.display = newdisplay;
    if (microsoftsucks) {
	// These numbers have nothing to do with reality
	if (newdisplay == "none" && olddisplay != "none") {
	    document.getElementById("cellwhat").rowSpan -= 2;
	    document.getElementById("cellwhere").rowSpan -= 2;
	    document.getElementById("cellwhen").rowSpan -= 2;
	    document.getElementById("cellwho").rowSpan -= 3;
	} else if (newdisplay != "none" && olddisplay == "none") {
	    document.getElementById("cellwhat").rowSpan += 2;
	    document.getElementById("cellwhere").rowSpan += 2;
	    document.getElementById("cellwhen").rowSpan += 2;
	    document.getElementById("cellwho").rowSpan += 3;
	}
    } else {
	// These numbers reflect the number of hideable rows
	if (newdisplay == "none" && olddisplay != "none") {
	    document.getElementById("cellwhat").rowSpan -= 3;
	    document.getElementById("cellwhere").rowSpan -= 2;
	    document.getElementById("cellwhen").rowSpan -= 2;
	    document.getElementById("cellwho").rowSpan -= 4;
	} else if (newdisplay != "none" && olddisplay == "none") {
	    document.getElementById("cellwhat").rowSpan += 3;
	    document.getElementById("cellwhere").rowSpan += 2;
	    document.getElementById("cellwhen").rowSpan += 2;
	    document.getElementById("cellwho").rowSpan += 4;
	}
    }

    adjustdatesinput(chg);
}
</script>
<script type="text/javascript" language="JavaScript" src="<?php echo CALURL;?>js/calform.js"></script>
<?php
    print "<style type=\"text/css\">\n";
    print "td.section { background: url(".IMAGES."/ootall.gif) no-repeat;  vertical-align: top; padding-top: 0; margin-top: 0}\n";
    print "th.dates { border-bottom: 1px solid yellow; background: url(".IMAGES."/owall.gif);}\n";
    print "</style>\n";
?>
<style type="text/css">
  div.content { background: #ff9a00; }
  div.datelist { border: inset; background: #ffc969; display: none;}
  table.datelist { border: 1px solid yellow ; border-collapse: collapse;}
  tr.changeddate { font-weight: bold; }
  tr.unchangeddate { }
  input.newsflash { color: magenta; background-color: #ffe880; }
  td.lbl { vertical-align: top; }
  td.in {background: #ffe880; }
  input.title { font-size: 20; font-weight: bold; }
  div.preview {border: thin solid black; background: #ffc969; width: 85%; margin: 5; text-align: left;}
  dl.preview { margin: 5; }
  dt.preview { margin-top: 5; font-weight: bold; clear: left; }
  dd.preview { margin-bottom: 10; margin-left: 50; }
  div.clicked { padding: 5px; display: inline; clear: none; cursor: pointer; border: medium inset; background: #ffe889; }
  div.unclicked { padding: 5px; display: inline; clear: none; cursor: pointer; border: medium outset; background: #ffc969; }
</style>
<div class="content">
<center><h1>Event Submission Form</h1>
Many of the fields are optional, but the ones marked with a red
asterisk (<font color=red>*</font>) are mandatory.
<br>
You might want to read through the form first to make sure you have
all the information you need.
<br>You can switch between the Long, Short, and <?php print PPNAME; ?> versions
of this form at any time; no information is lost from the form when
you do that.
<p>
If this is the first time you've offered to lead a ride, <em>Thank you!</em>
We ask that you read the
<a href="rideleadingcomic.html" target="_blank" onClick="document.getElementById('didcomic').checked = true;">Ride Leading Comic</a>
for tips that will help you lead the best ride ever.
<p>
If you have questions about this form, contact
the <a href="/contacts/index.php?eCon=CalCrew">Calendar Crew</a>.
<?php
    # This used to be a link to Shift's support address, but last year that
    # address started receiving a lot of spam -- possibly because a spammer
    # found the "mailto:" link.  It has been replaced by a the /contacts link
    # in the plain HTML line above.
    if (0) {
	print "<a href=\"mailto:";
	print str_replace("@", "%40", SHIFTEMAIL);
	print "\"><strong>";
	#print str_replace("@", "<img src=\"".IMAGES."/at.gif\" alt=\"[at]\" border=0>", SHIFTEMAIL);
	print mangleemail(SHIFTEMAIL);
	print "</strong></a>.\n";
    }
?>
<p>
<div id="formatlong" class="clicked" onClick="formversion('long');" title="Book any day or combination of days, with all features available">Long Version</div>
<div id="formatshort" class="unclicked" onClick="formversion('short');" title="Book near-future days with only the most common features">Short Version</div>
<div id="formatpp" class="unclicked" onClick="formversion('pp');" title="Book during <?php print PPNAME; ?>, with all features available"><?php print PPNAME; ?> Version</div>
</center>
<br>
<form id="cal" action="calsubmit.php" method="POST" enctype="multipart/form-data" onSubmit="return doublecheck();">
  <span id="debug" style="color: blue;"></span>
  <?php
    if (isset($_REQUEST["edit"]) && $_REQUEST['edit'] != '') {
	print "<input type=hidden name=edit value=\"".$_REQUEST['edit']."\">\n";
    }
    if (isset($_REQUEST['reviewdates']) && $_REQUEST['reviewdates'] != "") {
	print "<input type=hidden name=reviewdates value=\"".$_REQUEST['reviewdates']."\">\n";
    }
    print "<table cellpadding=1 border=0 background=\"".IMAGES."/owall.gif\">\n";
  ?>
    <tr>
      <td id="cellwhat" class="section" rowspan=6><font size="+2">WHAT</font></td>
      <td class="lbl"><font color=red>*</font>Event title:</td>
      <td class="in">
	<?php
	    print "<input class=title type=text size=40 name=\"title\" value=\"".htmlspecialchars($record["title"])."\" onchange=\"fix(this.name);\" onmouseup=\"fixdelayed(this.name);\" onkeyup=\"fixdelayed(this.name);\">\n";
	?>
      </td>
    </tr>
    <tr id="rowtinytitle">
      <td class="lbl">Tiny title:</td>
      <td class="in">
	<?php
	    print "<input type=text size=15 name=\"tinytitle\" value=\"".htmlspecialchars($record["tinytitle"])."\" onfocus=\"fix(this.name)\" onkeyup=\"fixdelayed(this.name);\" onchange=\"fix(this.name);\" onmouseup=\"fixdelayed(this.name);\">\n";
	?>
	<br><em>This is used at the top of the online calendar, where all
	    events are listed in a compact grid.  The time and tiny title
	    are shown there; clicking on them takes you to the event's
	    full entry.</em>
      </td>
    </tr>
    <tr>
      <td class="lbl">Audience:</td>
      <td class="in">
	<table>
	  <tr>
	    <?php
	      print "<td valign=top><input type=radio name=\"audience\" value=\"F\" onClick=\"fix(this.name);\" $chkaudienceF></td>\n";
	    ?>
	    <td><strong>Family Friendly.</strong>
		<em>Adults are specifically encouraged to bring their children.</em>
	    </td>
	  </tr>
	  <tr>
	    <?php
	      print "<td valign=top><input type=radio name=\"audience\" value=\"G\" onClick=\"fix(this.name);\" $chkaudienceG></td>\n";
	    ?>
	    <td><strong>General.</strong>
		<em>Mostly intended for adults.
		Well-behaved kids are welcome, but they might be bored.</em>
	    </td>
	  </tr>
	  <tr>
	    <?php
	      print "<td valign=top><input type=radio name=\"audience\" value=\"A\" onClick=\"fix(this.name);\" $chkaudienceA></td>\n";
	    ?>
	    <td><strong>21+ only.</strong>
		<em>Typically this is because the event takes place in a bar.</em>
	    </td>
	  </tr>
	</table>
	<a href="explain/audience.html" target="_BLANK" onclick="window.open('explain/audience.html', 'explain', 'width=600, height=500, menubar=no, status=no, location=no, toolbar=no, scrollbars=yes'); return false;" tabIndex="-1">More about audience...</a>
      </td>
    </tr>
    <tr>
      <td class="lbl"><font color=red>*</font>Description:</td>
      <td class="in">
	<table>
	  <tr>
	    <td rowspan=3>
	      <em>You <strong>MUST LIST FEES</strong> here.  <font size="-1">If you don't mention any fees in the description, then people will assume the event is free.</font></em><br>
	      <textarea name="descr" rows=7 cols=60 onkeyup="fixdelayed(this.name)" onmouseup="fixdelayed(this.name)" onChange="fix(this.name);" onfocus="whoHasFocus=this" onblur="whoHasFocus=null; fix(this.name);"><?php print $record['descr']; ?></textarea>
	    </td>
	    <td>
	      Some other things to mention: Helmet? Pace? Hills? End&nbsp;point?
	    </td>
	  </tr>
	  <tr>
	    <td>
	      <a href="explain/description.html" target="_BLANK" onclick="window.open('explain/description.html', 'explain', 'width=600, height=500, menubar=no, status=no, location=no, toolbar=no, scrollbars=yes'); return false;" tabIndex="-1">More about<br>descriptions...</a>
	    </td>
	  </tr>
	  <tr>
	    <td>
	      <input type=button value="Preview" onClick="fix(this.name); document.getElementById('previewback').focus(); return false;" tabIndex="-1">
	    </td>
	  </tr>
	</table>
      </td>
    </tr>
    <tr id="rowprintdescr">
      <td class="lbl"><font color=red>*</font>Print Description:</td>
      <td class="in">
	<textarea name="printdescr" rows=2 cols=60 onkeyup="fixdelayed(this.name)" onmouseup="fixdelayed(this.name)" onChange="fix(this.name)" onfocus="whoHasFocus=this" onblur="whoHasFocus=null"><?php print $record['printdescr']; ?></textarea>
	<br><em>Please keep it short and simple.
		We have a hard time fitting over 100 events onto a single page
		of newsprint.
		<strong>No special formatting is allowed</strong> due to the
		complexity of laying out the calendar quickly enough to get
		it printed and distributed on time.</em>
      </td>
    </tr>
    <tr id="rowimage">
      <td class="lbl">Image:</td>
      <td class="in">
	<input type=hidden name="MAX_FILE_SIZE" value=153600>
	<?php
	  if ($_REQUEST["edit"] && $record["image"]) {
	    print "<input type=radio name=\"imgchange\" value=\"keep\" checked>Keep <strong>".htmlspecialchars($record["image"])."</strong>\n";
	    print "<br><input type=radio name=\"imgchange\" value=\"change\">Switch to\n";
	    print "<input type=file size=60 name=\"image\" onchange=\"document.forms.cal.imgchange[1].checked = true;\" onclick=\"document.forms.cal.imgchange[1].checked = true;\">\n";
	    print "<br><input type=radio name=\"imgchange\" value=\"delete\">Delete the image\n";
	  } else {
	    print "<input type=file size=60 name=\"image\">\n";
	  }
	?>
	<br><em>This lets you include an image (*.jpg, *.png, or *.gif)
	    in the online calendar's entry describing your event.
	    It should be small -- ideally no more than 200 pixels high,
	    and using no more than 150k bytes.</em>
      </td>
    </tr>

    <tr bgcolor="#ff9a00">
      <td colspan=3 height=3></td>
    </tr>
      
    <tr>
      <td id="cellwhere" class="section" rowspan=4><font size="+2">WHERE</font></td>
      <td class="lbl">Venue Name:</td>
      <td class="in">
	<?php
	  print "<input type=text size=40 name=\"locname\" value=\"".htmlspecialchars($record["locname"])."\" onchange=\"fix(this.name);\" onblur=\"fix(this.name)\" onmouseup=\"fixdelayed(this.name);\" onkeyup=\"fixdelayed(this.name);\">\n";
	?>
	<br><em>If the event's meeting place is a <strong>park</strong>
	or <strong>business</strong>, put its name here.
	Otherwise leave this field blank.
	When you put a value here, the calendar software will try to look up
	an address for that name and fill in the "Address" field below.</em>
      </td>
    </tr>

    <tr>
      <td class="lbl"><font color=red>*</font>Address:</td>
      <td class="in">
	<?php
	  print "<input type=text size=40 name=\"address\" value=\"".htmlspecialchars($record["address"])."\" onchange=\"fix(this.name)\" onblur=\"fix(this.name)\" onkeyup=\"fixdelayed(this.name)\" onmouseup=\"fixdelayed(this.name)\">\n";
	  print "<input type=hidden name=\"addressverified\" value=\"$addressverified\">\n";
	?>
	<span id="verifiedstatus"></span>
	<br><em>Give either a <strong>street address</strong> or
	    <strong>cross streets</strong>.
	    Ideally this value should be parseable by online maps
	    such as</em> <a href="http://maps.google.com/" target="_blank" tabIndex="-1">Google Maps</a>.
	    If you haven't chosen a location yet, just say "TBA" for now.
	    <a href="explain/address.html" target="_BLANK" onclick="window.open('explain/address.html', 'explain', 'width=600, height=500, menubar=no, status=no, location=no, toolbar=no, scrollbars=yes'); return false;" tabIndex="-1">More about addresses...</a>
      </td>
    </tr>
    <tr id="rowlocdetails">
      <td class="lbl">Location details:</td>
      <td class="in">
	<?php
	  print "(<input type=text size=50 onChange=\"fix(this.name);\" name=\"locdetails\" value=\"".htmlspecialchars($record["locdetails"])."\">)\n";
	?>
	<br><em>Optional.
	    This is usually empty, but if you feel the need to add a
	    description such as "near the clock tower", this is the place.</em>
      </td>
    </tr>
    <tr id="rowarea">
      <td class="lbl">Area:</td>
      <td class="in">
	<?php
	  print "<input type=radio onClick=\"previewonline();\" name=\"area\" value=\"P\" $chkareaP>Portland<br>\n";
	  print "<input type=radio onClick=\"previewonline();\" name=\"area\" value=\"V\" $chkareaV>Vancouver\n";
	?>
	<br><em>In the calendar, Vancouver events will be flagged with an
	    icon or otherwise highlighted so Portlanders don't wonder
	    where the heck Esther Short Park is.</em>
	    <a href="explain/area.html" target="_BLANK" onclick="window.open('explain/area.html', 'explain', 'width=600, height=500, menubar=no, status=no, location=no, toolbar=no, scrollbars=yes'); return false;" tabIndex="-1">More about area...</a>
      </td>
    </tr>

    <tr bgcolor="#ff9a00">
      <td colspan=3 height=3></td>
    </tr>
      
    <tr>
      <td id="cellwhen" class="section" rowspan=4><font size="+2">WHEN</font></td>
      <td class="lbl"><font color=red>*</font>Date(s):</td>
      <td class="in">
	<div id="dateslong">
	<?php
	  print "<input type=text size=40 name=\"dates\" value=\"$thisdates\" onChange=\"fix(this.name);\" onBlur=\"fix(this.name);\">";
	?>
	  <button type=button onClick="return showcalendar(false)" tabIndex="-1">View Calendar</button>
	<br><em>You may type in a specific date such as "July 4",
	or a description of a repeating date such as "every Sunday"
	or "second Friday of each month".</em>
	<a href="explain/repeathelp.php" target="_BLANK" onclick="window.open('explain/repeathelp.php', 'explain', 'width=600, height=500, menubar=no, status=no, location=no, toolbar=no, scrollbars=yes'); return false;" tabIndex="-1">More about dates...</a>
	</div>

	<div id="datesshort" style="display: none;">
	  <?php
	    generatedates($thisdates, "selectshort", "today", 45);
	  ?>
	  <button type=button onClick="return showcalendar(false)" tabIndex="-1\">View Calendar</button>
	  <br><em>Choose a date from the pulldown menu.
	  If the date you want isn't listed here, then you'll need to use the
	  "<a href="#" onClick="formversion('long')" tabIndex="-1">long version</a>" of the
	  form which allows you to type in any date or combination of dates.
	  </em>
	</div>

	<div id="datespp" style="display: none;">
	  <?php
	    generatedates($thisdates, "selectpp", PPSTART_MONTHDAY, PPDAYS);
	  ?>
	  <button type=button onClick="return showcalendar(true)" tabIndex="-1\">View Calendar</button>
	  <br><em>Choose a date from the pulldown menu.
	  Because this is the <?php print PPNAME; ?> version of the calendar,
	  only dates during <?php print PPNAME; ?> are listed.
	  To select other dates, you should use either the 
	  "<a href="#" onClick="formversion('long')" tabIndex="-1">long version</a>" or
	  "<a href="#" onClick="formversion('short')" tabIndex="-1">short version</a>" of
	  the form.
	  </em>
	</div>
	<div id="datelist" class="datelist">
	  <!-- The verifydates() function should stuff text in here and
	       make it visible.
	    -->
	</div>
      </td>
    </tr>
    <tr>
      <td class="lbl"><font color=red>*</font>Time:</td>
      <td class="in">
	<select name="eventtime" onfocus="tweaktime()" onchange="fix(this.name)">
	  <option value="">Choose a time</option>
	  <?php
	    generatetime("00:30:00", "Just after midnight");
	    generatetime("01:00:00", "");
	    generatetime("01:30:00", "");
	    generatetime("02:00:00", "");
	    generatetime("02:30:00", "");
	    generatetime("03:00:00", "");
	    generatetime("03:30:00", "");
	    generatetime("04:00:00", "");
	    generatetime("04:30:00", "");
	    generatetime("05:00:00", "");
	    generatetime("05:30:00", "Early morning");
	    generatetime("05:45:00", "");
	    generatetime("06:00:00", "");
	    generatetime("06:15:00", "");
	    generatetime("06:30:00", "");
	    generatetime("06:45:00", "");
	    generatetime("07:00:00", "");
	    generatetime("07:15:00", "");
	    generatetime("07:30:00", "Mid-morning");
	    generatetime("07:45:00", "");
	    generatetime("08:00:00", "");
	    generatetime("08:15:00", "");
	    generatetime("08:30:00", "");
	    generatetime("08:45:00", "");
	    generatetime("09:00:00", "");
	    generatetime("09:15:00", "");
	    generatetime("09:30:00", "");
	    generatetime("09:45:00", "");
	    generatetime("10:00:00", "Late morning");
	    generatetime("10:15:00", "");
	    generatetime("10:30:00", "");
	    generatetime("10:45:00", "");
	    generatetime("11:00:00", "");
	    generatetime("11:15:00", "");
	    generatetime("11:30:00", "");
	    generatetime("11:45:00", "");
	    generatetime("12:00:00", "Noon");
	    generatetime("12:15:00", "");
	    generatetime("12:30:00", "");
	    generatetime("12:45:00", "");
	    generatetime("13:00:00", "");
	    generatetime("13:15:00", "");
	    generatetime("13:30:00", "");
	    generatetime("13:45:00", "");
	    generatetime("14:00:00", "Early Afternoon");
	    generatetime("14:15:00", "");
	    generatetime("14:30:00", "");
	    generatetime("14:45:00", "");
	    generatetime("15:00:00", "");
	    generatetime("15:15:00", "");
	    generatetime("15:30:00", "");
	    generatetime("15:45:00", "");
	    generatetime("16:00:00", "Late Afternoon");
	    generatetime("16:15:00", "");
	    generatetime("16:30:00", "");
	    generatetime("16:45:00", "");
	    generatetime("17:00:00", "");
	    generatetime("17:15:00", "");
	    generatetime("17:30:00", "");
	    generatetime("17:45:00", "");
	    generatetime("18:00:00", "Early Evening");
	    generatetime("18:15:00", "");
	    generatetime("18:30:00", "");
	    generatetime("18:45:00", "");
	    generatetime("19:00:00", "");
	    generatetime("19:15:00", "");
	    generatetime("19:30:00", "");
	    generatetime("19:45:00", "");
	    generatetime("20:00:00", "Mid-Evening");
	    generatetime("20:15:00", "");
	    generatetime("20:30:00", "");
	    generatetime("20:45:00", "");
	    generatetime("21:00:00", "");
	    generatetime("21:15:00", "");
	    generatetime("21:30:00", "");
	    generatetime("21:45:00", "");
	    generatetime("22:00:00", "Late Evening");
	    generatetime("22:15:00", "");
	    generatetime("22:30:00", "");
	    generatetime("22:45:00", "");
	    generatetime("23:00:00", "");
	    generatetime("23:15:00", "");
	    generatetime("23:30:00", "");
	    generatetime("23:45:00", "");
	    generatetime("23:59:00", "Midnight-ish");
	  ?>
	</select>
	<br><em>Within each day, the calendar will list events sorted
	    by this time.  This should generally be the start time of
	    your event.  If your event has multiple times (e.g., a
	    "meet time" and a "ride time"), I suggest you put the first
	    time here and describe the later times in the details field,
	    below.</em>
      </td>
    </tr>
    <tr id="rowduration">
      <td class="lbl">Duration:</td>
      <td class="in">
	<select name=eventduration onChange="previewonline();">
	  <option value="0" <?php if ($record["eventduration"] == 0) print "selected"; ?>>Unspecified</option>
	  <option value="30" <?php if ($record["eventduration"] == 30) print "selected"; ?>>30 minutes</option>
	  <option value="60" <?php if ($record["eventduration"] == 60) print "selected"; ?>>60 minutes</option>
	  <option value="90" <?php if ($record["eventduration"] == 90) print "selected"; ?>>90 minutes</option>
	  <option value="120" <?php if ($record["eventduration"] == 120) print "selected"; ?>>2 hours</option>
	  <option value="150" <?php if ($record["eventduration"] == 150) print "selected"; ?>>2.5 hours</option>
	  <option value="180" <?php if ($record["eventduration"] == 180) print "selected"; ?>>3 hours</option>
	  <option value="240" <?php if ($record["eventduration"] == 240) print "selected"; ?>>4 hours</option>
	  <option value="300" <?php if ($record["eventduration"] == 300) print "selected"; ?>>5 hours</option>
	  <option value="360" <?php if ($record["eventduration"] == 360) print "selected"; ?>>6 hours</option>
	  <option value="480" <?php if ($record["eventduration"] == 480) print "selected"; ?>>8 hours</option>
	  <option value="600" <?php if ($record["eventduration"] == 600) print "selected"; ?>>10 hours</option>
	  <option value="720" <?php if ($record["eventduration"] == 720) print "selected"; ?>>12 hours</option>
	</select>
	<br><em>This is optional, so unless you're pretty confident about when
	    your event will end, I suggest leaving it unspecified.</em>
    </tr>
    <tr id="rowtimedetails">
      <td class="lbl">Time details:</td>
      <td class="in">
	<?php
	  print "<input type=text size=60 onChange=\"previewonline();\" name=\"timedetails\" value=\"".htmlspecialchars($record["timedetails"])."\">\n";
	?>
	<br><em>If you think it's necessary, you can use this to provide
	    more details about your event's time.  Try to keep it short.
	    E.g., "At Midnight we ride!"</em>
      </td>
    </tr>

    <tr bgcolor="#ff9a00">
      <td colspan=3 height=3></td>
    </tr>
      
    <tr>
      <td id="cellwho" class="section" rowspan=6><font size="+2">WHO</font></td>
      <td class="lbl"><font color=red>*</font>Your name:</td>
      <td class="in">
	<?php
	  print "<input type=\"text\" size=40 name=\"name\" value=\"".htmlspecialchars($record["name"])."\" onchange=\"fix(this.name);\" onkeyup=\"fixdelayed(this.name);\" onmouseup=\"fixdelayed(this.name);\">\n";
	?>
	<br><em>The name you supply here will be published in both the
	    printed and online versions of the calendar.
	    If you're shy, make up a name.</em>
      </td>
    </tr>
    <tr id="rowphone">
      <td class="lbl">Your phone number:</td>
      <td class="in">
	<?php
	  print "<input type=\"text\" size=14 name=\"phone\" value=\"".htmlspecialchars($record["phone"])."\" onchange=\"fix(this.name);\">\n";
	  print "<br><input type=\"checkbox\" name=\"hidephone\" value=\"Y\" $chkhidephone onClick=\"previewonline();\" tabIndex=\"-1\">Don't publish my phone number online\n";
	?>
	<br><em>Unless you check the above box, your phone number will
	    be shown in the online calendar.</em>
      </td>
    </tr>
    <tr>
      <td class="lbl"><font color=red>*</font>Your email address:</td>
      <td class="in">
	<?php
	  print "<input type=\"text\" size=40 name=\"email\" value=\"".htmlspecialchars($record["email"])."\" onchange=\"fix(this.name);\" onkeyup=\"fixdelayed(this.name);\" onmouseup=\"fixdelayed(this.name);\" onblur=\"fix(this.name);\">\n";
	  print "<br><input type=\"checkbox\" name=\"emailforum\" value=\"Y\" $chkemailforum tabIndex=\"-1\">Send forum messages to this address\n";
	  print "<br><input type=\"checkbox\" name=\"hideemail\" value=\"Y\" $chkhideemail onClick=\"previewonline();\" tabIndex=\"-1\">Don't publish my email address online\n";
	?>
	<br><em>This must be a valid email address where we can reach you.
	    When you add your event, a confirmation message will be
	    mailed to this address telling you how you can edit it later.
	    <a href="explain/email.html" target="_BLANK" onclick="window.open('explain/email.html', 'explain', 'width=600, height=500, menubar=no, status=no, location=no, toolbar=no, scrollbars=yes'); return false;" tabIndex="-1">More about email...</a>
      </td>
    </tr>
    <tr id="rowweburl">
      <td class="lbl">Your web site:</td>
      <td class="in">
	<table>
	  <?php
	    print "<tr><td>URL:</td><td><input type=\"text\" size=60 name=\"weburl\" value=\"".htmlspecialchars($record["weburl"])."\" onchange=\"fix(this.name);\"></td></tr>\n";
	    print "<tr><td>Name:</td><td><input type=\"text\" size=40 name=\"webname\" value=\"".htmlspecialchars($record["webname"])."\" onfocus=\"fix(this.name);\" onblur=\"fix(this.name);\"></td></tr>\n";
	  ?>
	</table>
      </td>
    </tr>
    <tr id="rowcontact">
      <td class="lbl">Other contact info:</td>
      <td class="in">
	<?php
	  print "<input type=\"text\" size=60 name=\"contact\" value=\"".htmlspecialchars($record["contact"])."\" onchange=\"fix(this.name);\">\n";
	  print "<br><input type=\"checkbox\" name=\"hidecontact\" value=\"Y\" $chkhidecontact onClick=\"previewonline();\" tabIndex=\"-1\">Don't publish this information online\n";
	?>
	<br><em>This can be anything, such as a suggested time of day to
	    call, or where to leave a message, or what coordinates to
	    feed into a radio telescope.
	    Most folks will want to leave this blank.
	<p>Unless you check the "Don't publish" box, the above contact
	    information will be shown in the online calendar.</em>
      </td>
    </tr>
    <tr id="rowprintedcontact">
      <td class="lbl">Printed contact info:</td>
      <td class="in">
	<input type=hidden name=printphone value="<?php print $record["printphone"]?"Y":"N"; ?>">
	<input type=hidden name=printemail value="<?php print $record["printemail"]?"Y":"N"; ?>">
	<input type=hidden name=printweburl value="<?php print $record["printweburl"]?"Y":"N"; ?>">
	<input type=hidden name=printcontact value="<?php print $record["printcontact"]?"Y":"N"; ?>">
	<select name="printwho">
	  <!-- the actual list is generated by tweakprintwho() -->
	  <option value="N">Name</option>
	</select>
	<br><em>The printed calendar has only a limited amount of space for
	    each event, so we must limit the amount of contact info that we
	    show.
	    Please choose which contact information is most important.</em>
      </td>
    </tr> 
    <tr bgcolor="#ff9a00">
      <td colspan=3 height=3></td>
    </tr>

    <?php
	if (isset($_COOKIE[ADMINCOOKIE]) && $_COOKIE[ADMINCOOKIE] == 'bikefun') {
	    print "<tr>\n";
      	    print "<td class=\"section\" rowspan=3><font size=\"+2\">WHY</font></td>\n";
	    print "<td class=\"lbl\">Comment:</td>\n";
	    print "<td class=\"in\">\n";
	    print "<textarea name=\"comment\" rows=3 cols=60></textarea>\n";
	    print "<br><em>If the <strong>calendar crew</strong> changes\n";
	    print "or cancels somebody's event, they should say why here.\n";
	    print "This text will be included in the email message to the\n";
	    print "event organizer.</em>\n";
	    print "</td>\n";
	    print "</tr>\n";

	    print "<tr>\n";
	    print "<td class=\"lbl\">Minor change</td>\n";
	    print "<td class=\"in\">\n";
	    print "<input type=checkbox name=minorchange value=on".(isset($_REQUEST['edit']) ? " checked" : "")."> No email message\n";
	    print "<br><em>If the <strong>calendar crew</strong> changes\n";
	    print "somebody's event and the change is too small to merit an\n";
	    print "email message to the event organizer, then check this box.</em>\n";
	    print "</td>\n";
	    print "</tr>\n";

	    print "<tr>\n";
	    print "<td class=\"lbl\">Highlight</td>\n";
	    print "<td class=\"in\">\n";
	    print "<select name=highlight>\n";
	    print "<option value=\"0\">Normal</option>\n";
	    print "<option value=\"1\"".($record['highlight']?" selected":"").">Highlighted</option>\n";
	    print "</select>\n";
	    print "<br><em>This gives the <strong>calendar crew</strong>\n";
	    print "a way to highlight larger events.\n";
	    print "Saying \"Highlighted\" will cause it to be listed in a\n";
	    print "larger font in the weekly grid at the top of the calendar.\n";
	    print "It may also have other effects.";
	    print "Ideall, you should highlight no more than one event per day.\n";
	    print "</em></td>\n";
	    print "</tr>\n";
	}
    ?>

    <tr>
      <td class="lbl"></td>
      <td class="lbl">Tips for Ride Leaders</td>
      <td class="in" onMouseOver="fix('submit');">
	For tips on making your ride successful, we ask that you read the
	<label for="doingcomic" style="text-decoration: underline; cursor: pointer">Ride Leading Comic</label>
	at least once before submitting an event.
        <br>
	<?php
	  if (isset($_REQUEST['edit'])) {
	    print "<input type=radio name=readcomic value=\"did\" onChange=\"fix('readcomic');\" id=\"didcomic\" checked><label for=\"didcomic\">I have read the Ride Leading Comic</label>\n";
	  } else {
	    print "<input type=radio name=readcomic value=\"did\" onChange=\"fix('readcomic');\" id=\"didcomic\"><label for=\"didcomic\">I have read the Ride Leading Comic</label>\n";
	  }
	?>
	<input type=radio name=readcomic value="doing" onChange="fix('readcomic');" onClick="window.open('rideleadingcomic.html');" id="doingcomic"><label for="doingcomic">I want to read it now!</label>
      </td>
    </tr>
      
    <tr>
      <td class="in" colspan=3 onMouseOver="fix('submit');">
	<?php
	  if (isset($_REQUEST["edit"])) {
	    print "<input id=\"submit\" type=submit name=\"action\" value=\"Update this event\">\n";
	    print "<input type=submit name=\"action\" value=\"Delete this event\" onClick=\"return confirm('Are you sure you want to delete this event?\\n-\\nClicking \\'OK\\' will delete the event, and\\n\\'Cancel\\' will allow you to edit the event.')\">\n";
	    print "<font id=\"hint\" color=\"red\"></font>";
	  } else {
	    print "<input id=\"submit\" type=submit name=\"action\" value=\"Add this event\" disabled>\n";
	    print "<font id=\"hint\" color=\"red\">&lt;-- This button is disabled until you fill in all required fields.</font>";
	  }
	?>
      </td>
    </tr>
  </table>
</form>
<p>
The following is a preview of how your event will appear in the online calendar.
This is only an approximation!
The event's image (if any) isn't displayed in this preview.
Email addresses aren't fully obfuscated.
Links and buttons don't work.
<font size="-1">(For any curious geeks:
These differences are due to the fact that the
actual calendar is formatted on Shift's server by some PHP code, while
this mock-up is formatted in your browser by some JavaScript code.
The JavaScript code doesn't exactly mimic the PHP code.)</font>
<center>
<div id="preview" class="preview">
</div>
<br>
<button id="previewback" onClick="document.forms.cal.title.focus();">Scroll up to title</button>
<button onClick="document.forms.cal.address.focus();">Scroll up to address</button>
<button onClick="document.forms.cal.eventtime.focus();">Scroll up to time</button>
<button onClick="document.forms.cal.descr.focus();">Scroll up to description</button>
<button onClick="document.forms.cal.name.focus();">Scroll up to name</button>
</center>
</div>
<?php
	if (isset($_REQUEST['form']) && ($_REQUEST["form"] == "short" || $_REQUEST["form"] == "pp")) {
		print "<script type=\"text/javascript\">\n";
		print "formversion(\"".$_REQUEST['form']."\");\n";
		print "</script>\n";
	}
?>
<script type="text/javascript">
  tweakprintwho(true);
  tweakdurations();	
  previewonline();
  document.forms.cal.title.focus();
</script>
<?php
	print "<script type=\"text/javascript\">\n";
	print "  verifydates(\"$thisdates\", true);\n";
	if ($addressverified == "V") {
	    print "  verifyaddress(document.forms.cal.address.value);\n";
	}
	print "</script>\n";
#	include(INCLUDES."/footer.html");
#vi:se sw=4:
?>

<?php
	include("include/common.php");
    
	$fields = "dayname(eventdate) as weekday,"
		. "dayofmonth(eventdate) as monthday,"
		. "hour(eventtime) as hour,"
		. "minute(eventtime) as minute,"
		. "eventdate,eventtime,eventduration,name,email,hideemail,phone,hidephone,"
		. "weburl,webname,contact,hidecontact,title,tinytitle,"
		. "audience,printdescr,newsflash,image,imageheight,imagewidth,"
		. "reqdate,timedetails,repeats,address,locdetails,area,"
		. "printphone,printemail,printweburl,printcontact";
	$result = mysql_query("SELECT $fields FROM calendar ORDER BY eventdate,eventtime", $conn) or die(mysql_error());
	$prevdate = "";
	while ($record = mysql_fetch_array($result)) {
		if ($record[eventdate] != $prevdate) {
			if ($prevdate != "")
				print "<hr>\n";
			print "<h2>" . $record[weekday] . " June " . $record[monthday] . "</h2>\n";
			$prevdate = $record[eventdate];
		}
		print "<p><strong>";
		print htmlspecialchars(strtoupper($record[title]));
		if ($record[area] == "V")
			print " (Vancouver)";
		print "</strong><br>\n";
		print "<em>";
		print htmlspecialchars($record[address]);
		if ($record[locdetails] != "") {
			print " (".htmlspecialchars($record[locdetails]).")";
		}
		print ", ";
		print "<br>\n";
		if ($record[eventtime] == "12:00:00")
			$time = "Noon";
		else {
			$time = $record[hour];
			if ($time > 12)
				$time = $time - 12;
			if ($record[minute] >= 1 && $record[minute] <= 9)
				$time = $time . ":0" . $record[minute];
			else if ($record[minute] >= 10)
				$time = $time . ":" . $record[minute];
			if ($record[hour] >= 12)
				$time = $time . "pm";
			else
				$time = $time . "am";
		}
		$time = hmmpm($record[eventtime]);
		print $time;
		if ($record[eventduration] != 0)
			print " - ".endtime($time, $record[eventduration]);
		if ($record[timedetails])
			print ", " . htmlspecialchars($record[timedetails]);
		print "</em>&nbsp;&nbsp;\n";
		print htmlspecialchars($record[printdescr]);
		if ($record[audience] == "F")
			print "\nFamily Friendly.";
		else if ($record[audience] == "A")
			print "\n21+ Only.";
		print " " . htmlspecialchars($record[name]);
		if ($record[printphone] && $record[phone] != "")
			print ", " . htmlspecialchars($record[phone]);
		if ($record[printemail] && $record[email] != "")
			print ", " . htmlspecialchars($record[email]);
		if ($record[printcontact] && $record[contact] != "")
			print ", " . htmlspecialchars($record[contact]);
		if ($record[printweburl] && $record[weburl] != "")
			print ", " . htmlspecialchars($record[weburl]);
		print "\n";
	}
?>

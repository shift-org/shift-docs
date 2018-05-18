<?php
	include("calcommon.php");
	$conn = mysql_connect(DBHOST, DBUSER, DBPASSWORD) or die(mysql_error());
	mysql_select_db(DBDATABASE, $conn) or die(mysql_error());

	# This script sends a plaintext response
	header("Content-type: text/plain");

	# This function outputs a record in comma-separated-values format,
	# with quotes.  It is smart about protecting values within the quotes.
	# If the record is null then it outputs field names instead.
	function csv($record, $fields)
	{
		$names =  explode(",", $fields);
		for ($i = 0; $names[$i]; $i++) {
			if ($i != 0)
				print ',';
			if ($record == null)
				print '"'.$names[$i].'"';
			else if ($record[$names[$i]] != null)
			{
				$f = $record[$names[$i]];
				$f = str_replace('"', '""', $f);
				$f = str_replace("\t", "\\t", $f);
				$f = str_replace("\r", "\\r", $f);
				$f = str_replace("\n", "\\n", $f);
				print '"'.$f.'"';
			}
		}
		print "\n";
	}

	$table = "calforum";
	$fields = "id,modified,organizer,name,subject,body";
	$order = "id,modified";
	$result = mysql_query("SELECT $fields FROM $table ORDER BY $order", $conn) or die(mysql_error());
	csv(null, $fields);
	while ($record = mysql_fetch_array($result)) {
		csv($record, $fields);
	}
?>

<?php
    include('include/options.php');
    calbegin('Options Editor');
?>
    <script type="text/JavaScript">
	/* Stores the original value of an option, before it is edited */
	var oldvalue;

	/* Used for the [+] and [-] buttons for numbers */
        function add(name, delta)
	{
	    var elem = document.getElementsByName(name);
	    elem = elem[0];
	    elem.value = Math.floor(elem.value) + delta;
	    elem.style.background = "white";
	}

	/* Validates a value, using a regular expression */
	function validregex(elem, regex)
	{
	    if (!regex.test(elem.value)) {
		elem.value = oldvalue;
		elem.style.background = "pink";
		return false;
	    }
	    elem.style.background = "white";
	    return true;
	}
    </script>
    <h1>Options Editor</h1>
    <table class="optiontable">
<?php
    $typeall = "string";
    $type = "string";
    $state = "OTHER";
    $linenum = 0;
    $fp = fopen("include/text/optionsdefault.txt", "r") or die("Couldn't open optiondefaults");
    while (($line = fgets($fp)) !== FALSE) {
	$line = trim($line);
	$linenum++;
	if ($line == "")
	    $typeall = $type = "string";
	else if (preg_match("/^([A-Za-z][A-Za-z0-9]*) *= *(.*)/", $line, $matches)) {
	    # assignment
	    $name = $matches[1];
	    $value = $matches[2];
	    if ($state == "LIST")
		print "</ul>\n";
	    if ($state != "OTHER")
		print "</td></tr>\n";
	    $state = "OTHER";
	    print "<tr>\n";
	    print "<td class=\"optionname\" title=\"$type\">$name</td>\n";
	    print "<td class=\"optionequals\">=</td>\n";
	    print "<td class=\"optionvalue\">\n";
	    if ($type == "number") {
		print "<input type=\"text\" class=\"optionnumber\" name=\"$name\" value=\"$value\" onFocus=\"oldvalue='$value'\" onChange=\"validregex(this, /^[0-9]+$/);\">\n";
		print "<input type=\"button\" class=\"optionadd\" value=\"+\" onClick=\"add('$name', 1);\">";
		print "<input type=\"button\" class=\"optionadd\" value=\"&mdash;\" onClick=\"add('$name', -1);\">";
	    } else if ($type == "boolean") {
		print "<select name=\"$name\">\n";
		print "  <option value=\"true\"".($value == "true" ? " selected" : "").">true\n";
		print "  <option value=\"false\"".($value == "false" ? " selected" : "").">false\n";
		print "</select>\n";
	    } else if ($type == "string") {
		print "<input type=\"text\" size=50 name=\"$name\" value=\"".htmlspecialchars($value)."\">\n";
	    } else if ($type == "html") {
		print "<textarea rows=4 columns=60 name=\"$name\">$value</textarea>\n";
	    } else if (substr($type, 0, 1) == "/") {
		print "<input type=\"text\" name=\"$name\" value=\"".htmlspecialchars($value)."\" onFocus=\"oldvalue='$value'\" onChange=\"validregex(this, $type)\">\n";

	    } else if (preg_match("/^\w+\/.*\*/", $type)) {
		$values = glob($type);
		print "<select name=\"$name\">\n";
		foreach ($values as $v)
		    print "  <option value=\"$v\"".($value == $v ? " selected" : "").">$v\n";
		print "</select>\n";
	    } else {
		$values = explode(",", $type);
		print "<select name=\"$name\">\n";
		print "  <option value=\"\"".($value == $v ? " selected" : "").">(none)\n";
		foreach ($values as $v)
		    print "  <option value=\"$v\"".($value == $v ? " selected" : "").">$v\n";
		print "</select>\n";
	    }
	    print "</td>\n";
	    print "</tr>";
	    $type = $typeall;
	} else if (preg_match("/^\s*##/", $line)) {
	    # invisible comment, starts with "##"
	} else if (preg_match("/^\s*#?\s*$/", $line)) {
	    # empty line in a comment
	    if ($state == "OTHER")
		; # No change
	    else {
		if ($state == "LIST")
		    print "</ul>\n";
		$state = "BRK";
	    }
	} else if (preg_match("/^\s*#\s*TYPE\s*(ALL)?:\s*(.*)/", $line, $matches)) {
	    # TYPE or TYPEALL line
	    if ($matches[1] == "ALL")
		$typeall = $matches[2];
	    $type = $matches[2];
	} else if (preg_match("/^\s*#\s*\*\s*(.*)/", $line, $matches)) {
	    # bullet item in a comment
	    if ($state == "OTHER")
		print "<tr><td class=\"optioncomment\" colspan=3>\n";
	    else if ($state == "BRK")
		print "<p>\n";
	    if ($state != "LIST")
		print "<ul>\n";
	    $state = "LIST";
	    #print "<li>".htmlspecialchars($matches[1])."\n";
	    print "<li>".$matches[1]."\n";
	} else if (preg_match("/^\s*#\s*(.*)/", $line, $matches)) {
	    # text line in a comment
	    if ($state == "OTHER")
		print "<tr><td class=\"optioncomment\" colspan=3>\n";
	    else if ($state == "BRK")
		print "<p>\n";
	    if ($state != "LIST")
		$state = "TEXT";
	    #print htmlspecialchars($matches[1])."\n";
	    print $matches[1]."\n";
	} else {
	    # syntax error
	    if ($state == "LIST")
		print "</ul>\n";
	    if ($state != "OTHER")
		print "</td></tr>\n";
	    $state = "OTHER";
	    print "<tr class=\"option\">\n";
	    print "  <td class=\"optionerror\" colspan=3>\n";
	    print "    Syntax error in line $linenum of \"optiondefault\":".htmlspecialchars($line)."\n";
	    print "  </td>\n";
	    print "</tr>\n";
	}
    }
    fclose($fp);
    if ($state == "LIST")
	print "</ul>\n";
    if ($state != "OTHER")
	print "</td></tr>\n";
?>
    </table>
<?php
calend();
?>

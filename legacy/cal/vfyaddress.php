<?php
include("include/common.php");

# Open a connection to the SQL server



# Compare two words, allowing for spelling errors and abbreviations.
# Return 1.0- if perfect, 0.98 if abbreviation, 0.80 if match with a
# typo corrected, or 0.0 if no match.
function cmpword($word1, $word2)
{
    # The easy cases...
    if (!$word1 || !$word2)
	return 0.0;
    if ($word1 == $word2)
	return 1.0;

    # if the shorter string is an abbreviation (ends with ".") then
    # truncate both strings to be the length of the abbreviation without
    # the ".".
    $result = 1.0;
    if (substr($word1, -1) == ".") {
	$word1 = substr($word1, 1, strlen($word1) - 1);
	if (strlen($word2) > strlen($word1))
	    $word2 = substr($word2, 1, strlen($word1));
	$result = 0.98;
    }
    if (substr($word2, -1) == ".") {
	$word2 = substr($word2, 1, strlen($word2) - 1);
	if (strlen($word1) > strlen($word2))
	    $word1 = substr($word1, 1, strlen($word2));
	$result = 0.98;
    }

    # Count the differences in the remaining strings.  If 0 then great!
    # If 1 then reduce the return value by 25%.  Otherwise return 0.0.
    switch (levenshtein($word1, $word2)) {
	case 0:
	    break;

	case 1:
	    $result *= 0.75;
	    break;

	default:
	    $result = 0.0;
    }

    # return the result
    return $result;
}

# Compare to canonized strings, allowing for slop.  If they're identical
# return 100.  A loose match will return a lower value; anything over about
# 75 is probably meant to be a match.
function cmpcanon($canon1, $canon2)
{
    # Split both into words
    $canon1 = explode(" ", $canon1);
    $canon2 = explode(" ", $canon2);

    # Compare words starting from the left, until a mismatch is found
    $result = 100.0;
    $l = 0;
    do {
print "<!-- result=$result canon1[$l]=${canon1[$l]} canon2[$l]=${canon2[$l]} -->\n";
	if (!$canon1[$l] || !$canon2[$l])
	    break;
	$match = cmpword($canon1[$l], $canon2[$l]);
print "<!-- cmpword(\"${canon1[$l]}\", \"${canon2[$l]}\") returned $match -->\n";
	$result *= $match;
	$l++;
    } while ($result > 0.0);

    # Any extra words reduce the result by 10%
    while ($canon1[$l] || $canon2[$l]) {
	$result *= 0.9;
	$l++;
    }

    # Return the result
    return $result;
}

# Scan the database for the best match
function bestaddress($guess)
{
    global $conn;

    # Generate a canonical version of the guess
    $canon = canonize($guess);

    # Get every damn address from the database
    $result = mysql_query("SELECT * FROM caladdress", $conn);
    if (!$result)
	return;

    # Look for the best match
    $bestmatch = 75;
    while ($record = mysql_fetch_array($result)) {
	$match = cmpcanon($canon, $record["canon"]);
print "<!-- cmpcanon(\"$canon\", \"${record[canon]}\") returned $match -->\n";
	if ($match >= $bestmatch) {
	    $bestmatch = $match;
	    $best = $record;
	}
    }

    # Return the best match.  Note that if no address rates at least 75 then
    # $best will be NULL.
    return $best;
}

# Although the built-in fopen() function can handle simple HTTP requests,
# it doesn't deal with response codes other that "200 OK".  This is a
# problem because tripplanner.bycycle.org uses (and abuses) a lot response
# codes for various purposes.  The urlopen() function defined here handles
# those better.
function urlopen($site, $resource, &$status)
{
    # Connect to the server
    $fp = fsockopen($site, 80, $errno, $errstr, 15.0);
    $fp || die ("Error #$errno: $errstr");

    # Construct the request
    $request = "GET $resource HTTP/1.1\r\n";
    $request .= "Host: $site\r\n";
    $request .= "Connection: Close\r\n";
    $request .= "Referrer: http://www.shift2bikes.org/cal/vfyaddress.php\r\n";
    $request .= "User-Agent: Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1)\r\n";
    $request .= "\r\n";

    # Send the request
    fwrite($fp, $request);

    # Read the response header
    $status = "";
    $buffer = fgets($fp);
    if (substr($buffer, -2) == "\r\n")
	    $buffer = substr($buffer, 0, strlen($buffer) - 2);
    while (!feof($fp) && $buffer != "") {
	if (preg_match("/^HTTP\/1\.. /", $buffer))
	    $status = substr($buffer, 9, 3);
	else if (preg_match("/^Location: /i", $buffer) && $status == "302") {
	    fclose($fp);
	    $resource = substr($buffer, 10);
	    return urlopen($site, $resource, $status);
	}
	$buffer = fgets($fp);
	if (substr($buffer, -2) == "\r\n")
		$buffer = substr($buffer, 0, strlen($buffer) - 2);
    }

    # return the file descriptor
    return $fp;
}


function sendresult($result, $addr)
{
    print "<vfyaddress>\n";
    print "  <result>".$result."</result>\n";
    if ($addr) {
	print "  <address>".htmlspecialchars($addr)."</address>\n";
    }
    print "</vfyaddress>\n";
    exit;
}

###############################################################################


# Try asking tripplanner.bycycle.org
$result = "Verified";
$site = "tripplanner.bycycle.org";
$resource = "/?region=portlandor&format=json&q=".urlencode(stripslashes($_REQUEST["address"]));

$fp = urlopen($site, $resource, $status);
if ($status == 300)
    $result = "Ambiguous";
else if ($status == 400)
    $result = "Error";
else if ($status == 404)
    $result = "Not Found";
$addr = "";
$city = "";
$count = 0;
while (!feof($fp) && $result == "Verified") {
    $buffer = fgets($fp);
    if ($addr == "") {
	$tmp = preg_replace('/.*[{,] *"address": *"([^"\\\\]*)\\\\n.*/', '$1', $buffer);
	if ($tmp != $buffer)
	    $addr = trim($tmp);
    }
    if ($city == "") {
	$tmp = preg_replace('/.*"city": "([^"]*)".*/', '$1', $buffer);
	if ($tmp != $buffer)
	    $city = trim($tmp);
    }
    if (preg_match("/multiple matching addresses/i", $buffer)
     || preg_match("/multiple matches found/i", $buffer))
	$result = "Ambiguous";
    else if (preg_match("/could not find address/i", $buffer)
	  || preg_match("/unable to find address/i", $buffer)
	  || preg_match("/could not parse address/i", $buffer))
	$result = "Not Found";
    else if (preg_match("/id=\"error_pane\"/", $buffer)
	    || preg_match("/quot;errors\&quot;: \&quot;\&quot;,/", $buffer))
	{ } # do nothing
    else if (preg_match("/error/i", $buffer))
	$result = "Error";
}
fclose($fp);

# If we found an address, try to clean it up
if ($addr != "") {
    # If intersection and both quadrants are the same, then only keep the first
    $quadrant = preg_replace('/^([NESW][EW]?) .*/', '$1', $addr);
    if ($quadrant != $addr) {
	$addr = preg_replace("/ & $quadrant /", " and ", $addr);
    }

    # append the city unless it is "Portland" and the given address string
    # didn't contain "Portland".
    if ($city != "" && ($city != "Portland" || preg_match("/portland/i", $_REQUEST["address"]))) {
	$addr = "$addr, $city";
    }
}

sendresult($result, $addr);
# vi:se sw=4:
?>

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
	$word1 = substr($word1, 0, strlen($word1) - 1);
	if (strlen($word2) > strlen($word1))
	    $word2 = substr($word2, 0, strlen($word1));
	$result = 0.98;
    }
    if (substr($word2, -1) == ".") {
	$word2 = substr($word2, 0, strlen($word2) - 1);
	if (strlen($word1) > strlen($word2))
	    $word1 = substr($word1, 0, strlen($word2));
	$result = 0.98;
    }

    # Count the differences in the remaining strings.  If 0 then great!
    # If 1 then reduce the return value by 25%.  Otherwise return 0.0.
    $diff = levenshtein($word1, $word2);
    switch ($diff) {
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
	if (!$canon1[$l] || !$canon2[$l])
	    break;
	$match = cmpword($canon1[$l], $canon2[$l]);
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
function bestaddress($guess, $locked)
{
    global $conn;

    # Generate a canonical version of the guess
    $canon = canonize($guess);

    # Get every damn address from the database
    $result = mysql_query("SELECT * FROM caladdress WHERE locked = $locked", $conn);
    if (!$result)
	die(mysql_error());

    # Look for the best match
    $bestmatch = 50;
    while ($record = mysql_fetch_array($result)) {
	$match = cmpcanon($canon, $record["canon"]);
	if ($match >= $bestmatch) {
	    $bestmatch = $match;
	    $best = $record;
	}
    }

    # Return the best match.  Note that if no address rates at least 75 then
    # $best will be NULL.
    return $best;
}

function sendresult($result, $addr)
{
    print "<vfyvenue>\n";
    print "  <result>".$result."</result>\n";
    if ($addr) {
	if ($result == "Verified")
	    print "  <locname>".htmlspecialchars($addr["locname"])."</locname>\n";
	print "  <address>".htmlspecialchars($addr["address"])."</address>\n";
	print "  <area>${addr[area]}</area>\n";
    }
    print "</vfyvenue>\n";
    exit;
}

###############################################################################


# First try looking it up in the database of inspected/approved venues
$addr = bestaddress($_REQUEST["locname"], 1);
if ($addr) {
    sendresult("Verified", $addr);
    exit;
}


# Second try looking it up in the database of user-supplied venues
$addr = bestaddress($_REQUEST["locname"], 0);
if ($addr) {
    sendresult("Known", $addr);
    exit;
}

sendresult("Unknown", null);
?>

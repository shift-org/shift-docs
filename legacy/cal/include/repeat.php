<?php
# This file contains code for parsing repeating event specifications.

# Return an array of tokens extracted from a string.  To simplify later
# expressions, the tokens are converted into a standard form.  The following
# lists the standard form and alternative forms of each word:
#
# first 1st           Sunday syn       January jan    to - through thru
# second 2nd          Monday mon       February feb   except but
# third 3rd           Tuesday tue      March mar      (numbers 1-31)
# fourth 4th forth    Wednesday wed    April apr       
# fifth 5th           Thursday thu     May      
# last                Friday fri       June jun    
#                     Saturday sat     July jul      
#                                      August aug
#                                      September sep
#                                      October oct
#                                      November nov
#                                      December dec
function datetokens($str)
{
    # Start with an empty array for the tokens
    $tokens = array();
    $t = 1;

    # Append a space to $str.  This simplifies processing the last word
    $str .= " ";

    # For each character in $str... 
    $word = "";
    $state = "";
    for ($i = 0; $i < strlen($str); $i++) {
	# Extract the character, and convert to lowercase
	$ch = strtolower(substr($str, $i, 1));

	# If it's a letter...
	if ($ch >= "a" && $ch <= "z"
	|| $ch >= "0" && $ch <= "9" && ($word == "" || is_numeric($word))) {
	    # start a word, or continue one, as appropriate
	    if ($state != "word") {
		$state = "word";
		$word = $ch;
	    } else {
		$word .= $ch;
	    }
	} else {
	    # not in a word.  Did we just end a word?
	    if ($state == "word")
	    {
		# if the word ends in "s" then strip that off
		# so that plurals are recognized
		if (substr($word,-1,1) == "s")
		    $word = substr($word,0,strlen($word) - 1);

		# Only a limited list of words have any meaning
		switch ($word) {
		    case "first": case "1st":
			$tokens[$t++] = array(token=>"week",bit=>1);
			break;
		    case "second": case "2nd":
			$tokens[$t++] = array(token=>"week",bit=>2);
			break;
		    case "third": case "3rd":
			$tokens[$t++] = array(token=>"week",bit=>3);
			break;
		    case "fourth": case "4th": case "forth":
			$tokens[$t++] = array(token=>"week",bit=>4);
			break;
		    case "fifth": case "5th":
			$tokens[$t++] = array(token=>"week",bit=>5);
			break;
		    case "last":
			$tokens[$t++] = array(token=>"week",bit=>6);
			break;
		    case "sunday": case "sun":
			$tokens[$t++] = array(token=>"weekday",bit=>1);
			break;
		    case "monday": case "mon":
			$tokens[$t++] = array(token=>"weekday",bit=>2);
			break;
		    case "tuesday": case "tue":
			$tokens[$t++] = array(token=>"weekday",bit=>3);
			break;
		    case "wednesday": case "wed": case "wedne":
			$tokens[$t++] = array(token=>"weekday",bit=>4);
			break;
		    case "thursday": case "thu": case "thur":
			$tokens[$t++] = array(token=>"weekday",bit=>5);
			break;
		    case "friday": case "fri":
			$tokens[$t++] = array(token=>"weekday",bit=>6);
			break;
		    case "saturday": case "sat": case "satur":
			$tokens[$t++] = array(token=>"weekday",bit=>7);
			break;
		    case "january": case "jan":
			$tokens[$t++] = array(token=>"month",bit=>1);
			break;
		    case "february": case "feb":
			$tokens[$t++] = array(token=>"month",bit=>2);
			break;
		    case "march": case "mar":
			$tokens[$t++] = array(token=>"month",bit=>3);
			break;
		    case "april": case "apr":
			$tokens[$t++] = array(token=>"month",bit=>4);
			break;
		    case "may":
			$tokens[$t++] = array(token=>"month",bit=>5);
			break;
		    case "june": case "jun":
			$tokens[$t++] = array(token=>"month",bit=>6);
			break;
		    case "july": case "jul":
			$tokens[$t++] = array(token=>"month",bit=>7);
			break;
		    case "august": case "aug":
			$tokens[$t++] = array(token=>"month",bit=>8);
			break;
		    case "september": case "sep":
			$tokens[$t++] = array(token=>"month",bit=>9);
			break;
		    case "october": case "oct":
			$tokens[$t++] = array(token=>"month",bit=>10);
			break;
		    case "november": case "nov":
			$tokens[$t++] = array(token=>"month",bit=>11);
			break;
		    case "december": case "dec":
			$tokens[$t++] = array(token=>"month",bit=>12);
			break;
		    case "to": case "through": case "thru":
			$tokens[$t++] = array(token=>"to");
			break;
		    case "except": case "but":
			$tokens[$t++] = array(token=>"except");
			break;
		    case "week":
			$tokens[$t++] = array(token=>"sevendays");
			break;
		    case "day": case "of":
			$tokens[$t++] = array(token=>"of");
			break;
		    default:
			$n = $word + 0;
			if ($ch == "/" && $n >= 1 && $n <= 12) {
			    # 1 ... 12, denoting month of year
			    $tokens[$t++] = array(token=>"month",bit=>$n);
			}
			else if ($n >= 1 && $n <= 31) {
			    # 1 ... 31, denoting days of the month
			    $tokens[$t++] = array(token=>"monthday",bit=>$n);
			}
		}

		# prepare for the next word
		$state = "";
		$word = "";
	    }

	    # The only punctuation we care about (other than ' which
	    # is treated as part of a word) is - which is a synonym
	    # for "to".
	    if ($ch == '-')
		$tokens[$t++] = array(token=>"to");
	}
    }

    return $tokens;
}

# Return a version of $tokens with "also" tokens inserted where needed.
# It also handles the "to" token so later code doesn't need to.
function datealso($tokens)
{
    $fixed = array();
    $f = 1;
    $level = 0;
    $anyweekly = 0;
    for ($i = 1; $tokens[$i]; $i++) {
	# process the tokens
	switch ($tokens[$i]["token"]) {
	    case "week":
		if ($tokens[$i + 1]["token"] == "of") {
			$newlevel = 4;
			break;
		}
		$newlevel = 1;
		break;
	    case "weekday":
		$newlevel = 2;
		break;
	    case "month":
		$newlevel = 3;
		break;
	    case "monthday":
		$newlevel = 4;
		break;
	    case "to":
		if ($i > 1
		 && $tokens[$i + 1]
		 && $tokens[$i - 1]["token"] == "month"
		 && $tokens[$i + 1]["token"] == "month"
		 && $tokens[$i - 1]["bit"] > $tokens[$i + 1]["bit"]) {
		    # range of months, spanning a year
		    for ($j = ($tokens[$i - 1]["bit"] % 12) + 1; $j != $tokens[$i + 1]["bit"]; $j = ($j % 12) + 1)
			$fixed[$f++] = array(token=>$tokens[$i - 1]["token"],bit=>$j);
		} else if ($i > 1
		 && $tokens[$i + 1]
		 && $tokens[$i - 1]["token"] == $tokens[$i + 1]["token"]
		 && $tokens[$i - 1]["bit"]) {
		    # range of a single token: week, weekday, month, or monthday
		    for ($j = $tokens[$i - 1]["bit"] + 1; $j < $tokens[$i + 1]["bit"]; $j++)
			$fixed[$f++] = array(token=>$tokens[$i - 1]["token"],bit=>$j);
		}
		else if ($i > 2
		 && $tokens[$i - 2]["token"] == "month"
		 && $tokens[$i - 1]["token"] == "monthday"
		 && $tokens[$i + 2]
		 && $tokens[$i + 1]["token"] == "month"
		 && $tokens[$i + 2]["token"] == "monthday") {
		    if ($tokens[$i - 2]["bit"] == $tokens[$i + 1]["bit"]) {
			# both in same month, just given in verbose format
			for ($j = $tokens[$i - 1]["bit"] + 1; $j < $tokens[$i + 2]["bit"]; $j++)
			    $fixed[$f++] = array(token=>"monthday",bit=>$j);

			# skip the superfluous month token
			$i++;
		    } else  {
			# range of dates spanning months

			# starting date through end of starting month
			for ($j = $tokens[$i - 1]["bit"] + 1; $j <= datedaysinmonth($tokens[$i - 2]["bit"]); $j++)
			    $fixed[$f++] = array(token=>"monthday",bit=>$j);

			# intervening months
			if (($tokens[$i - 2]["bit"] % 12) + 1 != $tokens[$i + 1]["bit"]) {
			    $fixed[$f++] = array(token=>"also");
			    for ($j = ($tokens[$i - 2]["bit"] % 12) + 1; $j != $tokens[$i + 1]["bit"]; $j = ($j % 12) + 1)
				$fixed[$f++] = array(token=>"month",bit=>$j);
			}

			# ending month through ending date
			$fixed[$f++] = array(token=>"also");
			$fixed[$f++] = $tokens[$i + 1];
			for ($j = 1; $j <= $tokens[$i + 2]["bit"]; $j++)
			    $fixed[$f++] = array(token=>"monthday",bit=>$j);

			# skip the tokens of the end date
			$i += 3;
			$level = 4;
			continue;
		    }
		}
		$newlevel = $level;
		$i++;
		break;
	    case "except":
		$newlevel = 0;
		break;
	    default:
		$newlevel = $level;
	}

	# Usually the level will be the same or grow higher.  The
	# "except" token resets it to 0.  Anything else implies as
	# "also" token.  Consecutive months where the second month
	# is followed by a monthday also implies an "also".
	if ($newlevel != 0 && $newlevel < $level)
	    $fixed[$f++] = array(token=>"also");
	else if ($level == 3 && $newlevel == 3 && is_numeric($tokens[$i + 1]))
	    $fixed[$f++] = array(token=>"also");

	# Copy this token
	if ($newlevel == 4 && $tokens[$i]["token"] == week) {
	    # convert week to monthday (e.g., "1st" to "1")
	    $fixed[$f++] = array(token=>"monthday",bit=>$tokens[$i]["bit"]);
	}
	else if ($tokens[$i] != "of")
	    $fixed[$f++] = $tokens[$i];

	# Prepare for next token
	$level = $newlevel;
	if ($level == 0)
	    $anyweekly = 0;
	else if ($level == 1 || $level == 2)
	    $anyweekly = 1;
    }
    return $fixed;
}

# Given a list of tokens, return a daterules array
function daterules($tokens, $start = 1)
{
    for ($i = $start; $tokens[$i]; $i++) {
	switch ($tokens[$i]["token"]) {
	    case "week":
	    case "weekday":
	    case "month":
	    case "monthday":
		$rules[$tokens[$i]["token"]][$tokens[$i]["bit"]] = 1;
		break;
	    case "also":
		$rules["also"] = daterules($tokens, $i + 1);
		if ($rules["also"]["except"]) {
		    $rules["except"] = $rules["also"]["except"];
		    unset($rules["also"]["except"]);
		}
		return $rules;
	    case "except":
		$rules["except"] = daterules($tokens, $i + 1);
		return $rules;
	}
    }

    return $rules;
}


# Convert the date rules to a string
function daterulestr($rules)
{
    $str = "";
    $str = daterulehelp($str, $rules, "week", 6);	
    $str = daterulehelp($str, $rules, "weekday", 7);
    $str = daterulehelp($str, $rules, "month", 12);
    $str = daterulehelp($str, $rules, "monthday", 31);
    if ($rules["also"])
    {
	$str .= ",0,";
	$str .= daterulestr($rules["also"]);
    }
    if ($rules["except"])
    {
	$str .= ",1,";
	$str .= daterulestr($rules["except"]);
    }
    return $str;
}
function daterulehelp($str, $rules, $name, $limit)
{
    $bit = 1;
    $number = 0;
    for ($i = 1; $i <= $limit; $i++) {
	if ($rules[$name][$i]) {
	    $number += $bit;
	}
	$bit *= 2;
    }
    if ($str != "")
	$str .= ",";
    $str .= $number;
    return $str;
}

# check whether a given date meets a given set of rules
function dateinstance($rules, $timestamp)
{
    # break the date down into week, weekday, month, and monthday
    $tm = getdate($timestamp);
    $tm["wd"] = $tm["wday"] + 1;
    $tm["wk"] = floor(($tm["mday"] - 1) / 7) + 1;

    # reject if no "also" clause matches */
    if (!dateinstancehelp($rules, $tm))
	return 0;

    # reject if any "except" clause matches */
    if ($rules["except"] && dateinstancehelp($rules["except"], $tm))
	return 0;

    # it looks good
    return 1;
}
function dateinstancehelp($rules, $tm)
{
    # if there are any "also" clauses and any of them match, then
    # that's all we care about.  We can skip testing the first clause.
    if ($rules["also"] && dateinstancehelp($rules["also"], $tm))
	return 1;

    # look for any field that clashes with a rule in this clause
    if ($rules["week"]) {
	# "last" week requires extra logic
	$dim = datedaysinmonth($tm["mon"], $tm["year"]);
	if (!$rules["week"][$tm["wk"]]
	 && (!$rules["week"][6] || $tm["mday"] < $dim - 6))
	   return 0;
    }
    if ($rules["weekday"] && !$rules["weekday"][$tm["wd"]])
	return 0;
    if ($rules["month"] && !$rules["month"][$tm["mon"]])
	return 0;
    if ($rules["monthday"] && !$rules["monthday"][$tm["mday"]])
	return 0;

    # looks good
    return 1;
}


# Return the number of days in a given month
function datedaysinmonth($month,$year = null)
{
    # year is optional.  If omitted, guess it
    if (!$year) {
	$tm = getdate($now);
	if ($month > $tm["mon"])
	    $year = $tm["year"];
	else
	    $year = $tm["year"] + 1;
    }

    # look up the number of days in the month
    switch ($month) {
        case 2: # February - 28 or 29 days
	    return ($year % 4 == 0) ? 29 : 28;
        case 4: # April, June, September, November - 30 days
        case 6:
        case 9:
        case 11:
	    return 30;
	default: # Any other month - 31 days
	    return 31;
    }
}


# Return a string composed of elements of $names[] where $rules[] is 1.
# If there's a span use a hyphen, otherwise insert "and" before the last
function repeatcanonhelp($rule, $names)
{
    # if no rule, return ""
    if (!$rule)
	return "";

    # build the string
    $list = "";
    $last = "";
    for ($i = 1; $names[$i]; $i++) {
	if ($rule[$i]) {
	    # Add previous item to the list, if any
	    if ($last)
		$list = $last . " ";

	    # is this the start of a span of at least 3 elements?
	    if ($names[$i + 2] && $rule[$i + 1] && $rule[$i + 2]) {
		# yes -- combine the span's endpoints
		for ($j = $i + 2; $rule[$j + 1] && $names[$j + 1]; $j++) {
		}
		$last = $names[$i] . " - " . $names[$j];
		$i = $j;
	    } else {
		# single item
		$last = $names[$i];
	    }
	}
    }
    if ($last) {
	if ($list)
	    $list .= "and " . $last;
	else
	    $list = $last;
    }

    return $list;
}


# Return a canonical string for a given set of rules.  The canonical string
# is a human-readable string that looks pretty, but means the same as whatever
# the user submitted.
function repeatcanonical($rules)
{
    $weeknames = array(1 => "First", "Second", "Third", "Fourth", "Fifth",
			    "Last");
    $weekdaynames = array(1 => "Sunday", "Monday", "Tuesday", "Wednesday",
			    "Thursday", "Friday", "Saturday");
    $monthnames = array(1 => "January", "February", "March", "April", "May",
			    "June", "July", "August", "September", "October",
			    "November", "December");
    $monthdaynames = array(1 => 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
			    15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27,
			    28, 29, 30, 31);

    # decode each field separately
    $week = repeatcanonhelp($rules["week"], $weeknames);
    $weekday = repeatcanonhelp($rules["weekday"], $weekdaynames);
    $month = repeatcanonhelp($rules["month"], $monthnames);
    $monthday = repeatcanonhelp($rules["monthday"], $monthdaynames);

    # if some fields are missing but English needs them to avoid sounding	    # nonsensical, then use generic values.
    if (!$rules["week"] && $rules["weekday"])
	$week = "Every";
    if ($rules["week"] && !$rules["weekday"])
	$weekday = "week of";
    else if ($rules["weekday"] && $rules["month"])
	$weekday .= " in";
    if ($rules["week"] && !$rules["month"])
	$month = "of every month";

    # combine the fields, in way that looks pretty in English
    $canonical = trim("$week $weekday $month $monthday");
    $canonical = str_replace("  ", " ", $canonical);
    $canonical = str_replace("  ", " ", $canonical);
    $canonical = str_replace("  ", " ", $canonical);

    # if there's an "also" clause, append it with a comma
    if ($rules["also"]) {
	$also = repeatcanonical($rules["also"]);
	$also = str_replace("Every ", "every ", $also);
	$also = str_replace("First ", "first ", $also);
	$also = str_replace("Second ", "Second ", $also);
	$also = str_replace("Third ", "third ", $also);
	$also = str_replace("Fourth ", "fourth ", $also);
	$also = str_replace("Fifth ", "fifth ", $also);
	$also = str_replace("Last ", "last ", $also);
	$canonical .= ", " . $also;
    }

    # if there's an "except" clause, append it with the word "except"
    if ($rules["except"]) {
	$except = repeatcanonical($rules["except"]);
	$except = str_replace("Every ", "", $except);
	$except = str_replace("every ", "", $except);
	$except = str_replace("First ", "first ", $except);
	$except = str_replace("Second ", "Second ", $except);
	$except = str_replace("Third ", "third ", $except);
	$except = str_replace("Fourth ", "fourth ", $except);
	$except = str_replace("Fifth ", "fifth ", $except);
	$except = str_replace("Last ", "last ", $except);
	$canonical .= " except " . $except;
    }

    return $canonical;
}


# Return a list of days matching a given date string
function repeatdates($str)
{
	# Create an empty array
	$daylist = array();
	$d = 1;

	# Parse the dates
	$tokens = datetokens($str);
	$tokens = datealso($tokens);
	$rules = daterules($tokens);

	# Scan actual dates, starting with today and going forward 364 days
	# or until a 180 gap is detected, looking for days that meet the
	# parsed requirements.
	$date = time();
	$tm = getdate($date);
	$date += (12 - $tm["hours"]) * 3600; # Roughly noon today
	for ($gap=-999, $i = 0; $gap < 180 && $i < 365; $i++) {
	    if (dateinstance($rules, $date)) {
		# Found one!  Append it to the list.
		$daylist[$d++] = array(timestamp=>$date, sqldate=>date("Y-m-d", $date), status=>"Added", newdate=>"Y", suffix=>date("Mj", $date));
		$gap = 0;
	    } else
		$gap++;
	    $date += 86400;
	}

	# derive a canonical string
	if ($d == 1) {
	    # for invalid strings, use it unchanged
	    $canonical = $str;
	    $datestype = "error";
	} else if ($d == 2) {
	    # for single date, use a pretty form of that date
	    $canonical = date("l, F j", $daylist[1]["timestamp"]);
	    $datestype = "one";
	} else if ($d > 2){
	    # for multiple days, check to see if consecutive.
	    for ($i = 1; $i < $d - 1 && $daylist[$i]["timestamp"] > $daylist[$i + 1]["timestamp"] - 99999; $i++) {
	    }
	    if ($i == $d - 1) {
		# Consecutive -- express it as a range of dates
		$canonical = date("F j", $daylist[1]["timestamp"]) . " - ";
		if (substr($daylist[2]["sqldate"],1,7) == substr($daylist[$d-1]["sqldate"],1,7))
		    $canonical .= date("j", $daylist[$d - 1]["timestamp"]);
		else
		    $canonical .= date("F j", $daylist[$d - 1]["timestamp"]);
		$datestype = "consecutive";
	    } else {
		# Not consecutive -- decode the rule
		$canonical = repeatcanonical($rules);
		$datestype = "scattered";
	    }
	}

	# Stuff the canonical string and datestype into the returned array too
	$daylist["canonical"] = $canonical;
	$daylist["datestype"] = $datestype;

	return $daylist;
}

# This stores a list of events in any given page which are repeats.  It is
# used by the repeatfirstinstance() function.
$repeatinstances = array();

# This function checks an event against a list, and returns NULL if it is
# either not a repeating event or is the first instance of that event shown
# on this page, or the an array containing ["id"] and ["date"] fields as
# taken from the caldaily table.  You can also optionally pass a prettier
# version of the date.  The $event parameter must contain at least those
# two fields, plus the datestype field from the calenvent table.
function repeatfirstinstance($event, $prettydate = NULL)
{
    global $repeatinstances;

    # Don't worry about one-day events
    if ($event["datestype"] == "O")
	return NULL;

    # scan for it in the array
    for ($i = 0; $repeatinstances[$i]["id"]; $i++) {
	if ($repeatinstances[$i]["id"] == $event["id"])
	    return $repeatinstances[$i];
    }

    # not found - this is first instance
    $repeatinstances[$i] = array(id => $event["id"], date => $prettydate ? $prettydate : $event["eventdate"]);
    return NULL;
}
#ex:set shiftwidth=4 embedlimit=50000:
?>

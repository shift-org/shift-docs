<?php
# This file contains some functions which may be helpful when debugging
# the repeating date parser.  That parser resides in repeat.php.

# Convert a token to a string
function tokenstr($token)
{
    switch ($token["token"]) {
	case "week":
	    switch ($token["bit"]) {
		case 1:	return "first";
		case 2: return "second";
		case 3: return "third";
		case 4: return "fourth";
		case 5: return "fifth";
		case 6: return "last";
		default: return "week-${token[bit]}";
	    }
	    break;
	case "weekday":
	    switch ($token["bit"]) {
		case 1:	return "Sunday";
		case 2: return "Monday";
		case 3: return "Tuesday";
		case 4: return "Wednesday";
		case 5:	return "Thursday";
		case 6:	return "Friday";
		case 7:	return "Saturday";
		default: return "weekday-${token[bit]}";
	    }
	    break;
	case "month":
	    switch ($token["bit"]) {
		case 1: return "January";
		case 2: return "February";
		case 3: return "March";
		case 4: return "April";
		case 5: return "May";
		case 6: return "June";
		case 7: return "July";
		case 8: return "August";
		case 9: return "September";
		case 10: return "October";
		case 11: return "November";
		case 12: return "December";
		default: return "month-${token[bit]}";
	    }
	    break;
	case "monthday":
		return $token["bit"];
	    break;
	default:
	    return $token["token"];
    }
}



# Output an array
function dumphelp($rules, $name, $limit)
{
	if ($rules[$name])
	{
		print "$name = [";
		for ($i = 1; $i <= $limit; $i++)
			print ($i==1 ? "" : ",").($rules[$name][$i] ? 1 : 0);
		print "]<br>";
	}
}

# Output the fields in the $rules array
function dumprules($rules)
{
	dumphelp($rules, "week", 6);
	dumphelp($rules, "weekday", 7);
	dumphelp($rules, "month", 12);
	dumphelp($rules, "monthday", 31);
	if ($rules["also"])
	{
		print "<strong>also</strong><br>";
		dumprules($rules["also"]);
	}
	if ($rules["except"])
	{
		print "<strong>except</strong><br>";
		dumprules($rules["except"]);
	}
}

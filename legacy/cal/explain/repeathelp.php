<html>
  <?php
    include("../include/common.php");
    include("../include/repeat.php");
  ?>
  <head>
    <title>How To Enter Dates</title>
    <style type="text/css">
	td.example { font-family: helvetica; font-size: small; }
    </style>
  </head>
  <script type="text/javascript">
    closeonclick = true;
  </script>
  <body background="../images/owall.gif" onclick="if (closeonclick) window.close(); closeonclick = true;" onload="if (document.forms.tryit.repeat.value != '') document.forms.tryit.repeat.focus();" title="Click to Close">
    <h1>How To Enter Dates</h1>
    To enter a single date, give the month name and the day of the month,
    such as "July 4".
    For multi-day events, you can give a range of dates such as "June 7-23"
    or "August 27- September 3".
    For repeating events, you can give a more complex rule such as "first
    and third Wednesdays", optionally followed by a date range or exceptions. 
    <h2>Examples</h2>
    <table valign=top>
      <tr><td class="example">July 4</td><td>The fourth of July.</td></tr>
      <tr><td class="example">oct 31</td><td>Halloween</td></tr>
      <tr><td class="example">june 10-26</td><td>June 10th through June 26th</td></tr>
      <tr><td class="example">August 27 - September 3</td><td>The week spanning August and September</td></tr>
      <tr><td class="example">June - August</td><td>The summer months</td></tr>
      <tr><td class="example">last Thursday</td><td>The last Thursday of each month</td></tr>
      <tr><td class="example">fourth Thursday in November</td><td>Thanksgiving</td></tr>
      <tr><td class="example">first and third Wednesdays</td><td>The first and third Wednesdays of each month</td></tr>
      <tr><td class="example">last thurs jun-sep</td><td>The last Thursdays of June, July, August, and September</td></tr>
      <tr><td class="example">first and third Wednesdays except in June</td><td>The first and third Wednesdays of each month, except in June</td></tr>
    </table>
    <h2>Try it yourself</h2>
    <form id="tryit" action="repeathelp.php">
      <table>
        <tr>
          <td align=right>Single date,<br>Range of dates, or<br>Repeating date rule</td>
	  <td style="font-size: xx-large;">:&nbsp;</td>
          <td>
	    <input type=text size=30 name=repeat value="<?php print $_REQUEST["repeat"]; ?>" onclick="closeonclick = false;">
            <br><input type=submit onclick = "closeonclick = false;">
            <input type=reset onclick="closeonclick = false; document.forms.tryit.repeat.value=''; return false;">
	  </td>
	</tr>
      </table>
    </form>
<?php
    # Test the date repeat functions
if ($_REQUEST["repeat"]) {
	print "    <div style=\"margin-left: 40;\">\n";
	print "      <strong>Results for '$_REQUEST[repeat]'</strong>\n";
	$dates = repeatdates($_REQUEST["repeat"]);
	if ($dates["canonical"])
	    print "      <br>Parsed as \"${dates[canonical]}\"";
	for ($i = 1; $dates[$i]; $i++) 
	    print "      <br>".date("l, F d, Y", $dates[$i]["timestamp"])."\n";
	print "      <br> == ".(count($dates)-2)." day(s)";
	if ($dates['datestype'])
		print ' - '.$dates['datestype']." days";
	print " ==\n";
	print "    </div>\n";
}
?>
    <h2>Detailed description</h2>
    The date syntax is intended to be intuitive and forgiving.
    Usually if you type in something that sounds right to you, the
    calendar system will understand it too.
    But of course the computer uses rules to guide how it interprets the
    date text.
    The following section describes these rules.
    This is only of interest to computer science geeks and possibly to
    somebody who's trying to compose a complex repeating event rule.
    <p>
    Any words that you type in are classified first as being
    a week ("first"-"fifth" or "last"),
    a weekday ("Sunday"-"Saturday"),
    a month ("January"-"December"), or
    a day of the month ("1" - "31").
    A few other special words such as "through" and "except" are also
    detected.
    Most of these special words allow abbreviations and synonyms.
    Anything else is ignored.
    <p>
    The words are then grouped into clauses, where each clause consists of
    a list of zero or more weeks, then zero or more weekdays, then zero or more
    months, and finally zero or more days of the month.
    They must appear in that order; any deviation from that order marks the
    end of one clause and the start of another.
    For example, "June 7 Thursday" is divided into the clauses "June 7" and
    "Thursday".
    <p>
    The word "to" (or its synonyms, such as "-" and "through") is replaced
    by a list of the actual in the range.
    For example, in "first - third Mondays", the "-" is replaced by "second".
    <p>
    There's also some special logic for date ranges that span months, such as
    "August 27 - September 3".
    This logic is limited, though, in that it can't handle clauses that involve
    weeks or weekdays; for example, "last Thursday June 20 - September 21"
    doesn't work.  (But "Last Thursday June-September" does work because
    "June-September" doesn't need the complex, limited logic.)
    <p>
    A given day is considered to "match" a clause if it doesn't violate any
    of the non-empty lists for week, weekday, month, or month-day.
    For example, if the clause is "first and third wednesdays" then a date
    will match if it is in the first or third week of the month, and it is
    a Wednesday.
    Since this particular clause didn't mention months or month-days,
    those won't play a role in the matching.
    <p>
    All of the clauses are merged together.
    A day is included in the event if it matches any of the clauses.
    <p>
    You can also have the word "except" (or "but") followed by more clauses.
    If you do this, then a day must also <strong>not</strong> be in any of
    the "except" clauses, to be included in the event.
    <p>
    Once the match rules and exception rules are established, the code loops
    through all days starting with today and extending forward either 365 days,
    or until a 180-day (or longer) gap is detected between days, whichever
    comes first.  Each day is tested against the match/exception rules, and
    if it looks good then it is added to the matching list.
    <p>
    The gap rule is added because if you say something occurs in July, and
    the current month <em>is</em> July, then you probably don't mean one week
    now and three weeks a year from now.
  </body>
</html>

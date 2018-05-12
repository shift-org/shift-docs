<?php
# This fetches calendar data from Portland Wheelmen Touring Club.
header('Content-type: text/plain');
include('include/feedin.php');
define('RSSFEED', 'http://www.pwtc.com/calendar/rss');
define('SOURCE', 'www.pwtc.com');

# Read the RSS from PWTC's calendar, and parse it.
libxml_use_internal_errors(FALSE);
$rssdata = simplexml_load_file(RSSFEED);
if (!$rssdata)
    fail('Could not load data from '.RSSFEED);

# We'll be constructing an array of PHP objects which resemble calevent
# records, except that each one will also contain an array of caldaily
# records.  Start the array now.
$cal = array();

# Convert times from "h:mmpm" to "hh:mm:00"
function hhmmss($hmmpm)
{
    $ampm = substr($hmmpm, -2);preg_replace('/.*([AaPp][Mm])$/', '$1', $hmmpm);
    $hhmm = explode(':', substr($hmmpm, 0, -2));
    $mm = $hhmm[1];
    $hh = (int)$hhmm[0];
    if (strtolower($ampm) == 'pm') {
	$hh += 12;
    }
    $hourmap = array('0?', '01', '02', '03', '04', '05', '06', '07', '08',
		     '09', '10', '11', '00', '13', '14', '15', '16', '17',
		     '18', '19', '20', '21', '22', '23', '12');
    $hh = $hourmap[$hh];
    return "$hh:$mm:00";
}

# Convert dates from "Month D, YYYY" to "YYYY-MM-DD"
function yyyymmdd($monthdyyyy)
{
    $d = explode(' ', $monthdyyyy);
    $d[1] = str_replace(',', '', $d[1]);
    if (strlen($d[1]) == 1)
	$d[1] = '0'.$d[1];
    switch ($d[0]) {
	case 'January':	    $d = $d[2].'-01-'.$d[1];	break;
	case 'February':    $d = $d[2].'-02-'.$d[1];	break;
	case 'March':	    $d = $d[2].'-03-'.$d[1];	break;
	case 'April':	    $d = $d[2].'-04-'.$d[1];	break;
	case 'May':	    $d = $d[2].'-05-'.$d[1];	break;
	case 'June':	    $d = $d[2].'-06-'.$d[1];	break;
	case 'July':	    $d = $d[2].'-07-'.$d[1];	break;
	case 'August':	    $d = $d[2].'-08-'.$d[1];	break;
	case 'September':   $d = $d[2].'-09-'.$d[1];	break;
	case 'October':	    $d = $d[2].'-10-'.$d[1];	break;
	case 'November':    $d = $d[2].'-11-'.$d[1];	break;
	case 'December':    $d = $d[2].'-12-'.$d[1];	break;
    }
    return $d;
}

# For each item in the RSS feed...
foreach ($rssdata->channel->item as $item) {
    # Skip if not an event
    if ($item->category != 'Event')
	continue;

    # Start building a record for this event
    $thisevent = array();
    $thisevent['caldaily'] = array();
    $thisevent['title'] = ucwords(strtolower(trim($item->title)));
    $thisevent['weburl'] = $item->link;
    $thisevent['webname'] = 'PWTC listing';
    $thisevent['audience'] = 'G'; # General
    $thisevent['image'] = 'pwtc.png';
    $thisevent['source'] = SOURCE;
    $thisevent['external'] = $item->link;
    print($thisevent['title']."\n");
    print("\texternal=".$thisevent['external']."\n");

    # Much of the information we need is buried in the description.  This is
    # XHTML, but unfortunately SimpleXML doesn't seem capable of parsing it.
    # I'll have to treat it as a simple string and use other techniques.
    $desc = preg_replace('/&nbsp;/', ' ', (string)$item->description);

    # Distance is usually given at the start of the first paragraph, but not
    # always.  We need to search everywhere.
    $distance = preg_replace('/.*Distance:? ([0-9][-0-9a-zA-Z ,\/]*).*/is', '$1', $desc);
    if (strlen($distance) > 17)
	$distance = '';
    print("\tdistance=$distance\n");

    # Ride type is not standardized at all.
    if (preg_match('/non[- ]?group.ride/i', $desc))
	$ridetype = 'non-group ride';
    else if (preg_match('/re[- ]?group.ride/i', $desc))
	$ridetype = 're-group ride';
    else if (preg_match('/group.ride/i', $desc))
	$ridetype = 'group ride';
    else
	$ridetype = 'ride';
    print("\tridetype=$ridetype\n");

    # Difficulty is stuffed into a <div> block in a consistent place.
    # There may be multiple difficulty ratings, in which case we need to
    # combine them in a single string.
    preg_match_all('/Ride Difficulty:\s*<\/div>\s*([A-E])\s*</s', $desc, $matches);
    $difficulty = '';
    foreach ($matches[1] as $d) {
	if ($difficulty == '')
	    $difficulty = $d;
	else
	    $difficulty .= '/'.$d;
    }
    print("\tdifficulty=$difficulty\n");

    # Same for starting point's address.  Also, the venue name is usually
    # appended to the address, but the delimiter is not standardized.
    $loc = preg_replace('/.*Address:\s*<\/div>\s*([^<]*)<\/div>.*/s', '$1', $desc);
    $locsplit = explode(' - ', $loc);
    if (count($locsplit) != 2)
	$locsplit = explode('-', $loc);
    if (count($locsplit) == 2) {
	$thisevent['address'] = $locsplit[0];
	$thisevent['locname'] = $locsplit[1];
    } else {
	$locsplit = explode('-', str_replace('Portland,', 'Portland -', $loc));
	if (count($locsplit) == 2 && substr($locsplit[1], 0, 2) != "OR") {
	    $thisevent['address'] = $locsplit[0];
	    $thisevent['locname'] = $locsplit[1];
	} else {
	    $thisevent['address'] = $loc;
	    $thisevent['locname'] = '';
	}
    }
    $thisevent['address'] = html_entity_decode(trim($thisevent['address']));
    $thisevent['locname'] = html_entity_decode(trim($thisevent['locname']));
    $thisevent['addressverified'] = 'Y';
    if (preg_match('/\b(vancouver|wa)\b/i', $thisevent['address']))
	$thisevent['area'] = 'V'; # Vancouver
    else
	$thisevent['area'] = 'P'; # Portland
    print("\taddress=".$thisevent['address']."\n");
    print("\tlocname=".$thisevent['locname']."\n");
    print("\tarea=".$thisevent['area']."\n");

    # Ride organizer -- Ideally we'd like to split this into multiple fields,
    # but for now we'll just shove it all into the "name" field.
    $org = preg_replace('/.*Ride Leader:\s*<\/div>\s*([^<]*)<\/div>.*/s', '$1', $desc);
    $thisevent['name'] = html_entity_decode(trim($org));
    print("\tname=".$thisevent['name']."\n");

    # The description is tough.  We can scrape off the <div> sections, but
    # some of the <p> text is redundant and we'd like to omit that if we could,
    # especially the ride type/class/distance since we'll be appending those
    # in a link.  Also, we want to de-HTML-ize it.
    $d = preg_replace('/<div.*/s', '', $desc);	# Remove <div> tags from end
    $d = str_replace('</p>', '', $d);		# Remove </p> tags
    $d = str_replace('<p>', "\n", $d);		# Change <p> to newline for now
    $d = preg_replace('/<a [^>]*href="([^"]*)"[^>]*>[^<]*<\/a>/', '$1', $d);#<a>
    $d = preg_replace('/<[^>]*>/', '', $d);	# Remove any other tags
    $d = html_entity_decode($d);
    $d = preg_replace('/\nDistance.*Leaves.*/', '', $d);#1st <p> often redundant
    $d = preg_replace('/\n(non|re)?-?group ride\.?/i', '', $d);#also redundant
    $d = preg_replace('/\s\s+/', ' ', $d);	# Compress multispaces to single
    $d = trim($d);				# Remove leading/trailing spaces
    if ($d == '')
	$d = 'See PWTC listing for more info.';
    $thisevent['descr'] = $d."\nPWTC level $difficulty $ridetype";
    if ($distance)
	$thisevent['descr'] .= ", $distance.";
    else
	$thisevent['descr'] .= '.';
    print("\tdescr=".preg_replace('/(..............).*\n/', '$1...', $thisevent['descr'])."\n");

    # The print description is limited length.  Start with the fill description
    # but no PWTC classifications, and then lop off whole sentences.  If it's
    # still too long after that, break at conjunctions.
    for ($t = $d; strlen($t) > 120; $t = $d) {
	$d = preg_replace('/(.*)\. +.*/', '$1.', $d);
	if ($d == $t)
	    break;
    }
    for (; strlen($t) > 120; $t = $d) {
	$d = preg_replace('/\(.*\),?\s*\b(and|or|but)\b.*/', '$1.', $d);
	if ($d == $t)
	    break;
    }
    if (strlen($t) > 120)
	$t = 'See pwtc.com for a description.';
    $thisevent['printdescr'] = $t;
    print("\tprintdescr=$t\n");

    # Append each date to the caldaily array.  Also get shared time
    preg_match_all('/date-display-single">([^<]*)/', $desc, $matches);
    foreach ($matches[1] as $date) {
print("\t---date='$date' temporarily\n");
	$date = explode(' - ', $date);
	$thisevent['eventtime'] = hhmmss($date[1]);
	$date = yyyymmdd($date[0]);
	$thisevent['caldaily'][] = array('eventdate'=>$date,'eventstatus'=>'A');
	print("\teventdate=$date\n");
    }
    print("\ttime=".$thisevent['eventtime']."\n");

    # Get a string describing the dates as a whole.  This does *NOT* need
    # to be parsable by the repeatdates() function since we already have a
    # list of specific dates.
    if (count($thisevent['caldaily']) == 1) {
	$d = explode(',', $date);
	$thisevent['dates'] = $d[0];
	$thisevent['datestype'] = 'O'; # One day
    } else {
	$d = preg_replace('/.*<div>\s*Repeats ([^<])<.*/', '$1', $desc);
	if ($d == $desc)
	    $d = 'Scattered days';
	$d = preg_replace('/\s\s+/', ' ', $d);
	$thisevent['dates'] = $d;
	$thisevent['datestype'] = 'S'; # Scattered days
    }
    print("\tdates=".$thisevent['dates']."\n");
    print("\tdatestype=".$thisevent['datestype']."\n");

    # Add this event to the $calevent array
    $calevent[] = $thisevent;
}

#############################################################################
#
# At this point, $calevent is an array of records resembling the records that
# mysql_fetch_array() returns for calevent records, except that each record
# also contains an array of caldaily records.

feedin(SOURCE, $calevent);

# ex:set shiftwidth=4 smarttab makeprg="php -l $2":
?>

<?php
include('../init.php');
$defaultImage = 'http://www.shift2bikes.org/images/logos/shiftLogo_plain.gif';

function addOgTag($property, $content) {
	$content = htmlspecialchars($content);
	echo "\t\t<meta property=\"og:$property\" content=\"$content\" />\n";
}


if (!array_key_exists('id', $_GET)) {
	$title = 'Shift/Pedalpalooza Calendar';
	$description = 'Find fun bike events and make new friends! SHIFT helps groups and individuals to promote their "bike fun" events.';
	echo <<< EOT
<html>
	<head>
		<title>$title</title>

EOT;
	addOgTag('title', $title);
	addOgTag('url', "$PROTOCOL$HOST{$PATH}");
	addOgTag('image', $defaultImage);
	addOgTag('type', 'website');
	addOgTag('description', $description);
	addOgTag('site_name', $SITENAME);
	echo <<< EOT
		<meta name="description" content='$description'>
		<meta name="keywords" content="bikes,fun,friends,Portland,exercise,community,social,events,outdoors">
	</head>
	<body>
		<p>$description</p>
	</body>
</html>
EOT;
	exit();
}
$id = filter_var($_GET['id'], FILTER_VALIDATE_INT);
$eventTimes = EventTime::getByID($id);
$eventTime = $eventTimes[0];
$event = $eventTime->toEventSummaryArray();

echo <<< EOT
<html>
	<head>
		<title>{$event['title']}</title>

EOT;

addOgTag('title', $event['title']);
addOgTag('url', "$PROTOCOL$HOST{$PATH}event-$id");
$image = $event['image'];
if (empty($image)) {
	$image = $defaultImage;
} else {
	$image = "$PROTOCOL$HOST$image";
}
addOgTag('image', $image);
addOgTag('type', 'article'); //FIXME: Does FB support 'event' yet?
addOgTag('description', $event['details']);
addOgTag('site_name', $SITENAME);
$eventDate = DateTime::createFromFormat('Y-m-d', $event['date']);
$datestring = $eventDate->format('D, M jS');
$eventTime = DateTime::createFromFormat('G:i:s', $event['time']);
$timestring = $eventTime->format('g:i A');
$description = htmlspecialchars($event['details']);
echo <<< EOT
		<meta name="description" content='$description'>
		<meta name="keywords" content="bikes,fun,friends,Portland,exercise,community,social,events,outdoors">
	</head>
	<body>
		<h2>$datestring, $timestring - {$event['title']}</h2>
		<p>{$event['details']}</p>
		<p>{$event['address']}</p>
		<img src="$image" />
	</body>
</html>
EOT;


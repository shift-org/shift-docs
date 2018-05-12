<!-- header include -->
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
<head>
<title><?php echo $event_title ? $event_title : 'S H I F T to bikes!'; ?></title>
<meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1">

<!-- exclude cooperative (like search engines) robot programs from probing pages -->
<meta name="robots" content="noindex,nofollow" />
<!-- ensures no content is cached, thereby making the browser retrieve the page from the server on each load -->
<META HTTP-EQUIV="Expires: Mon, 26 Jul 2002 05:00:00 GMT" CONTENT="0">
<META HTTP-EQUIV="Pragma: no-cache" CONTENT="no-cache">
<META HTTP-EQUIV="Cache-Control: no-cache, must-revalidate" CONTENT="no-cache">

<link rel="icon" href="http://www.shift2bikes.org/includes/favicon.ico" type="image/x-icon">
<link rel="shortcut icon" href="http://www.shift2bikes.org/includes/favicon.ico" type="image/x-icon">

<!-- Facebook OpenGraph -->
<meta property="og:title" content="<?php echo $event_title ?>" />
<meta property="og:site_name" content="S H I F T to bikes!" />
<meta property="og:url" content="http://www.shift2bikes.org/cal/calforum.php?id=<?php echo $event['id'] ?>" />
<meta property="og:description" content="<?php echo htmlspecialchars($event['descr']); ?>" />
<meta property="og:type" content="article" />
<meta property="og:locale" content="en_US" />
<meta property="og:rich_attachment" content="true" />
<meta property="og:image" content="http://www.shift2bikes.org/cal/<?php echo $event_image ?>" />

<!-- Twitter Share Card -->
<meta name="twitter:card" content="<?php echo htmlspecialchars($event['descr']); ?>" />
<meta name="twitter:site" content="S H I F T to bikes!" />
<meta name="twitter:title" content="<?php echo $event_title ?>" />
<meta name="twitter:description" content="View the event on shift2bikes.org" />
<meta name="twitter:image" content="http://www.shift2bikes.org/cal/<?php echo $event_image ?>" />

<style type=text/css>
/* ---------- HEADER ------------- */
#logo {	TOP: 12px; LEFT: 12px; WIDTH: 152px; HEIGHT: 85px; POSITION: absolute; Z-INDEX: 7000; }

#keeping {	TOP: 15px; LEFT: 248px; WIDTH: 500px; HEIGHT: 16px; POSITION: absolute; Z-INDEX: 6001; }

#inPortland { TOP: 25px; LEFT: 350px; WIDTH: 400px; HEIGHT: 32pt; POSITION: absolute; Z-INDEX: 6000; }

#hostSponsor { TOP: 4px; LEFT: 715px; WIDTH: 186px; HEIGHT: 60pt; POSITION: absolute; Z-INDEX: 6004; }

#header_bar {
	margin: 0 0 0 0;
	border: 0;
	background-color: #ffcc00;
	width: 100%;
	height: 1.25em !important;
	TOP: 71px; LEFT: 0px; POSITION: absolute; Z-INDEX: 3000;
	font-size: 10pt;
}

#bar_rule {
	margin: 0 0 0 0;
	border: 2px;
	border-top: solid 2px #663300;
	border-bottom: solid 2px #663300;
	width: 100%;
	height: 1.25em !important;
	TOP: 69px; LEFT: 0px; POSITION: absolute; Z-INDEX: 3001;
	font-size: 10pt;
}

#nav_position {
	color: #663300;
	font-size: 8pt;
	font-family:Verdana, Arial, Helvetica, sans-serif;
	font-weight:bold;
	TOP: 70px; LEFT: 105px; WIDTH: 1000px; HEIGHT: 15px; POSITION: absolute; Z-INDEX: 8000;
}

/* ---------- BODY ------------- */
#container {
	TOP: 110px;
	LEFT: 0px;
	POSITION: absolute;
	overflow: hidden;
	width: 100%;
}

body { MARGIN: 0px; }


/* ---------- TYPOGRAPHY ------------- */
a.stb_nav,
a.stb_nav:link,
a.stb_nav:visited {
	color: #663300;
	font-size: 10pt;
	font-family: Verdana, Arial, Helvetica, sans-serif;
	font-weight: bold;
	font-variant: small-caps;
	letter-spacing: 1pt;
	text-decoration: none
}

a.stb_nav:hover {
	color: #CC9900;
}

a.intro { color: #000000; font-weight:bold; }
a.intro:link { color: #000000; font-weight:bold; }
a.intro:visited { color: #000000; font-weight:bold; }
a.intro:hover { color: #ffff00; font-weight:bold; }

a.whtyel { color: #ffffff; font-weight:bold; }
a.whtyel:link { color: #ffffff; font-weight:bold; }
a.whtyel:visited { color: #ffffff; font-weight:bold; }
a.whtyel:hover { color: #ffff00; font-weight:bold; }

.dotsruleV { BORDER-LEFT: 3px dotted #000000; }
.dotsruleSpecial { BORDER-BOTTOM: 3px dotted #000000; }

.chatterBox { position: relative; width: 250px; height: 1600px; overflow: scroll; }


/* ---------- FOOTER & BOTTOM NAV ------------- */
#stb_footer {
	position: relative;
	z-index: 8002;
	background-color: #ff9900;
	padding-top: 0px;
}

#barB {
	background: url(http://www.shift2bikes.org/images/bar1x34.jpg);
	height: 34px;
	padding: 6px 0px 0px 16px;
	vertical-align: middle;
	color: #663300;
	font-size: 10pt;
	font-family: Verdana, Arial, Helvetica, sans-serif;
	font-weight:bold;
	width: 100%;
}

#bottomnav {
	position: relative;
	padding: 0px 0px 16px 28px;
	height: 260px;
	background-color: #FF9900;
	color: white;
	font-family: "Lucida Sans", "Lucida Grande", "Lucida Sans Unicode", Lucida, Verdana, sans-serif;
	font-size: 12px;
	line-height: 145%;
	width: 100%;
	min-width: 825px;
}

.bottomnav-block {
	float: left;
	width: 150px;
	padding-top: 35px;
}

.bottomnav-block h4 {
	margin: 0px 0px 6px 0px;
	padding: 0px;
	font-size: 12pt;
	font-weight: bold;
}

.bottomnav-block ul {
	margin: 0px;
	padding: 0px;
}

.bottomnav-block ul li {
	margin-bottom: 1px;
	list-style: none;
	font-size: 8pt;
}

.bottomnav-block a {
	font-weight: normal;
	color: #ffffff;
	text-decoration: none;
}

.bottomnav-block a:hover {
	text-decoration: underline;
}

</style>

</head>

<body bgcolor="#FF9900" text="#000000" link="#000000" vlink="#000000" alink="#000000">

	<div id=logo><a href="http://www.shift2bikes.org/"><img src="http://www.shift2bikes.org/images/shiftLogo_plain.gif" width=152 height=85 alt="" border=0></a></div>
	<div id=keeping>
		<font style="color:#ffcc00; font-size:14pt; letter-spacing:-1pt; font-family:Verdana, Arial, Helvetica, sans-serif; font-weight:bold;">
		Bringing people together for Bike Fun
		</font>
	</div>
	<div id=inPortland>
		<font style="color:#cc6600; font-size:22pt; letter-spacing:-1.75pt; font-family:Verdana, Arial, Helvetica, sans-serif; font-weight:bold;">
		in Portland, Oregon
		</font>
	</div>
	<div id=hostSponsor>
		<a href="http://www.canvasdreams.com/sustainability/"><img src="http://www.shift2bikes.org/includes/cvd-affiliate-186x60.jpg" border=0></a>
	</div>
	<div id="nav_position">
		<a href="/whoWeAre.php" class=stb_nav>Who We Are</a> &nbsp;|&nbsp;
		<a href="/cal/" class=stb_nav>Calendar</a> |&nbsp;
		<a href="/pedalpalooza/index.shtml" class=stb_nav>PedalPalooza</a> |&nbsp;
		<a href="http://lists.riseup.net/www/info/shift" class=stb_nav>List</a> |&nbsp;
		<a href="/safety/" class=stb_nav>Safety</a> |&nbsp;
		<a href="/contacts/" class=stb_nav>Contact</a> |&nbsp;
		<!-- <a href="/moveXbike.php" class=stb_nav>MoveByBike</a> |&nbsp;
		<a href="/bonb.php" class=stb_nav>BreakfastontheBridges</a> |&nbsp; -->
		<a href="http://www.shift2bikes.org/biki/" class=stb_nav>biki</a> |&nbsp;
		<!-- <a href="http://www.shift2bikes.org/allbike.php#BonB" class=stb_nav>BreakfastontheBridges</a> -->
		<a href="http://www.shift2bikes.org/biki/bikefun:breakfast_on_the_bridges" class=stb_nav>BreakfastontheBridges</a>
	</div>
	<div id="header_bar"></div>
	<div id="bar_rule"></div>

<div id=container>
         
<!-- end header include -->

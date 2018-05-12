<?php
    include("include/common.php");

    # Check parameters and cookies to determine whether we're logged in
    if ($_REQUEST["logout"]) {
	setcookie(ADMINCOOKIE, "", time() - 86400, "/");
	$loggedin = 0;
    } else if ($_POST["user"] == ADMINUSER && $_POST["pass"] == ADMINPASS) {
	setcookie(ADMINCOOKIE, "bikefun", time() + 86400, "/");
	$loggedin = 1;
    } else if ($_COOKIE[ADMINCOOKIE] == "bikefun") {
	$loggedin = 1;
    } else {
	$loggedin = 0;
    }

    # include the standard Shift header
    include(INCLUDES."/header.html");

    # depending on whether we're logged in, show either a login prompt or menu
    if (!$loggedin) {
	# login prompt
	print "<center><form action=\"admin.php\" method=\"POST\">\n";
	print "<font size=\"+2\">\n";
	print "Login: <input type=text size=10 name=user><br>\n";
	print "Password: <input type=password size=10 name=pass><br>\n";
	print "<input type=submit value=\"Login\">\n";
	print "</font>\n";
	print "</form>\n";
	print "<button onClick=\"window.location.replace('view3week.php')\">View Calendar</button>\n";
	print "</center>\n";
    } else {
	# menu
	include("include/admmenu.php");
    }

    # include the standard Shift footer
    include(INCLUDES."/footer.html");
?>

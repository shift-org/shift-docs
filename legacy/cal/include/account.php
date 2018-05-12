<?php
	# Database access constants
	define("DBHOST", "localhost");
	define("DBUSER", "shift2b_shift2b");
	define("DBPASSWORD", "b1k3s.x");
	define("DBDATABASE", "shift2b_bikeaction_beta");

	# Directory where SHIFT's standard header and footer are stored
	define("INCLUDES", "../includes");

	# URL of the Directory where the calendar resides
	define("CALURL", "http://shift2bikes.org/betacal");

	# cookie to replace static definitions, for security through obscurity
	define("ADMINCOOKIE", "yeehaw!");

	# The page to show when the user loads CALURL
	define("MAINPAGE", "view2week-bs.php");

	# Timezone difference between the web host and Portland.
	define ("TZTWEAK", 0);

	# Email address for PP calendar crew.  This is used as the "From:"
	# address of confirmation messages.
	define("SHIFTEMAIL", "gently@gmail.com");
?>

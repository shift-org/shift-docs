<?php
	# Database access constants
	define("DBHOST", "db");
	define("DBUSER", getenv("MYSQL_USER"));
	define("DBPASSWORD", getenv("MYSQL_PASSWORD"));
	define("DBDATABASE", getenv("MYSQL_DATABASE"));

	# Directory where SHIFT's standard header and footer are stored
	define("INCLUDES", "../includes");

	# URL of the Directory where the calendar resides
	define("CALURL", "https://www.shift2bikes.org/calendar/");

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

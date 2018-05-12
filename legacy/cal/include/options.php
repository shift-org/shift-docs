<?php

# Load the option values into an array, and return the array.
function calloadoptions()
{
    $cal = array();

    # Begin by loading the default values of all options
    $fp = fopen("include/text/optionsdefault.txt", "r");
    if ($fp)
    {
	while (($line = fgets($fp)) !== FALSE) {
	    $line = trim($line);
	    if (preg_match("/^([A-Za-z][A-Za-z0-9]*) *= *(.*)/", $line, $sub)) {
		$cal[$sub[1]] = $sub[2];
	    }
	}
	fclose($fp);
    }

    # Allow the defaults to be overridden via site options
    $fp = fopen("include/text/options.txt", "r");
    if ($fp)
    {
	while (($line = fgets($fp)) !== FALSE) {
	    $line = trim($line);
	    if (preg_match("/^([A-Za-z][A-Za-z0-9]*) *= *(.*)/", $line, $sub)) {
		$cal[$sub[1]] = $sub[2];
	    }
	}
	fclose($fp);
    }

    # Return the array of options
    return $cal;
}

# This global variable is used to store the loaded options
$CAL = calloadoptions();

# Start a normal page in the calendar system.  This loads the options, and
# includes the header and the theme's CSS.  It also emits code to change the
# title to a given value, which is useful because often the header will
# define a default title (which is wrong).
function calbegin($title)
{
    global $CAL;

    # Load the header
    if ($CAL['header']) {
	include($CAL['header']);
	if ($title) {
	    print "<scri"."pt type=\"text/javascript\">\n";
	    print "  document.title = \"$title\";\n";
	    print "</sc"."ript>\n";
	    print "<link rel=\"stylesheet\" type=\"text/css\" href=\"".$CAL['theme']."\" />\n";

	}
    } else {
	print "<html>\n";
	print "  <head>\n";
	if ($title)
	    print "    <title>$title</title>\n";
        print "    <link rel=\"stylesheet\" type=\"text/css\" href=\"".$CAL['theme']."\" />\n";
	print "  </head>\n";
	print "  <body>\n";
    }
    print "    <div class=\"calcontent\">\n";
}

# End a normal page in the calendar system.
function calend()
{
    global $CAL;

    print "    </div>\n";
    if ($CAL['footer']) {
	include($CAL['footer']);
    } else {
	print "  </body>\n";
	print "</html>\n";
    }
}

# Return the pathname of an image, given its basename.  This checks first
# in the themes/$basetheme/ directory, then the images/ directory.  This
# may be handy for things like a graphical @ sign used to obfuscate email
# addresses.
#
# Note that you don't need to use this with event images; they're always
# in eventimages/.  Also, themes' CSS files can directly express the URLs
# of their images (which is a good thing since *.css files aren't PHP).
function calimage($name)
{
    $fullname = 'themes/' . basename($CAL['theme'], '.css') . "/$name";
    if (file_exists($fullname))
	return $fullname;
    return 'images/' . $name;
}

?>

<?php
include("include/common.php");



include(INCLUDES."/header.html");

# Make sure this user is logged in as the administrator, and that the
# safety words have been said.
if ($_COOKIE[ADMINCOOKIE] != "bikefun") {
    print "<h1>No Permission</h1>\n";
    print "You must log in as the administrator before you're allowed\n";
    print "to do that.  You can log in <a href=\"admin.php\">here</a>.\n";
} else if ($_REQUEST["verb"] + $_REQUEST["adjective"] + $_REQUEST["noun"] != 3) {
    print "<h1>Wrong words</h1>\n";
    print "Since this is such an incredibly dangerous thing to do,\n";
    print "you must go back to the <a href=\"admin.php\">Administrator's menu</a>\n";
    print "and set the words to say \"Clobber Calendar Files\".\n";
} else {
    # Really do it!

    # Drop the tables.  Ignore errors; the first time we install this,
    # there won't be any tables to drop yet.
    mysql_query("DROP TABLE calevent", $conn);
    mysql_query("DROP TABLE caldaily", $conn);
    mysql_query("DROP TABLE calforum", $conn);
    mysql_query("DROP TABLE calcount", $conn);
    #mysql_query("DROP TABLE caladdress", $conn);

    # Create new tables
    $sql = "CREATE TABLE calevent (";
    $sql .= "modified TIMESTAMP,";	# when modified
    $sql .= "id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,"; #unique event id
    $sql .= "name VARCHAR(255),";	# name of event organizer
    $sql .= "email VARCHAR(255),";	# email address of organizer
    $sql .= "hideemail INT(1),";	# 1=hide online, 0=show online
    $sql .= "emailforum INT(1),";	# 1=forward forum msgs to email
    $sql .= "printemail INT(1),";	# 1=show in print, 0=omit
    $sql .= "phone VARCHAR(255),";	# phone number of organizer
    $sql .= "hidephone INT(1),";	# 1=hide online, 0=show online
    $sql .= "printphone INT(1),";	# 1=show in print, 0=omit
    $sql .= "weburl VARCHAR(255),";	# URL of organizer's web site
    $sql .= "webname VARCHAR(255),";	# name of organizer's web site
    $sql .= "printweburl INT(1),";	# 1=show URL in print, 0=omit
    $sql .= "contact VARCHAR(255),";	# other contact info
    $sql .= "hidecontact INT(1),";	# 1=hide online, 0=show online
    $sql .= "printcontact INT(1),";	# 1=show in print, 0=omit
    $sql .= "title VARCHAR(255),";	# full title of the event
    $sql .= "tinytitle VARCHAR(255),";	# tiny title of the event
    $sql .= "audience CHAR(1),";	# G=general, F=family, A=adult
    $sql .= "descr TEXT,";		# full description of event
    $sql .= "printdescr TEXT,";		# shorter print description
    $sql .= "image VARCHAR(255),";	# name of image, or "" if none
    $sql .= "imageheight INT,";		# image height if any
    $sql .= "imagewidth INT,";		# image width if any
    $sql .= "dates VARCHAR(255),";	# dates, e.g. "Every Sunday"
    $sql .= "datestype CHAR(1),";	# O=one day, C=consecutive, S=scattered
    $sql .= "eventtime TIME,";		# event's start time
    $sql .= "eventduration INT,";	# event's duration, in seconds
    $sql .= "timedetails VARCHAR(255),";# other time info
    $sql .= "locname VARCHAR(255),";	# name of venue
    $sql .= "address VARCHAR(255),";	# address or cross-streets
    $sql .= "addressverified CHAR(1),";	# Y=verified, otherwise not
    $sql .= "locdetails VARCHAR(255),";	# other location info
    $sql .= "area CHAR(1),";		# P=portland, V=vancouver
    $sql .= "external VARCHAR(250),";	# unique (with source) identifier of imported event
    $sql .= "source VARCHAR(250),";	# source of imported event
    $sql .= "nestid INT REFERENCES calevent(id),";# id of festival containing this event
    $sql .= "nestflag VARCHAR(1),";	# F=festival, G=group, else normal event
    $sql .= "review CHAR(1),";		# Inspect/Approved/Exclude/SentEmail/Revised
    $sql .= "highlight INT";		# 1 for events admin's favorite events
    $sql .= ");";
    mysql_query($sql, $conn) || die("Creating calevent, ".mysql_error());

    $sql = "ALTER TABLE calevent ADD KEY (source, external);";
    mysql_query($sql, $conn) || die("Adding key to calevent, ".mysql_error());

    $sql = "CREATE TABLE caldaily (";
    $sql .= "modified TIMESTAMP,";	# when modified
    $sql .= "id INT REFERENCES calevent,";# which event this is for
    $sql .= "newsflash TEXT,";		# usually "", else update info
    $sql .= "eventdate DATE,";		# date of the event
    $sql .= "eventstatus VARCHAR(1),";	# A=as scheduled, S=skipped, C=canceled, E=exception
    $sql .= "exceptionid INT";		# foreign key into calevent, or 0
    $sql .= ");";
    mysql_query($sql, $conn) || die("Creating caldaily, ".mysql_error());

    $sql = "ALTER TABLE caldaily ADD KEY (eventdate);";
    mysql_query($sql, $conn) || die("Adding key to caldaily, ".mysql_error());

    $sql = "CREATE TABLE calforum (";
    $sql .= "modified TIMESTAMP,";	# used to sort msgs and detect new ones
    $sql .= "msgid INT PRIMARY KEY NOT NULL AUTO_INCREMENT,"; # used for editing
    $sql .= "id INT REFERENCES calevent,";# which forum? foreign key into calevent
    $sql .= "organizer INT(1),";	# 1=organizer or calendar crew, 0=other
    $sql .= "name VARCHAR(255),";	# name of author
    $sql .= "subject VARCHAR(255),";	# subject line
    $sql .= "msg TEXT";			# body of message
    $sql .= ");";
    mysql_query($sql, $conn) || die("Creating calforum, ".mysql_error());

    $sql = "CREATE TABLE IF NOT EXISTS caladdress (";
    $sql .= "canon VARCHAR(255) PRIMARY KEY NOT NULL,"; # simplified locname
    $sql .= "address VARCHAR(255),";	# address of the venue
    $sql .= "locname VARCHAR(255),";	# name of the venue
    $sql .= "area CHAR(1),";		# P=portland, V=vancouver
    $sql .= "locked INT(1)";		# 1=locked, 0=automatic updates allowed
    $sql .= ");";
    mysql_query($sql, $conn) || die("Creating caladdress, ".mysql_error());

    # Also clobber the "eventimages" directory
    $f = "eventimages";
    foreach(glob($f.'/*') as $sf) {
        unlink($sf);
    }
    rmdir($f);
    mkdir($f);

    print "<h1>Clobbered</h1>\n";
    print "The calendar tables have been clobbered.\n";
    print "The calendar is now empty.\n";
    print "<br><button onclick=\"window.location.replace('admin.php');\">Administration Menu</button>\n";
}

include(INCLUDES."/footer.html");
?>

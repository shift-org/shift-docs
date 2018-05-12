#!/bin/bash

# script to create some test data around "today's date" that you can use to populate a local version of the calendar anytime.

# example data in 1 row
#('2015-10-04 21:28:00',2,'fool','gently@gmail.com','I',0,1,1,'123-123-1234',1,1,'http://w.tf','w.tf',0,'use the bat signal',0,0,'test single event','test single event','G','test single event, with all fields filled out.','test single event, with all fields filled out.','',0,0,'Monday, October 5','O','19:00:00',120,'leaving 5 minutes late','salmon street fountain','SW Naito & Salmon','X','in the water','P',0,NULL);

# field listing w/example data
#  `modified` timestamp NOT NULL ('2015-10-04 21:28:00')
#  `id` int(11) NOT NULL AUTO_INCREMENT (2 - but this will get automatically set by DB)
#  `name` varchar(255)  ('fool')
#  `email` varchar(255) ('gently@gmail.com')
#  `review` varchar(255) ('I') [possible values [IAESR] in vfyreview.php for pp]
#  `hideemail` int(1) (0) [possible values [01]]
#  `emailforum` int(1) (1) [possible values [01]]
#  `printemail` int(1) (1) [possible values [01]]
#  `phone` varchar(255) ('123-123-1234')
#  `hidephone` int(1) (1) [possible values [01]]
#  `printphone` int(1) (1) [possible values [01]]
#  `weburl` varchar(255) ('http://shift2bikes.org') 
#  `webname` varchar(255) ('name of a website')
#  `printweburl` int(1) (0) [possible values [01]]
#  `contact` varchar(255) ('alternate contact info')
#  `hidecontact` int(1) (0) [possible values [01]]
#  `printcontact` int(1) (0) [possible values [01]]
#  `title` varchar(255) ('TITLE')
#  `tinytitle` varchar(255) ('TINYTITLE')
#  `audience` char(1) ('G') [possible values [FGA]] (family/general/adult)
#  `descr` text ('DESCRIPTION')
#  `printdescr` text ('PRINTDESCRIPTION')
#  `image` varchar(255) '' [relative path to image]
#  `imageheight` int(11) (0) [calculated upon upload?  0 if no image]
#  `imagewidth` int(11) (0) [calculated upon upload?  0 if no image]
#  `dates` varchar(255) ('Monday, October 5') [formatted by calform.php?]
#  `datestype` char(1) ('O') [possible values [OCS] (one/consecutive/scattered)
#  `eventtime` time DEFAULT NULL,('19:00:00')
#  `eventduration` int(11) (120) [in minutes]
#  `timedetails` varchar(255) ('TIMEDETAILS')
#  `locname` varchar(255) ('LOCATION_NAME')
#  `address` varchar(255) ('LOCATION_ADDRESS')
#  `addressverified` char(1) ('X') [possible values XY, y = yes x = no]
#  `locdetails` varchar(255) ('LOCATION_DETAILS')
#  `area` char(1) ('P') [possible values [PV]]
#  `highlight` int(1) (0) [possible values [01] 1 is yes]
#  `external` varchar(255) (NULL)
#
EVENTSTRING="('2015-10-04 21:28:00',NULL,'example name','email@addr.es','I',0,1,1,'123-123-1234',1,1,'http://example.com','name of a website',0,'use the bat signal',0,0,'TITLE','TINYTITLE','G','DESCRIPTION','PRINTDESCRIPTION','',0,0,'FORMATTED_DATE','O','TIME',120,'TIMEDETAILS','LOCATION_NAME','LOCATION_ADDRESS','X','LOCATION_DETAILS','P',0,NULL)"

# get today's date in proper format, extrapolate yesterday/tomorrow
YEAR=`date +%Y`
MONTH=`date +%B`
DAY=`date +%d`
DATE=`expr $DAY`
YESTERDATE=`expr $DAY - 1`
TODAY=`date +%A`
TOMORROWDATE=`expr $DAY + 1`
case $TODAY in
	"Monday")
		YESTERDAY="Sunday"
		TOMORROW="Tuesday"
		;;
        "Tuesday")
		YESTERDAY="Monday"
		TOMORROW="Wendesday"
		;;
        "Wednesday")
		YESTERDAY="Tuesday"
		TOMORROW="Thursday"
		;;
        "Thursday")
		YESTERDAY="Wendesday"
		TOMORROW="Friday"
		;;
        "Friday")
		YESTERDAY="Thursday"
		TOMORROW="Saturday"
		;;
        "Saturday")
		YESTERDAY="Friday"
		TOMORROW="Sunday"
		;;
        "Sunday")
		YESTERDAY="Saturday"
		TOMORROW="Monday"
        	;;
esac


# times for example events
MORNINGTIME="08:00:00"
NOONTIME="12:00:00"
EVENINGTIME="20:00:00"

# setup
touch sample_data.mysql

# TODO handle development on days near the beginning of the month
if [ "$DAY" -lt 2 ] ; then
	# but what if we're in January?
	if [ "$MONTH" -eq 1 ] ; then
	echo
	fi
	
fi
# TODO handle development on days near the end of the month
if [ "$DAY" -gt 24 ] ; then
	# but what if we're in December?
	if [ "$MONTH" -eq 12 ] ; then
	echo
	fi
fi

# 3 events yesterday, today, and tomorrow

echo -n "INSERT INTO \`calevent\` VALUES " > /tmp/testdata
for j in $MORNINGTIME $NOONTIME $EVENINGTIME ; do
# 3x for YESTERDAY, TODAY, TOMORROW
	echo -n $EVENTSTRING | sed s/TITLE/"single event on $YESTERDAY at $j"/ | sed "s/FORMATTED_DATE/${YESTERDAY}, $MONTH ${YESTERDATE}/" | sed "s/TIME/${j}/" | tr "\n" ","
	echo -n $EVENTSTRING | sed s/TITLE/"single event on $TODAY at $j"/ | sed "s/FORMATTED_DATE/${TODAY}, $MONTH ${DATE}/"| sed "s/TIME/${j}/" | tr "\n" ","
	echo -n $EVENTSTRING | sed s/TITLE/"single event on $YESTERDAY at $j"/ | sed "s/FORMATTED_DATE/${TOMORROW}, $MONTH ${TOMORROWDATE}/"| sed "s/TIME/${j}/" | tr "\n" ","
done >> /tmp/testdata
cat /tmp/testdata | sed s/,$// > /tmp/testdata.n
rm -f /tmp/testdata
echo \; >> /tmp/testdata.n
cat /tmp/testdata.n

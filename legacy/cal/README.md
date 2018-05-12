# shiftcal

This is the source code for the Shift calendar.
===============================================

It has been sanitized of passwords from the copy running at http://shift2bikes.org/cal , but if you'd like to see it in action that's where to check it out.

Basic Architecture
------------------

The landing page index.php is very minimal - it loads site config from include/common.php and then loads the MAINPAGE.  By default currently, MAINPAGE = view3week.php.

view3week.php provides a 3-week calendar view with all 3 weeks of the event data listed at the bottom.  Links from the calendar to event data are included and navigable without talking to the server, after the page loads.  It has links to a simple search form (viewsearch.php) and a full-month view (viewmonth.php), and allows you to move between months.

To add an event, you start at 'calform.php' to fill out one of three versions of the event info page.  It submits to calsubmit.php and uses the verification code in vfyaddress.php and vfyvenue.php (these being broken is non-fatal), but vfydates.php is needed as it parses and accepts date specifications like "first thursdays" or "first of every month except december".

Pedalpalooza event viewing and editing has a fair # of files associated with it, which makes sense, since Pedalpalooza usage is more than the rest of the year combined.  The most-used files are ppcurrent.php which redirects to whatever year of pedalpalooza is specified as current in include/common.php - eg viewpp2015.php.  The other functionality in the PP stuff: a counter for # of events which is embedded in the PP overview page, a calendar exporter, helpers to view single days/events, and a link to make a personalized printable calendar with just events you select.

*See the doc/notes/code_manifest.txt file for more info about each php file in the project*

How to setup & run locally
--------------------------

Anyone who wants to run the site locally will need the following to start with:

- PHP version < 5.7 and >= 5.4.   You can find this by running "php -i" or making a webpage that calls phpinfo();
- mysql installed and running and accessible from your dev environment
- The 'mysql' module enabled for PHP (there is a line that is uncommented in the correct php.ini to the effect of 'extension=mysql.so').  This module has been deprecated in 5.5 and 5.6 but still works.  **IT WILL NOT WORK IN PHP 5.7!**
- enabled the apache module for PHP 

Once you've gotten all that sorted, you should be able to create a page with just the code:

```
<?php phpinfo(); ?>
```

and have the output contain a page that shows the correct version of php (at the top of the output) and that the mysql.so extension is enabled (there is a section titled 'mysql')

Now that your environment is ready, let's get the source code installed and setup:

- checkout the source code and stick it in your document root, in a directory called shiftcal:  git clone "https://github.com/ShiftGithub/shiftcal.git"
- adjust the database settings in include/account.php to reference your own DB setup:  DBHOST, DBUSER, DBPASSWORD, DBDATABASE.
- untar the file includes.tgz from your source code.  Place it in your document root (shiftcal/../include)
- run mysql < init.sql to create an empty database

For additional explanation, expansion, and clarification of these instructions for those using XAMPP and/or OSX, see https://github.com/ShiftGithub/shiftcal/wiki/in-depth-setup-instructions

How to make improvements to integration with Facebook  
-----------------------------------------------------

The Facebook app ID is 135930960098034. 

How to propose changes
----------------------

Please fork the master branch of the ShiftGithub/shiftcal code into a branch in your own account, commit your changes to that branch, make a pull request against against the master branch of ShiftGithub/shiftcal, and we'll try to merge it!

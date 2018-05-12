<style type="text/css">
    a.button { border: medium outset #ffd080; background: #ffd080; text-decoration: none; padding-left: 2px; padding-right: 2px; cursor: pointer; white-space: nowrap;}
</style>
<center><h1>Administration menu</h1></center>

<h2>Log out</h2>
You'll be automatically logged out as administrator after 24 hours.
(I tried shorter times, but that was unreliable.  I think some browsers
have a hard time relating GMT time to local time.)
You can also log out manually here --&gt;
<a class=button href="admin.php?logout=Y">Log Out</a>.

<h2>Edit the calendar</h2>
Now that you're logged in as the administrator, all events will have
an [edit] button next to their title.
By clicking that button, you can edit any event.
<a class=button href="view3week.php">Current Calendar</a>
<?php
  print "<a class=button href=\"".PPURL."\">Pedalpalooza Calendar</a>\n";
?>

<h2>List email addresses of event organizers</h2>
This returns the email addresses of everybody who organized an event during
a given date range.
<a class=button href="admemaillist.php">List Email Addresses</a>

<h2>Edit the print descriptions</h2>
This lists the printed forms of all events in a given date range.
You can edit the descriptions <em>before</em> the print deadline.
This also allows you to export the event data in a format that
desktop publisher can use.
<a class=button href="admreview.php">Edit print descriptions</a>

<h2>Edit the Known Venue List</h2>
This is the list that allows users to type in "roccos" and have "Rocco's Pizza"
and "949 SW Oak St, Portland" get filled in automatically.
Names are automatically added, but you can inspect them and correct them
manually.
<a class=button href="admvenue.php">Venue Editor</a>

<h2>Examine Recent Forum Messages</h2>
This lists all forum messages that have been posted within the last 30 days,
and allows you to delete any that are offensive or off-topic.
<a class=button href="admforum.php">Forum Examiner</a>

<h2>Look for events that have no days</h2>
This looks for a situation which shouldn't be possible, but which
sometimes happens anyway.  An event can be added to the calevent
table, but not the caldaily table.
<a class=button href="admnodate.php">Events Without Dates</a>

<h2>Import from an RSS Feed</h2>
This isn't implemented yet.
When it is implemented,
I'm not making any promises about how helpful it will be.
RSS just sucks as a way to distribute calendar events.

<h2>Generate the Bulletin</h2>
It should be pretty nice, though you'll still need to hand-edit it.
<a class=button href="viewbulletin.php">Bulletin</a>

<h2>Add Icons to Specific Days</h2>
This isn't implemented yet.
The idea is that you can add small icons (with links) to any day,
for indicating things like Fathers Day.

<h2>Remind organizers of repeating events to re-submit</h2>
Repeating events are only scheduled out one year.
If the event continues beyond that, then the organizer must edit the
event before that time, and resubmit it.
This will extend it another year.
This page generates a list of repeating events that are about to expire,
and allows you to view it before sending the reminders.
<a class=button href="admremind.php">Reminders</a>

<h2>Clobber the calendar data</h2>
This will wipe out the datebase tables that store all calendar date.
All past and future events will be wiped out.
Forum discussions will be lost forever.
This is dangerous so I won't make it easy...
<form action="admclobber.php">
  <select name=verb>
    <option value=0>Impeach</option>
    <option value=0>Eat</option>
    <option value=0>Paint</option>
    <option value=1>Clobber</option>
    <option value=0>Accept</option>
  </select>
  <select name=adjective>
    <option value=0>Rubber</option>
    <option value=1>Calendar</option>
    <option value=0>Fresh</option>
    <option value=0>Republican</option>
    <option value=0>Fluffy</option>
  </select>
  <select name=noun>
    <option value=0>Fruit</option>
    <option value=0>Politicians</option>
    <option value=1>Files</option>
    <option value=0>Clouds</option>
    <option value=0>Nickels</option>
  </select>
  <input type=submit value="Now!">
</form>

<h2>The "old" calendar</h2>
You can see Shift's old calendar, hosted by PortlandCycling.net (Carlo Delumpa)
here --&gt;
<a class=button href="http://www.portlandcycling.net/calendar/calendar_shift.asp?ID=8">Old Calendar</a>

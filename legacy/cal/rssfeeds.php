<?php
include("include/common.php");
include(INCLUDES."/header.html");
?>
<style type="text/css">
  dt {margin-top: 10; font-weight: bold;}
</style>
<h1>RSS Feeds</h1>
RSS feeds offer a simple way to keep track of what's new.
To use them, you'll need either an RSS reader or a browser such as FireFox
that supports RSS feeds as bookmarks.
<p>
The Shift calendar offers four different RSS feeds.
The first three all pull data from the same calendar files so there's
little point in subscribing to more than one of them.
You should choose one,
depending on what program you're using to view the RSS feed and how you use it.
The fourth lists events that have been modified recently.
The feeds are:
<dl>
  <dt><a href="viewrss.php"><img src="images/rss.gif" alt="RSS" title="RSS feed for today's and tomorrow's events" border=0> Shift Calendar</a>
  <dd>This has one item per event for today and tomorrow.
      It also has items for "TODAY", "TOMORROW", and "ADD AN EVENT".
      This feed works best with Firefox's "Live Bookmark" feature.

  <dt><a href="viewrssweek.php"><img src="images/rss.gif" alt="RSS" title="RSS feed for the coming week" border=0> Shift Week</a>
  <dd>This has one entry per day, for the coming week.
      Each day's description lists the individual events for that day.
      Days with no events are skipped.
      It also has an item for "ADD AN EVENT".
      This feed is likely to work best in an RSS reader, if it's the only
      feed that you subscribe to.

  <dt><a href="viewrsstomorrow.php"><img src="images/rss.gif" alt="RSS" title="RSS feed for tomorrow" border=0> Shift Tomorrow</a>
  <dd>This has a single entry listing tomorrow's events, and nothing else.
      If there are no events tomorrow, then this feed contains no items.
      This does <em>not</em> have an item for adding an event.
      This feed is likely to work best in an RSS reader if you also subscribe
      to some other feeds.

  <dt><a href="viewrssrecent.php"><img src="images/rss.gif" alt="RSS" title="RSS feed for recently modified events" border=0> Shift Recent</a>
  <dd>This lists up to 10 events that have been modified most recently.
</dl>

<?php
include(INCLUDES."/footer.html");
?>

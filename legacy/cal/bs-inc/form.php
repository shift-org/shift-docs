<!-- TO-DO: Connect to DB, SELECT correct date range, foreach row in range, fill an event template div, then display that div here -->

<?php
	include("include/common.php");
	///include(INCLUDES."/header.html");
	
	
 ?> 

<!-- Form -->	
<form class="form-horizontal">
<fieldset>

<h2>Add an event</h2>
<hr class="under-heading" />

  <div class="form-group">
    <label for="event-title">Event title:</label>
    <input type="text" class="form-control" id="event-title" placeholder="Email">
  </div>

<!-- Multiple Radios -->
<div class="form-group">
  <label class="control-label" for="audience-radios">Audience</label>
  <div class="">
  <div class="radio">
    <label for="audience-radios-0">
      <input type="radio" name="audience-radios" id="audience-radios-0" value="family" checked="checked">
      <strong>Family friendly</strong>: Adults are specifically encouraged to bring their children.
    </label>
	</div>
  <div class="radio">
    <label for="audience-radios-1">
      <input type="radio" name="audience-radios" id="audience-radios-1" value="general">
      <strong>General</strong>: Mostly intended for adults. Well-behaved kids are welcome, but they might be bored.
    </label>
	</div>
  <div class="radio">
    <label for="audience-radios-2">
      <input type="radio" name="audience-radios" id="audience-radios-2" value="adult">
      <strong>21+ only</strong>: Typically this is because the event takes place in a bar. 
    </label>
	</div>
  </div>
</div>

<!-- Textarea -->
<div class="form-group">
  <label class=" control-label" for="description">Description</label>
  <div class="">                     
    <p>You MUST LIST FEES here. If you don't mention any fees in the description, then people will assume the event is free. Some other things to mention: Helmet? Pace? Hills? End point? <a href="#">More</a></p>
    <textarea class="form-control" id="description" name="description"></textarea>
  </div>
</div>

<!-- Text input-->
<div class="form-group">
  <label class=" control-label" for="venue-name">Venue name</label> 
  <p>If the event's meeting place is a park or business, put its name here. Otherwise leave this field blank. When you put a value here, the calendar software will try to look up an address for that name and fill in the "Address" field below.</p> 
  <input id="venue-name" name="venue-name" type="text" placeholder="" class="form-control input-md">    
  </div>

<!-- Text input-->
<div class="form-group">
  <label class=" control-label" for="venue-address">Address</label>  
  <p> 	
Give either a street address or cross streets. Ideally this value should be parseable by online maps such as Google Maps. If you haven't chosen a location yet, just say "TBA" for now. <a href="#">More</a></p>
  <input id="venue-address" name="venue-address" type="text" placeholder="" class="form-control input-md" required="">
</div>

<!-- Select Basic -->
<div class="form-group">
  <label class=" control-label" for="date">Date</label>
  <p>Choose a date from the pulldown menu. If the date you want isn't listed here, then you'll need to use the "long version" of the form which allows you to type in any date or combination of dates. </p>
    <select id="date" name="date" class="form-control">
      <option value="1">Option one</option>
      <option value="2">Option two</option>
    </select>
</div>

<!-- Select Basic -->
<div class="form-group">
  <label class=" control-label" for="time">Time</label>
  <p> 	
Within each day, the calendar will list events sorted by this time. This should generally be the start time of your event. If your event has multiple times (e.g., a "meet time" and a "ride time"), I suggest you put the first time here and describe the later times in the details field, below.</p>
    <select id="time" name="time" class="form-control">
      <option value="1">Option one</option>
      <option value="2">Option two</option>
    </select>
  </div>

<!-- Text input-->
<div class="form-group">
  <label class=" control-label" for="name">Your name</label>  
  <p>The name you supply here will be published in both the printed and online versions of the calendar. If you're shy, make up a name.</p>
  <input id="name" name="name" type="text" placeholder="" class="form-control input-md" required="">
 </div>

<!-- Text input-->
<div class="form-group">
  <label class=" control-label" for="email">Your email address</label>  
  <p>This must be a valid email address where we can reach you. When you add your event, a confirmation message will be mailed to this address telling you how you can edit it later. <a href="#">More</a></p>
  <input id="email" name="email" type="text" placeholder="" class="form-control input-md" required="">
 </div>

<!-- Multiple Checkboxes -->
<div class="form-group">
<label class="checkbox-inline">
  <input type="checkbox" id="inlineCheckbox1" value="option1"> Send forum messages to this address
</label>
<label class="checkbox-inline">
  <input type="checkbox" id="inlineCheckbox1" value="option1"> It's okay to publish this email address
</label>
</div>

<p><strong>Tips for Ride Leaders</strong>: For tips on making your ride successful, we ask that you read the Ride Leading Comic at least once before submitting an event. </p>
<label class="radio-inline">
  <input type="radio" name="inlineRadioOptions" id="inlineRadio1" value="option1"> I have read it
</label>
<label class="radio-inline">
  <input type="radio" name="inlineRadioOptions" id="inlineRadio2" value="option2"> I want to read it now!
</label>

<!-- Button -->
<div class="form-group">
  <label class=" control-label" for="event-submit"></label>
  <div class="">
    <button id="event-submit" name="event-submit" class="btn btn-primary">Add this event</button>
  </div>
</div>

</fieldset>
</form>
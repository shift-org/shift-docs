See also:

  * [schema_explanation.txt](https://github.com/shift-org/shift-docs/blob/main/legacy/cal/doc/schema_explanation.txt)
  * [legacy create table](https://github.com/shift-org/shift-docs/blob/main/admclobber.php)

# calevent:
  - **id**, primary key. 
    
    ex. 6245

  - **modified**, timestamp:

    ex. 2022-10-01 19:41:25
    
  - **changes** int
  
    sequential counter indicated the number of time the organizer has changed the event. used primarily for the calendar feed so that ical clients will notice when changes to the event have occurred. also used for event image cache busting.

  - **name** string

    the organizer's provided name 
  
  - **email** string, **hideemail** bool, **printemail** bool

    the organizer's email address;
    show email on the online calendar;
    publish email in the print calendar.

  - **phone** string, **hidephone** bool, **printphone** bool

    the organizer's phone number ( optional )

  - **weburl** string, **webname** string, **printweburl** bool:

    event web site for ride info
  
  - **contact** string, **hidecontact** bool, **printcontact** bool

    any additional contact info provided by the suer

  - **title** string

    event title.

  - **tinytitle** string 

    event string used for the printed calendar.
    if not specified, manage_event.php slices the first 24 characters of the long title.

  - **audience** char

    * G: general.
    * F: family friendly
    * A: adult ( 21 + )
    
  - **descr** text, **printdescr** text

    event description for website and print calendar.

  - **image** string

    server location is configured via config.php:
      $IMAGEDIR = "/opt/backend/eventimages";
      $IMAGEURL = "/eventimages";
    
    mange_event.php accepts gif, jpeg, pjpeg, png, up to 2 megs.
    https://flourishlib.com/docs/fValidation.html
    https://flourishlib.com/docs/fUpload.html

  - **tinytitle** string
  

  - **datestype** char
  
    i believe this is legacy information
  
    * O=one day
    * C=consecutive
    * S=scattered

  - **eventtime** time ( aka eventTime )

    there is one time for all events even if they occur on multiple days.
    additional times can described in the timedetails.

  - **eventduration** int

    organizer provided number of minutes; has to be a number.

  - **timedetails** string

    extra details about the event time.

  - **locname** string

    arbitrary name provided by the organizer

  - **address** string

    "", TBD, TBA
    can be a url ( ex. google maps )

  - **locdetails** string

    extra details about the location.

  - **locend** string

    specifics about the end of the ride.

  - **loopride** bool

    whether the organizer considers the ride to be a loop
 
  - **area** char

    * P: Portland
    * V: Vancouver

  - **review** char 

    * I: Inspect
    * E: Exclude
    * A: Approved
    * S: SentEmail
    : R: Revised

  - **highlight** bool 

    featured events 
    *TODO*: ore detail.

  - **hidden** bool

    has the event been published?
    ( ie. has the person read their email and clicked the password link? )

  - **password** string(50)

    sent to the organizer in email
    https://localhost:4443/addevent/edit-ID-PASSWORD

  - **safetyplan** bool
  
    has the organizer checked the "covid safety plan" checkbox?**

## old unused fields?
  - addressverified char
    
    * Y: yes 
    * X: no
    
  - dates string
    
    ex. "Every Sunday"
    
  - emailforum bool
  - imageheight, imagewidth int
  
  - nestflag char
  
    * F=festival
    * G=group
    * else normal event
    
  - nestid key
  - ridelength string
  - external string
  - source string


# caldaily:

Represents a single occurrence on a particular day of a **calevent**.

Although the table has its own auto incrementing primary key (pkid),
the application keeps the (cal event id, event date) pairing unique.
That pairing is, in a sense, its true identity.

  - **pkid** (primary key)

    ex. 13651

  - **modified** timestamp 

    ex. 2023-02-27 18:59:39
  
  - **id** (foreign key)

    references the calevent table.

  - **eventdate** date

    ex. 2023-02-23
    indexed.

  - **newsflash** text

    When an organizer reschedules a ride, they can add "Newsflash" text to explain why.

    see for an example -- /Users/ionous/Dev/shift/shift-docs/site/static/images/uploads/rescheduling-a-ride.png 

  - **eventstatus** char
  
    * A=as scheduled
    * C=canceled
    * D=delisted - just removed, not explicitly canceled
    * S=skipped   - legacy
    * E=exception - legacy
    
  - **exceptionid** key
  
    re: eventstatus 'E'

    this might be legacy. it seems to be trying to load event data into the ORM during getEvent() using either the "id" or the "exceptionid" column, but its not specifying a value for the column so i wonder if that works ( it has an exception handler which by default creates/attaches to a blank event. )


# Old Unused Tables
----------------------------------
caladdress:
- canon string (primary key)
- address string
- locname string
- area char
- locked bool


calcount:
- fromdate date
- todate date
- whendate date
- count key
 

calforum:
- modified timestamp 
- msgid primary key
- id key
- organizer bool
- name string
- subject string
- msg text
 

calshare:
- sharename string
- shareevents string
 

mugDialog:
- dialog_id primary key
- chatter string 
 

mugdialog:
- dialog_id primary key
- chatter string 
  

pp20apr2006:
- id primary key
- name string 
- email string 
- hideemail bool 
- phone string 
- hidephone bool 
- weburl string 
- webname string 
- contact string 
- hidecontact bool 
- title string 
- tinytitle string 
- audience char 
- descr text 
- newsflash text 
- image string 
- imageheight key 
- imagewidth key 
- eventdate date  DEFAULT '0000-00-00'
- reqdate bool 
- eventtime time  DEFAULT '00:00:00'
- timedetails string 
- repeats bool 
- address string 
- addressverified char 
- locdetails string 
- area char 
 

ppdistro:
- id primary key
- location string(75) 
- whodelivered string(25) 


ppforum:
- modified timestamp  
- msgid primary key
- id key 
- organizer bool 
- name string 
- subject string 
- body text 
 

rideIdea:
- id primary key
- ride string 
- contact string(26) 
- IP string(15) 
- datePosted timestamp  


rideidea:
- id primary key
- ride string 
- contact string(26) 
- IP string(15) 
- datePosted timestamp  
 

sched:
- modified timestamp  
-  id primary key
-  name string 
-  email string 
-  hideemail bool 
-  emailforum bool 
-  printemail bool 
-  phone string 
-  hidephone bool 
-  printphone bool 
-  weburl string 
-  webname string 
-  printweburl bool 
-  contact string 
-  hidecontact bool 
-  printcontact bool 
-  title string 
-  tinytitle string 
-  audience char 
-  descr text 
-  printdescr text 
-  newsflash text 
-  image string 
-  imageheight key 
-  imagewidth key 
-  eventdate date  DEFAULT '0000-00-00'
-  reqdate bool 
-  eventtime time  DEFAULT '00:00:00'
-  eventduration key 
-  timedetails string 
-  repeats bool 
-  address string 
-  addressverified char 
-  locdetails string 
-  area char 
-  headcount key 
-  newbiecount key 
-  ridereport text 

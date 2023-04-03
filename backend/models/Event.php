<?php

// Represents a single repeatable event occuring at one set time on one or more days.
// Maps to the mysql 'calevent' table. 
class Event extends fActiveRecord {

    // returns a summary of this event, suitable for use in a json response.
    // by default, excludes any details the organizer has marked as "private.
    // ( ex. email, phone, and contact info )
    public function toArray($include_private=false) {
        /*
        id:
        title:
        
        (different table!) date:
        venue:
        address:
        organizer:
        email:
        details:
        length:
        */
        $duration = $this->getEventduration();
        $details = array(
            'id' => $this->getId(),
            'title' => $this->getTitle(),
            'venue' => $this->getLocname(),
            'address' => $this->getAddress(),
            'organizer' => $this->getName(),
            'details' => $this->getDescr(),
            'time' => strval($this->getEventtime()),
            'hideemail' => $this->getHideemail() != 0,
            'hidephone' => $this->getHidephone() != 0,
            'hidecontact' => $this->getHidecontact() != 0,
            'length' => NULL,
            //'length' => $this->getLength(),
            'timedetails' => $this->getTimedetails(),
            'locdetails' => $this->getLocdetails(),
            'loopride' => $this->getLoopride() != 0,
            'locend' => $this->getLocend(),
            'eventduration' => ($duration != null && $duration > 0) ? $duration: null,
            'weburl' => $this->getWeburl(),
            'webname' => $this->getWebname(),
            // fix? it feels wrong to "store()" on "get()"
            // are there any entries in the existing data that arent in the right place?  
            // if they are all ok, then maybe toArray() could avoid calling this.
            'image' => $this->updateImageUrl(true),
            'audience' => $this->getAudience(),
            //'printevent' => $this->getPrintevent(),
            'tinytitle' => $this->getTinytitle(),
            'printdescr' => $this->getPrintdescr(),
            'datestype' => $this->getDatestype(),
            'area' => $this->getArea(),
            'featured' => $this->getHighlight() != 0,
            'printemail' => $this->getPrintemail() != 0,
            'printphone' => $this->getPrintphone() != 0,
            'printweburl' => $this->getPrintweburl() != 0,
            'printcontact' => $this->getPrintcontact() != 0,
            'published' => $this->isPublished(),
            'safetyplan' => $this->getSafetyplan() != 0,
        );

        $details['email']   = $this->getHideemail() == 0   || $include_private ? $this->getEmail() : null;
        $details['phone']   = $this->getHidephone() == 0   || $include_private ? $this->getPhone() : null;
        $details['contact'] = $this->getHidecontact() == 0 || $include_private ? $this->getContact() : null;

        return $details;
    }

    // return the specified Event, or null if no such event was found.
    public static function getByID($id) {
        try {
            return new Event($id);
        } catch (fNotFoundException $e) {
            return null;
        }
    }

    // load an Event and set its fields from the passed input.
    public static function fromArray($input) {
        $event = null;
        if (array_key_exists('id', $input)) {
            $event = Event::getByID($input['id']);
        }
        if ($event == null) {
            $event = new Event();
            $event->generateSecret();
            $event->setHidden(1);
        }

        // These are marked as required
        $event->setTitle(get($input['title'], 'Title missing'));
        $event->setLocname(get($input['venue'], 'Venue missing'));
        $event->setAddress(get($input['address'], 'Address missing'));
        $event->setName(get($input['organizer'], 'Organizer missing'));
        $event->setEmail(get($input['email'], 'Email missing'));

        // These are optional
        $event->setHideemail(get($input['hideemail'], 0));
        $event->setPhone(get($input['phone'], ''));
        $event->setHidephone(get($input['hidephone'], 0));
        $event->setContact(get($input['contact'], ''));
        $event->setHidecontact(get($input['hidecontact'], 0));
        $event->setDescr(get($input['details'], ''));
        $event->setEventtime(get($input['time'], ''));
        // default highlight to off (zero); but if it's already set, leave it as-is
        if ( $event->getHighlight() == null ) {
          $event->setHighlight(0);
        }
        $event->setTimedetails(get($input['timedetails'], ''));
        $event->setLocdetails(get($input['locdetails'], ''));
        $event->setLoopride(get($input['loopride'], 0));
        $event->setLocend(get($input['locend'], ''));
        $event->setEventduration(get($input['eventduration'], 0));
        $event->setWeburl(get($input['weburl'], ''));
        $event->setWebname(get($input['webname'], ''));
        $event->setAudience(get($input['audience'], ''));
        $event->setTinytitle(get($input['tinytitle'], ''));
        $event->setPrintdescr(get($input['printdescr'], ''));
        $event->setDates(get($input['datestring'], '')); // string field 'dates' needed for legacy admin calendar
        $event->setDatestype(get($input['datestype'], 'O'));
        $event->setArea(get($input['area'], 'P')); // default to 'P'ortland
        $event->setPrintemail(get($input['printemail'], 0));
        $event->setPrintphone(get($input['printphone'], 0));
        $event->setPrintweburl(get($input['printweburl'], 0));
        $event->setPrintcontact(get($input['printcontact'], 0));
        $event->setSafetyplan(get($input['safetyplan'], 0));
        // Length
        return $event;
    }

    // cancel all occurrences of this event, and make it inaccessible to the organizer.
    public function cancelEvent() {
        $eventTimes = $this->buildEventTimes('id');
        foreach ($eventTimes as $eventTime) {
            $eventTime->cancelOccurrence();
        }
        $this->setPassword(""); 
        $this->storeChange();
    }

    private function getEventDateStatuses() {
        $eventDateStatuses = array();
        $eventTimes = $this->buildEventTimes('id');
        foreach ($eventTimes as $eventTime) {
            $eventDateStatuses []= $eventTime->getFormattedDateStatus();
        }
        return $eventDateStatuses;
    }

    // return a summary of the Event and all its EventTime(s)
    // optionally, pass a prebuilt list of formatted times.
    public function toDetailArray($include_private=false, $eventTimes=null) {
        // first get the data into an array
        $detailArray = $this->toArray($include_private);
        // add all times that exist, maybe none.
        if ($eventTimes === null) {
            $eventTimes = $this->getEventDateStatuses();
        }
        $detailArray["datestatuses"] = $eventTimes;
        return $detailArray;
    }

    // if the secret is valid and matches the password of this Event.
    // ( the password of the event is set at creation time, and cleared when 'deleted' )
    public function secretValid($secret) {
        return $secret && ($this->getPassword() == $secret);
    }

    private function generateSecret() {
        $this->setPassword(md5(drupal_random_bytes(32)));
    }

    public function emailSecret() {
        global $PROTOCOL, $HOST, $PATH;
        $base = $PROTOCOL . $HOST . $PATH;
        $base = trim($base, '/'); // remove trailing slashes

        $event_id = $this->getId();
        $secret = $this->getPassword();
        $secret_url = "$base/addevent/edit-$event_id-$secret";

        $headers = 'From: bikefun@shift2bikes.org' . "\r\n" .  'Reply-To: bikefun@shift2bikes.org' . "\r\n";
        $subject = "Shift2Bikes Secret URL for " . $this->getTitle();
        $message = "Dear " . $this->getName();
        $message = $message . ", \r\n\r\nThank you for adding your event, " . $this->getTitle();
        $message = $message . ", to the Shift Calendar. To activate the event listing, you must visit " . $secret_url . " and publish it.";
        $message = $message . "\r\n\r\nThis link is like a password. Anyone who has it can delete and change your event. Please keep this email so you can manage your event in the future.";
        $message = $message . "\r\n\r\nBike on!\r\n\r\n-Shift";
        mail($this->getEmail(), $subject, $message, $headers);
	# send backup copy for debugging and/or moderating
        mail("shift-event-email-archives@googlegroups.com", $subject, $message, $headers);
    }

    public function isPublished() {
        return $this->getHidden() == 0;
    }

    public function setPublished() {
        if ($this->getHidden() != 0) {
            $this->setHidden(0);
        }
    }

    // prefer this instead of "store" in most cases.
    // it updates the sequence counter so ical clients will notice a change in the event.
    public function storeChange() {
        $existed = $this->exists();
        // if the id exists, we can update the image here ( and reduce the calls to store. )
        if ($existed) {
            $this->updateImageUrl(false);
        }
        $this->setChanges($this->getChanges() + 1);
        $this->store();
        // fix? b/c the image path is based on the id:
        // for new events, this requires a double store(). 
        if (!$existed) {
            // oto -- the html says: "To add an image, save and confirm the event first."
            // so in practice, this will never store an image here.
            $this->updateImageUrl(true);
        }
    }

    // ensure that the image is stored in the right location, and 
    // return the path to the image.
    private function updateImageUrl($storeIfChanged) {
        global $IMAGEDIR;
        global $IMAGEURL;

        $old_name = $this->getImage();
        if ($old_name == null) {
            return null;
        }

        $old_path = "$IMAGEDIR/$old_name";
        $id = $this->getId();

        // What the name should be
        $t = pathinfo($old_name);
        $ext = $t['extension'];
        $new_name = "$id.$ext";

        if ($old_name !== $new_name) {
            // Named incorrectly, move, update db, return
            $new_path = "$IMAGEDIR/$new_name";

            if (file_exists($old_path)) {
                // note: rename() overwrites existing.
                rename($old_path, $new_path);
                $this->setImage($new_name);
                if ($storeIfChanged) {
                    $this->store();
                }
            }
        }
        // ex. https://shift2bikes.org/eventimages/9248.png
        return "$IMAGEURL/$new_name";
    }
}

fORM::mapClassToTable('Event', 'calevent');

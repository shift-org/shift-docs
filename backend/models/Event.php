<?php

class Event extends fActiveRecord {
    public function toArray($include_hidden=false) {
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
            'eventduration' => $this->getEventduration() != null && $this->getEventduration() > 0 ? $this->getEventduration() : null,
            'weburl' => $this->getWeburl(),
            'webname' => $this->getWebname(),
            'image' => $this->getImageUrl(),
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
            'published' => $this->getHidden() == 0,
            'safetyplan' => $this->getSafetyplan() != 0,
        );

        $details['email']   = $this->getHideemail() == 0   || $include_hidden ? $this->getEmail() : null;
        $details['phone']   = $this->getHidephone() == 0   || $include_hidden ? $this->getPhone() : null;
        $details['contact'] = $this->getHidecontact() == 0 || $include_hidden ? $this->getContact() : null;

        return $details;
    }

    public static function fromArray($input) {
        $event = null;
        if (array_key_exists('id', $input)) {
            try {
                // get event by id
                $event = new Event($input['id']);
            } catch (fExpectedException $e) {}
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

    public function updateExistingEventTimes($dateStatuses) {
        foreach ($this->buildEventTimes('id') as $eventTime) {
            // For all existing EventTimes in the db
            // Delete or update
            $eventTime->matchToDateStatus($dateStatuses);
        }

        // Flourish is suck. I can't figure out the "right" way to do one-to-many cause docs are crap
        // This clears a cache that causes subsequent operations (buildEventTimes) to return stale data
        $this->related_records = array();
    }

    public function addEventTime($dateStatus) {
        EventTime::createNewEventTime($this->getId(), $dateStatus);
    }

    private function getDates() {
        $eventTimes = $this->buildEventTimes('id');
        $eventDates = [];
        foreach ($eventTimes as $eventTime) {
            $eventDates []= $eventTime->getFormattedDate();
        }
        return $eventDates;
    }

    private function getEventDateStatuses() {
        $eventTimes = $this->buildEventTimes('id');
        $eventDateStatuses = array();
        foreach ($eventTimes as $eventTime) {
            $eventDateStatuses []= $eventTime->getFormattedDateStatus();
        }
        return $eventDateStatuses;
    }

    public function toDetailArray($include_hidden=false) {
        // first get the data into an array
        $detailArray = $this->toArray($include_hidden);
        // add all times that exist, maybe none.
        $detailArray["datestatuses"] = $this->getEventDateStatuses();
        // return potentially augmented array
        return $detailArray;
    }

    public function secretValid($secret) {
        return $this->getPassword() == $secret;
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

    public function unhide() {
        if ($this->getHidden() != 0) {
            $this->setHidden(0);
            $this->store();
        }
    }

    private function getImageUrl() {
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
                rename($old_path, $new_path);
                $this->setImage($new_name);
                $this->store();
            }
        }

        return "$IMAGEURL/$new_name";
    }

}

fORM::mapClassToTable('Event', 'calevent');

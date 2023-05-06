<?php

// EventTime - represents one occurrence of an event on a particular day.
// Maps to the mysql 'caldaily' table.
class EventTime extends fActiveRecord {

    // record a new occurrence of an existing event in the database.
    // dateStatus['date'] is YYYY-MM-DD
    private static function createNewEventTime($eventId, $dateStatus) {
        $date = $dateStatus['date'];
        $newsflash = $dateStatus['newsflash'];
        $status = $dateStatus['status'];
        $eventTime = new EventTime();
        $eventTime->setModified(time());
        $eventTime->setId($eventId);
        $eventTime->setEventdate($date);
        $eventTime->setEventstatus($status);
        $eventTime->setNewsflash($newsflash);
        $eventTime->store();
        return $eventTime;
    }
    
    /**
     * Add, cancel, and update occurrences of a particular event.
     * 
     * @param  Event  the relevant event.
     * @param  array  $statusMap containing {YYYY-MM-DD: dateStatus }
     * @return array  json friendly date status records
     * 
     * @see: DateStatus.php, manage_event.php
     */
    public static function reconcile($event, $statusMap) {
        $out = array();
        $eventTimes = $event->buildEventTimes('id');
        $published = $event->isPublished();
        foreach ($eventTimes as $at) {
            // the map is keyed by date string:
            $date = $at->getFormattedDate();
            $status = $statusMap[$date];
            // if our event time is still desired by the organizer:
            // update the status with whatever the organizer provided.
            // otherwise: the organizer wants to remove the occurrence.
            // so cancel or delete the time depending on whether the event is published.
            if ($status) {
                $at->updateStatus($status);  // calls store() if changed.
                unset($statusMap[$date]);    // remove from the map so we dont create it (below)
                $out []= $at->getFormattedDateStatus(); // append
            } elseif ($published) {
                $at->cancelOccurrence(); // calls store() if changed.
                $out []= $at->getFormattedDateStatus(); //  append
            } else {
                $at->delete();
            }
        }
        // create any (new) days the organizer requested:
        foreach ($statusMap as $dateStatus) {
            $at = EventTime::createNewEventTime($event->getId(), $dateStatus);
            $out []= $at->getFormattedDateStatus(); // append
        }
        return $out;
    }

    // return the specified EventTime, but only for published Events.
    public static function getByID($id) {
        return fRecordSet::build(
            'EventTime', // class
            array(
                'pkid=' => $id,
                'calevent{id}.hidden!' => 1,  // hidden is 0 once published
            )
        );
    }

    // Find all occurrences of any EventTime within the specified date range.
    // Dates are in the "YYYY-MM-DD" format. ( ex. 2006-01-02 )
    public static function getRangeVisible($firstDay, $lastDay) {
        return fRecordSet::build(
            'EventTime', // class
            array(
                'eventdate>=' => $firstDay,
                'eventdate<=' => $lastDay,
                'calevent{id}.hidden!' => 1,  // hidden is 0 once published
                'eventstatus!' => 'S',        // 'S', skipped, a legacy status code.
                'calevent{id}.review!' => 'E' // 'E', excluded, a legacy status code.
            ), // where
            array('eventdate' => 'asc')  // order by
        );
    }

    // Mark this particular occurrence as cancelled, updating the db.
    public function cancelOccurrence() {
        if ($this->getEventstatus() !== 'C') {
            $this->setEventstatus('C');
            $this->store();
        }
    }

    // store the status and newflash if they changed.
    private function updateStatus($dateStatus) {
        $changed = false;
        if ($this->getEventstatus() !== $dateStatus['status']) {
            // EventTime status is different than the request, update EventTime db entry
            $this->setEventstatus($dateStatus['status']);
            $changed = true;
        }
        if ($this->getNewsflash() !== $dateStatus['newsflash']) {
            // EventTime newsflash is different than the request, update EventTime db entry
            $this->setNewsflash($dateStatus['newsflash']);
            $changed = true;
        }
        if ($changed) {
            $this->store();
        }
    }

    public function getEvent() {
        try {
            if ($this->getEventstatus() === 'E') {
                return $this->createEvent('exceptionid');
            }
            return $this->createEvent('id');
        }
        catch (fNotFoundException $e) {
            return new Event();
        }
    }

    // derive an end time from the passed data
    // TBD: move to Event.php? the data comes from there, and doesn't use any locals.
    private function getEndTime($starttime, $duration) {
        if ($duration == null) {
            return null;
        }
        $endtime = new DateTime($starttime);
        $endtime->modify("+{$duration} minutes");
        return $endtime->format('H:i:s');
    }

    // returns a date in YYYY-MM-DD format ( ex. 2006-01-02 )
    public function getFormattedDate() {
        // note: dates are represented as fDate
        // https://flourishlib.com/docs/fDate.html
        return $this->getEventdate()->format('Y-m-d');
    }

    // return an object containing: {
    //   id:   EventTime primary key.
    //   date: YYYY-MM-DD ( ex. 2006-01-02 )
    //   status: a single letter: 'A' for active, or 'C' for cancelled.
    //   newsflash: a special bit of text from the user, typically for canceled or rescheduled events.
    // }
    // @see DateStatus.php
    public function getFormattedDateStatus() {
        return [ 
            'id' => $this->getPkid(), // Get ID for this EventTime
            'date' => $this->getFormattedDate(), // Get pretty date
            'status' => $this->getEventstatus(),
            'newsflash' => $this->getNewsflash()
        ];
    }

    // return a url which provides a view of this particular occurrence.
    // ex. https://localhost:4443/calendar/event-13662
    public function getShareable() {
        global $PROTOCOL, $HOST, $PATH;
        $base = trim($PROTOCOL . $HOST . $PATH, '/');

        $caldaily_id = $this->getPkid();
        return "$base/calendar/event-" . $caldaily_id;
    }

    // return true if the event has been cancelled; false otherwise.
    public function getCancelled() {
        return $this->getEventstatus() == 'C';
    }

    // combine the parent event and this one occurrence of that event
    // into a json friendly object.
    public function toEventSummaryArray() {
        $eventArray = $this->getEvent()->toArray();
        $eventArray['date'] = $this->getFormattedDate();
        $eventArray['caldaily_id'] = $this->getPkid();
        $eventArray['shareable'] = $this->getShareable();
        $eventArray['cancelled'] = $this->getCancelled();
        $eventArray['newsflash'] = $this->getNewsflash();
        $eventArray['endtime'] = $this->getEndTime(
            $eventArray['time'], 
            $eventArray['eventduration']);

        return $eventArray;
    }
}

fORM::mapClassToTable('EventTime', 'caldaily');

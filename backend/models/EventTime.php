<?php

// EventTime - represents one occurrence of an event on a particular day.
// Maps to the mysql 'caldaily' table.
class EventTime extends fActiveRecord {
	// record a new occurrence of an existing event in the database.
    // dateStatus['date'] is a php DateTime.
    public static function createNewEventTime($eventId, $dateStatus) {
        $date = $dateStatus['date'];
        $newsflash = $dateStatus['newsflash'];
        $status = $dateStatus['status'];

        $eventTime = new EventTime();
        $eventTime->setModified(time());
        $eventTime->setId($eventId);
        $eventTime->setEventdate($date->format('Y-m-d'));
        $eventTime->setEventstatus($status);
        $eventTime->setNewsflash($newsflash);
        $eventTime->store();
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

    public function matchToDateStatus($dateStatuses) {
        $dateStatusId = $this->getPkid();
        if (!isset($dateStatuses[$dateStatusId])) {
            // EventTime exists in db but not in request
            // They didn't resubmit this existing date - delete it
            // TODO: Think about making the deletion functionality its own API endpoint
            $this->delete();
        } else {
            // EventTime exists in request and in db
            // Update the existing EventTime and remove it from the array of new EventTimes
            $this->updateStatus($dateStatuses[$dateStatusId]);
        }
    }

    // store the status and newflash if they changed.
    private function updateStatus($dateStatus) {
        if ($this->getEventstatus() !== $dateStatus['status']) {
            // EventTime status is different than the request, update EventTime db entry
            $this->setEventstatus($dateStatus['status']);
        }
        if ($this->getNewsflash() !== $dateStatus['newsflash']) {
            // EventTime newsflash is different than the request, update EventTime db entry
            $this->setNewsflash($dateStatus['newsflash']);
        }
        $this->store();
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
    // TBD: is this needed? isnt it already in the proper format?
    public function getFormattedDate() {
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
        $dateObject = array();
        $dateObject['id'] = $this->getPkid(); // Get ID for this EventTime
        $dateObject['date'] = $this->getFormattedDate(); // Get pretty date
        $dateObject['status'] = $this->getEventstatus();
        $dateObject['newsflash'] = $this->getNewsflash();
        return $dateObject;
    }

    // return a url which provides a view of this particular occurrence.
    // ex. https://localhost:4443/calendar/event-13662
    protected function getShareable() {
        global $PROTOCOL, $HOST, $PATH;
        $base = trim($PROTOCOL . $HOST . $PATH, '/');

        $caldaily_id = $this->getPkid();
        return "$base/calendar/event-" . $caldaily_id;
    }

    // return true if the event has been cancelled; false otherwise.
    protected function getCancelled() {
        if ($this->getEventstatus() == 'C') {
            return true;
        } else {
            return false;
        }
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

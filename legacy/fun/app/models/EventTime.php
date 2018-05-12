<?php

class EventTime extends fActiveRecord {

    public static function matchEventTimesToDates($event, $phpDates) {
        $dates = array();
        foreach ($phpDates as $dateVal) {
            $dates []= $dateVal->format('Y-m-d');
        }

        foreach ($event->buildEventTimes('id') as $eventTime) {
            // For all existing dates
            $formattedDate = $eventTime->getFormattedDate();
            if (!in_array($formattedDate, $dates)) {
                // If they didn't submit this existing date delete it
                $eventTime->delete();
            }
            else {
                if (($key = array_search($formattedDate, $dates)) !== false) {
                    unset($dates[$key]);
                }
            }
        }
        foreach ($dates as $newDate) {
            $eventTime = new EventTime();
            $eventTime->setModified(time());
            $eventTime->setId($event->getId());
            $eventTime->setEventdate($newDate);
            $eventTime->setEventstatus('A');
            $eventTime->store();
        }
        // Flourish is suck. I can't figure out the "right" way to do one-to-many cause docs are crap
        // This clears a cache that causes subsequent operations (buildEventTimes) to return stale data
        $event->related_records = array();
    }

    public static function getByID($id) {
        return fRecordSet::build(
            'EventTime', // class
            array(
                'pkid=' => $id
            )
        );
    }

    public static function getRangeVisible($firstDay, $lastDay) {
        return fRecordSet::build(
            'EventTime', // class
            array(
                'eventdate>=' => $firstDay,
                'eventdate<=' => $lastDay,
                'calevent{id}.hidden!' => 1,
                'eventstatus!' => 'S',
                'calevent{id}.review!' => 'E' // 'E'xcluded
            ), // where
            array('eventdate' => 'asc')  // order by
        );
    }

    private function getEvent() {
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

    private function getEndTime($starttime, $duration) {
        if ($duration == null) {
            return null;
        }
        $endtime = new DateTime($starttime);
        $endtime->modify("+{$duration} minutes");
        return $endtime->format('H:i:s');
    }

    public function getFormattedDate() {
        return $this->getEventdate()->format('Y-m-d');
    }

    protected function getShareable() {
        global $PROTOCOL, $HOST, $PATH;
        $base = trim($PROTOCOL . $HOST . $PATH, '/');

        $caldaily_id = $this->getPkid();
        return "$base/event-" . $caldaily_id;
    }

    public function toEventSummaryArray() {
        $eventArray = $this->getEvent()->toArray();
        $eventArray['date'] = $this->getFormattedDate();
        $eventArray['caldaily_id'] = $this->getPkid();
        $eventArray['shareable'] = $this->getShareable();
        $eventArray['cancelled'] = $this->getEventstatus() == 'C';
        $eventArray['newsflash'] = $this->getNewsflash();
        $eventArray['endtime'] = $this->getEndTime($eventArray['time'], $eventArray['eventduration']);

        return $eventArray;
    }
}

fORM::mapClassToTable('EventTime', 'caldaily');

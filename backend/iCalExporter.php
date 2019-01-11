<?php

/**
 * Exports calendar events
 */
class iCalExporter {

	/**
	 * @var Event
	 */
	protected $event;

	/**
	 * @var string
	 */
	protected $exportString;

	public function __construct( Event $event ) {
		$this->event = $event;
		$this->export = '';
	}

	public function export() {
		if ( empty( $this->exportString ) ) {
			$this->buildExport();
		}
		return $this->exportString;
	}

	protected function buildExport() {
		global $HOST;
		$details = @$this->event->toDetailArray();
		$this->append( 'BEGIN:VCALENDAR' );
		$this->append( 'VERSION:2.0' );
		$this->append( "PRODID:-//$HOST//NONSGML shiftcal v2.0//EN" );

		foreach ( $this->event->buildEventTimes('id') as $date ) {
			$this->append( 'BEGIN:VEVENT' );
			$dateId = $date->getPkid();
			$this->append( "UID:event-{$details['id']}-$dateId@$HOST" );

			$modifiedString = $this->formatTime(
				$date->getModified()->format( 'U' )
			);
			$this->append( "DTSTAMP:$modifiedString" );
			if ( !empty( $details['email'] ) ) {
				$this->append( "ORGANIZER:mailto:{$details['email']}" );
			}

			$dateObject = new DateTime( (string)$date->getEventdate() );
			list( $hour, $minute, $second ) = explode( ':', $details['time'] );
			$dateObject->setTime( $hour, $minute, $second );
			$startString = $this->formatTime( $dateObject->getTimestamp() );
			$this->append( "DTSTART:$startString" );
			if ( !empty( $details['eventduration'] ) ) {
				$durString = "PT{$details['eventduration']}M";
				$dateObject->add( new DateInterval( $durString ) );
				$endString = $this->formatTime( $dateObject->getTimestamp() );
				$this->append( "DTEND:$endString" );
			}
			$location = $this->formatLocation( $details );
			if ( !empty( $location ) ) {
				$this->append( "LOCATION:$location" );
			}
			$this->append( "SUMMARY:{$details['title']}" );
			$this->append( "DESCRIPTION:{$details['details']}" );
			$this->append( 'END:VEVENT' );
		}
		$this->append( 'END:VCALENDAR' );
	}

	protected function formatTime( $timestamp ) {
		$date = new DateTime( "@$timestamp", new DateTimeZone( 'UTC' ) );
		return $date->format( 'Ymd\THis\Z' );
	}

	protected function formatLocation( $details ) {
		$parts = array();
		if ( !empty( $details['venue'] ) ) {
			$parts[] = $details['venue'];
		}
		if ( !empty( $details['address'] ) ) {
			$parts[] = $details['address'];
		}
		$address = implode( ', ', $parts );
		if ( !empty( $details['locdetails'] ) ) {
			$address .= "  {$details['locdetails']}";
		}
		return $address;
	}

	protected function append( $string ) {
		$string = preg_replace( "/[\r\n]+/", " ", $string );
		$string = wordwrap( $string, 74, " \r\n " );
		$this->exportString .= "$string\r\n";
	}
}

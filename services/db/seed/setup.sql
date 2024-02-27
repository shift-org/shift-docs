-- MySQL dump 10.13  Distrib 5.7.44, for Linux (x86_64)
--
-- Host: db    Database: shift
-- ------------------------------------------------------
-- Server version	5.7.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `caladdress`
--

-- DROP TABLE IF EXISTS `caladdress`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `caladdress` (
  `canon` varchar(255) NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `locname` varchar(255) DEFAULT NULL,
  `area` char(1) DEFAULT NULL,
  `locked` int(1) DEFAULT NULL,
  PRIMARY KEY (`canon`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `calcount`
--

-- DROP TABLE IF EXISTS `calcount`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `calcount` (
  `fromdate` date DEFAULT NULL,
  `todate` date DEFAULT NULL,
  `whendate` date DEFAULT NULL,
  `count` int(11) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `caldaily`
--

-- DROP TABLE IF EXISTS `caldaily`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `caldaily` (
  `modified` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `id` int(11) DEFAULT NULL,
  `newsflash` mediumtext,
  `eventdate` date DEFAULT NULL,
  `eventstatus` varchar(1) DEFAULT NULL,
  `exceptionid` int(11) DEFAULT NULL,
  `pkid` int(11) NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`pkid`),
  KEY `eventdate` (`eventdate`)
) ENGINE=MyISAM AUTO_INCREMENT=12941 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `calevent`
--

-- DROP TABLE IF EXISTS `calevent`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `calevent` (
  `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `modified` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `changes` int(11) DEFAULT '0',
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `hideemail` int(1) DEFAULT NULL,
  `emailforum` int(1) DEFAULT NULL,
  `printemail` int(1) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `hidephone` int(1) DEFAULT NULL,
  `printphone` int(1) DEFAULT NULL,
  `weburl` varchar(255) DEFAULT NULL,
  `webname` varchar(255) DEFAULT NULL,
  `printweburl` int(1) DEFAULT NULL,
  `contact` varchar(255) DEFAULT NULL,
  `hidecontact` int(1) DEFAULT NULL,
  `printcontact` int(1) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `tinytitle` varchar(255) NOT NULL,
  `audience` char(1) DEFAULT NULL,
  `descr` mediumtext,
  `printdescr` mediumtext,
  `image` varchar(255) DEFAULT NULL,
  `imageheight` int(11) DEFAULT NULL,
  `imagewidth` int(11) DEFAULT NULL,
  `dates` varchar(255) DEFAULT NULL,
  `datestype` char(1) DEFAULT NULL,
  `eventtime` time DEFAULT NULL,
  `eventduration` int(11) DEFAULT NULL,
  `timedetails` varchar(255) DEFAULT NULL,
  `locname` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `addressverified` char(1) DEFAULT NULL,
  `locdetails` varchar(255) DEFAULT NULL,
  `locend` varchar(255) DEFAULT NULL,
  `loopride` int(1) DEFAULT NULL,
  `area` char(1) DEFAULT NULL,
  `external` varchar(250) DEFAULT NULL,
  `source` varchar(250) DEFAULT NULL,
  `nestid` int(11) DEFAULT NULL,
  `nestflag` varchar(1) DEFAULT NULL,
  `review` char(1) NOT NULL DEFAULT 'I',
  `highlight` int(1) NOT NULL,
  `hidden` tinyint(1) DEFAULT NULL,
  `password` varchar(50) DEFAULT NULL,
  `ridelength` varchar(255) DEFAULT NULL,
  `safetyplan` int(1) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=8029 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `calforum`
--

-- DROP TABLE IF EXISTS `calforum`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `calforum` (
  `modified` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `msgid` int(11) NOT NULL AUTO_INCREMENT,
  `id` int(11) DEFAULT NULL,
  `organizer` int(1) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `msg` text,
  PRIMARY KEY (`msgid`)
) ENGINE=MyISAM AUTO_INCREMENT=5530 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `calshare`
--

-- DROP TABLE IF EXISTS `calshare`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `calshare` (
  `sharename` varchar(255) DEFAULT NULL,
  `shareevents` varchar(255) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mugDialog`
--

-- DROP TABLE IF EXISTS `mugDialog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `mugDialog` (
  `dialog_id` int(11) NOT NULL AUTO_INCREMENT,
  `chatter` varchar(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`dialog_id`)
) ENGINE=MyISAM AUTO_INCREMENT=13 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mugdialog`
--

-- DROP TABLE IF EXISTS `mugdialog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `mugdialog` (
  `dialog_id` int(11) NOT NULL AUTO_INCREMENT,
  `chatter` varchar(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`dialog_id`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pp20apr2006`
--

-- DROP TABLE IF EXISTS `pp20apr2006`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `pp20apr2006` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL DEFAULT '',
  `email` varchar(255) NOT NULL DEFAULT '',
  `hideemail` int(1) NOT NULL DEFAULT '0',
  `phone` varchar(255) NOT NULL DEFAULT '',
  `hidephone` int(1) NOT NULL DEFAULT '0',
  `weburl` varchar(255) NOT NULL DEFAULT '',
  `webname` varchar(255) NOT NULL DEFAULT '',
  `contact` varchar(255) NOT NULL DEFAULT '',
  `hidecontact` int(1) NOT NULL DEFAULT '0',
  `title` varchar(255) NOT NULL DEFAULT '',
  `tinytitle` varchar(255) NOT NULL DEFAULT '',
  `audience` char(1) NOT NULL DEFAULT '',
  `descr` text NOT NULL,
  `newsflash` text NOT NULL,
  `image` varchar(255) NOT NULL DEFAULT '',
  `imageheight` int(11) NOT NULL DEFAULT '0',
  `imagewidth` int(11) NOT NULL DEFAULT '0',
  `eventdate` date NOT NULL DEFAULT '0000-00-00',
  `reqdate` int(1) NOT NULL DEFAULT '0',
  `eventtime` time NOT NULL DEFAULT '00:00:00',
  `timedetails` varchar(255) NOT NULL DEFAULT '',
  `repeats` int(1) NOT NULL DEFAULT '0',
  `address` varchar(255) NOT NULL DEFAULT '',
  `addressverified` char(1) NOT NULL DEFAULT '',
  `locdetails` varchar(255) NOT NULL DEFAULT '',
  `area` char(1) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=156 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ppdistro`
--

-- DROP TABLE IF EXISTS `ppdistro`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `ppdistro` (
  `id` int(75) NOT NULL AUTO_INCREMENT,
  `location` varchar(75) NOT NULL,
  `whodelivered` varchar(25) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=56 DEFAULT CHARSET=latin1 COMMENT='Tracks locations of PP calendars and posters';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ppforum`
--

-- DROP TABLE IF EXISTS `ppforum`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `ppforum` (
  `modified` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `msgid` int(11) NOT NULL AUTO_INCREMENT,
  `id` int(11) NOT NULL DEFAULT '0',
  `organizer` int(1) NOT NULL DEFAULT '0',
  `name` varchar(255) NOT NULL DEFAULT '',
  `subject` varchar(255) NOT NULL DEFAULT '',
  `body` text NOT NULL,
  PRIMARY KEY (`msgid`)
) ENGINE=MyISAM AUTO_INCREMENT=134 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `rideIdea`
--

-- DROP TABLE IF EXISTS `rideIdea`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `rideIdea` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ride` varchar(255) NOT NULL DEFAULT '',
  `contact` varchar(26) NOT NULL DEFAULT '',
  `IP` varchar(15) NOT NULL,
  `datePosted` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=247 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `rideidea`
--

-- DROP TABLE IF EXISTS `rideidea`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `rideidea` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ride` varchar(255) NOT NULL DEFAULT '',
  `contact` varchar(26) NOT NULL DEFAULT '',
  `IP` varchar(15) NOT NULL,
  `datePosted` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sched`
--

-- DROP TABLE IF EXISTS `sched`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `sched` (
  `modified` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL DEFAULT '',
  `email` varchar(255) NOT NULL DEFAULT '',
  `hideemail` int(1) NOT NULL DEFAULT '0',
  `emailforum` int(1) NOT NULL DEFAULT '0',
  `printemail` int(1) NOT NULL DEFAULT '0',
  `phone` varchar(255) NOT NULL DEFAULT '',
  `hidephone` int(1) NOT NULL DEFAULT '0',
  `printphone` int(1) NOT NULL DEFAULT '0',
  `weburl` varchar(255) NOT NULL DEFAULT '',
  `webname` varchar(255) NOT NULL DEFAULT '',
  `printweburl` int(1) NOT NULL DEFAULT '0',
  `contact` varchar(255) NOT NULL DEFAULT '',
  `hidecontact` int(1) NOT NULL DEFAULT '0',
  `printcontact` int(1) NOT NULL DEFAULT '0',
  `title` varchar(255) NOT NULL DEFAULT '',
  `tinytitle` varchar(255) NOT NULL DEFAULT '',
  `audience` char(1) NOT NULL DEFAULT '',
  `descr` text NOT NULL,
  `printdescr` text NOT NULL,
  `newsflash` text NOT NULL,
  `image` varchar(255) NOT NULL DEFAULT '',
  `imageheight` int(11) NOT NULL DEFAULT '0',
  `imagewidth` int(11) NOT NULL DEFAULT '0',
  `eventdate` date NOT NULL DEFAULT '0000-00-00',
  `reqdate` int(1) NOT NULL DEFAULT '0',
  `eventtime` time NOT NULL DEFAULT '00:00:00',
  `eventduration` int(11) NOT NULL DEFAULT '0',
  `timedetails` varchar(255) NOT NULL DEFAULT '',
  `repeats` int(1) NOT NULL DEFAULT '0',
  `address` varchar(255) NOT NULL DEFAULT '',
  `addressverified` char(1) NOT NULL DEFAULT '',
  `locdetails` varchar(255) NOT NULL DEFAULT '',
  `area` char(1) NOT NULL DEFAULT '',
  `headcount` int(11) NOT NULL DEFAULT '0',
  `newbiecount` int(11) NOT NULL DEFAULT '0',
  `ridereport` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=156 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2024-02-21  3:35:13

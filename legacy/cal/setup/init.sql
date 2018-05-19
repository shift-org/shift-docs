create database if not exists pp;
use pp;

create table calevent (
modified timestamp,
id int not null primary key auto_increment,
name varchar(255),
email varchar(255),
review varchar(255),
hideemail int(1),
emailforum int(1),
printemail int(1),
phone varchar(255),
hidephone int(1),
printphone int(1),
weburl varchar(255),
webname varchar(255),
printweburl int(1),
contact varchar(255),
hidecontact int(1),
printcontact int(1),
title varchar(255),
tinytitle varchar(255),
audience char(1),
descr text,
printdescr text,
image varchar(255),
imageheight int,
imagewidth int,
dates varchar(255),
datestype char(1),
eventtime time,
eventduration int,
timedetails varchar(255),
locname varchar(255),
address varchar(255),
addressverified char(1),
locdetails varchar(255),
area char(1),
highlight int(1),
external varchar(255)
);

create table caldaily (
modified timestamp,
id int,
newsflash text,
eventdate date,
eventstatus varchar(1),
exceptionid int,
headcount int,
newbiecount int,
ridereport text
);

create table calforum (
modified timestamp,
msgid int primary key not null auto_increment,
id int,
organizer int(1),
name varchar(255),
subject varchar(255),
msg text
);

create table caladdress (
canon varchar(255) primary key not null,
address varchar(255),
locname varchar(255),
area char(1),
locked int(1)
);

-- fields for calendar reporting
alter table calevent add created timestamp not NULL default CURRENT_TIMESTAMP first;
alter table calevent add changes int(11) default 0 after modified;
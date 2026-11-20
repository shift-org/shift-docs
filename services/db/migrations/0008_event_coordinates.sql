-- map coordinates for the event's starting location ( see app/util/geocode.js )
-- geoaddress records the search text that produced the coordinates,
-- so the location is only looked up again when the address changes.
-- ( mysql doesn't support "add column if not exists", so check first. )
set @hasGeo := (select count(*) from information_schema.columns where table_name = 'calevent' and column_name = 'geoaddress' and table_schema = database());
set @statement := if (@hasGeo = 0,
  'alter table calevent add latitude double default null, add longitude double default null, add geoaddress varchar(255) default null',
  'select \'Columns already exist.\' as \'Skipped\' '
  );
prepare stmt from @statement;
execute stmt;

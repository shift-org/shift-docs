-- drop index on unused `source` column, if found
set @hasSourceIndex := (select count(*) from information_schema.statistics where table_name = 'calevent' and index_name = 'source' and table_schema = database());
set @statement := if (@hasSourceIndex > 0, 
  'drop index source on calevent',
  'select \'Index `source` not found.\' as \'Skipped\' '
  );
prepare stmt from @statement;
execute stmt;

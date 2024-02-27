-- cleanup any old info just in case
drop PROCEDURE if exists fix_mixed_tables;
-- change the deliminator because mysql confuses semi-colons in stored procedures
delimiter $$ 
-- create a stored procedure because they allow
-- multiple statements inside an if/then condition
CREATE PROCEDURE fix_mixed_tables()
BEGIN
	-- if the mixed case table exists
	if (select distinct 1 from INFORMATION_SCHEMA.TABLES 
		where TABLE_SCHEMA = 'shift'
		and TABLE_NAME = 'rideIdea')
	then
		-- drop the empty lowercase table
		drop table rideidea;
		-- rename the table and its columns to lower case
		alter table rideIdea
			change column IP ip varchar(15) NOT NULL,
			change column datePosted dateposted timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
			rename to rideidea;
	END if;
	-- do the same for the mugDialog
	if (select distinct 1 from INFORMATION_SCHEMA.TABLES 
		where TABLE_SCHEMA = 'shift'
		and TABLE_NAME = 'mugDialog')
	then
		drop table  mugdialog;
		alter table mugDialog 
			rename to mugdialog;
	END if;
END
$$
-- change back to semi-colons now that the procedure is declared.
delimiter ;
-- rename the tables
call fix_mixed_tables();
-- cleanup
drop procedure fix_mixed_tables;
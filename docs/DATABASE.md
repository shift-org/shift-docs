# Database

**Work in progress**

----

## General

The Shift calendar uses a MySQL database. The primary tables of interest are:

* `calevent`
* `caldaily`


## Initial setup

If you're standing up the site for the first time, add database tables with the included setup script. With the application running (`./shift up`), run the setup script: 

```./shift mysql-pipe < services/db/seed/setup.sql```


## Adding data 

### Via script

**TODO:** See [issue #254](https://github.com/shift-org/shift-docs/issues/254).


### Manually

With the application running, go to [https://localhost:4443/addevent/](https://localhost:4443/addevent/) and use the Add Event form to create events.

In production, we send you an email with a link to confirm the ride listing; we also write a copy of that email to `services/php/shift-mail.log`. For local development, we don't actually send the email, so get the confirmation link from that mail log.


## Migrations

Migration scripts are located in `services/db/migrations/`. To apply a migration script, run the application and then run the script by name: 

```./shift mysql-pipe < services/db/migrations/0000-example-migration.sql```

### Creating a migration

Any change to the database should be done using a migration script so it can be consistently applied in any dev environment (including production). It should be safe to re-run a migration, so use SQL statements that won't error out if run a second time. (e.g. check for presence before dropping)

Along with the migration, update the `setup.sql` script. This ensures that both new databases and existing databases that have been migrated will have the same structure.

After you've applied your migration, run this command to dump the database structure but without the actual row data:

```./shift mysqldump --no-data > setup.sql```

Then:
* Comment out each `DROP TABLE` line, e.g. `` -- DROP TABLE IF EXISTS `tablename` ``
* Add `IF NOT EXISTS` to each `CREATE TABLE` statement, e.g. `` CREATE TABLE IF NOT EXISTS `tablename` ``


## Resetting tables

If you need to reset your local database, you can modify the setup script to be destructive. Only do this if you need to recover from a damaged database. **This will delete all of the data in your database!**

1. Open `services/db/seed/setup.sql`.
2. Uncomment the `-- DROP TABLE IF EXISTS` line for any table you want to reset.
3. Save the file. 
4. Run the script: `./shift mysql-pipe < services/db/seed/setup.sql`

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


## Resetting tables

If you need to reset your local database, you can modify the setup script to be destructive. Only do this if you need to recover from a damaged database. **This will delete all of the data in your database!**

1. Open `services/db/seed/setup.sql`.
2. Uncomment the `-- DROP TABLE IF EXISTS` line for any table you want to reset.
3. Save the file. 
4. Run the script: `./shift mysql-pipe < services/db/seed/setup.sql`

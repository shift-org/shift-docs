// create tables if they dont already exist
module.exports = {
  create: async function(knex, mysql) {
    // add a modified column
    function addModified(table) {
      let ts= table.timestamp('modified').notNullable();
      if (!mysql) { // fix? sqlite doesnt support "on update", set in knex.js store()?
        ts.defaultTo(knex.fn.now());
      } else {
        ts.defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
      }
    }
    const hasCalDaily= await knex.schema.hasTable('caldaily');
    if (!hasCalDaily) {
      await knex.schema
        .createTable('caldaily', function (table) {
          if (mysql) {
            table.engine("MyISAM");
          }
          // knex creates these as unsigned; the original tables were signed
          // it should be fine; that's a lot of ids.
          table.increments('pkid');
          addModified(table);
          // note: in the original tables `int(11)` is a *display* size
          // and its deprecated as of mysql 8.0.17
          // https://dev.mysql.com/doc/refman/8.0/en/numeric-type-attributes.html
          table.integer('id')
            .defaultTo(null);
          table.text('newsflash', "mediumtext"); // medium text supports up to 16 MiB(!)
          table.date('eventdate')
            .defaultTo(null);
          // tbd: exceptionid is unused... omit?
          table.integer('exceptionid')
            .defaultTo(null);
          // note: knex string is mysql varchar(255)
          table.string('eventstatus', 1)
            .defaultTo(null);
          // tbd: how useful is this index?
          table.index(['eventdate'], 'eventdate');
        });
    }
    const hasCalEvent= await knex.schema.hasTable('calevent');
    if (!hasCalEvent) {
      await knex.schema
        .createTable('calevent', function (table) {
          if (mysql) {
            table.engine("MyISAM");
          }
          table.increments('id');
          table.timestamp('created')
            .notNullable()
            .defaultTo(knex.fn.now());
          addModified(table);
          table.integer('changes')
            .defaultTo(0);
          table.string('name', 255)
            .defaultTo(null);
          table.string('email', 255)
            .defaultTo(null);
          table.integer('hideemail')
            .defaultTo(null);
          table.integer('emailforum')
            .defaultTo(null);
          table.integer('printemail')
            .defaultTo(null);
          table.string('phone', 255)
            .defaultTo(null);
          table.integer('hidephone')
            .defaultTo(null);
          table.integer('printphone')
            .defaultTo(null);
          table.string('weburl', 255)
            .defaultTo(null);
          table.string('webname', 255)
            .defaultTo(null);
          table.integer('printweburl')
            .defaultTo(null);
          table.string('contact', 255)
            .defaultTo(null);
          table.integer('hidecontact')
            .defaultTo(null);
          table.integer('printcontact')
            .defaultTo(null);
          table.string('title', 255)
            .defaultTo(null);
          table.string('tinytitle', 255)
            .notNullable(),
          table.specificType('audience', "char(1)")
            .defaultTo(null);
          table.text('descr', "mediumtext");
          table.text('printdescr', "mediumtext");
          table.string('image', 255)
            .defaultTo(null);
          table.integer('imageheight')
            .defaultTo(null);
          table.integer('imagewidth')
            .defaultTo(null);
          table.string('dates', 255)
            .defaultTo(null);
          table.specificType('datestype', "char(1)")
            .defaultTo(null);
          table.time('eventtime')
            .defaultTo(null);
          table.integer('eventduration')
            .defaultTo(null);
          table.string('timedetails', 255)
            .defaultTo(null);
          table.string('locname', 255)
            .defaultTo(null);
          table.string('address', 255)
            .defaultTo(null);
          table.specificType('addressverified', "char(1)")
            .defaultTo(null);
          table.string('locdetails', 255)
            .defaultTo(null);
          table.string('locend', 255)
            .defaultTo(null);
          table.integer('loopride')
            .defaultTo(null);
          table.specificType('area', "char(1)")
            .defaultTo(null);
          table.string('external', 250)
            .defaultTo(null);
          table.string('source', 250)
            .defaultTo(null);
          table.integer('nestid')
            .defaultTo(null);
          table.string('nestflag', 1)
            .defaultTo(null);
          table.specificType('review', "char(1)")
            .notNullable()
            .defaultTo('I');
          table.integer('highlight')
            .notNullable(),
          table.tinyint(`hidden`)
            .defaultTo(null);
          table.string('password', 50)
            .defaultTo(null);
          table.string('ridelength', 255)
            .defaultTo(null);
          table.integer('safetyplan')
            .defaultTo(null);
        });
      }
    return knex;
  }
};

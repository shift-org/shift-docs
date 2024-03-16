// create tables if they dont already exist
module.exports = {
  create: async function(knex, mysql) {
    // add a modified column
    // fix? sqlite doesnt support "on update", set in knex.js store()?
    function addModified(table) {
      let ts= table.timestamp('modified')
        .defaultTo(knex.fn.now());
      if (mysql) {
        ts.onUpdate(knex.fn.now());
      }
    }
    const hasCalDaily= await knex.schema.hasTable('caldaily');
    if (!hasCalDaily) {
      await knex.schema
        .createTable('caldaily', function (table) {
          table.increments('pkid');
          addModified(table);
          table.int('id', 11)
            .defaultTo(null);
          table.text('newsflash', "mediumtext"); // medium text supports up to 16 MiB(!)
          table.date('eventdate')
            .defaultTo(null);
          // tbd: exceptionid is unused... omit?
          table.int('exceptionid', 11)
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
          table.increments('id');
          table.timestamp('created')
            .defaultTo(knex.fn.now());
          addModified(table);
          table.int('changes', 11)
            .defaultTo(0);
          table.string('name', 255)
            .defaultTo(null);
          table.string('email', 255)
            .defaultTo(null);
          table.int('hideemail', 1)
            .defaultTo(null);
          table.int('emailforum', 1)
            .defaultTo(null);
          table.int('printemail', 1)
            .defaultTo(null);
          table.string('phone', 255)
            .defaultTo(null);
          table.int('hidephone', 1)
            .defaultTo(null);
          table.int('printphone', 1)
            .defaultTo(null);
          table.string('weburl', 255)
            .defaultTo(null);
          table.string('webname', 255)
            .defaultTo(null);
          table.int('printweburl', 1)
            .defaultTo(null);
          table.string('contact', 255)
            .defaultTo(null);
          table.int('hidecontact', 1)
            .defaultTo(null);
          table.int('printcontact', 1)
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
          table.int('imageheight', 11)
            .defaultTo(null);
          table.int('imagewidth', 11)
            .defaultTo(null);
          table.string('dates', 255)
            .defaultTo(null);
          table.specificType('datestype', "char(1)")
            .defaultTo(null);
          table.time('eventtime')
            .defaultTo(null);
          table.int('eventduration', 11)
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
          table.int('loopride', 1)
            .defaultTo(null);
          table.specificType('area', "char(1)")
            .defaultTo(null);
          table.string('external', 250)
            .defaultTo(null);
          table.string('source', 250)
            .defaultTo(null);
          table.int('nestid', 11)
            .defaultTo(null);
          table.string('nestflag', 1)
            .defaultTo(null);
          table.specificType('review', "char(1)")
            .defaultTo('I');
          table.int('highlight', 1)
            .notNullable(),
          table.tinyint(`hidden`, 1)
            .defaultTo(null);
          table.string('password', 50)
            .defaultTo(null);
          table.string('ridelength', 255)
            .defaultTo(null);
          table.int('safetyplan', 1)
            .defaultTo(null);
        });
      }
    return knex;
  }
};

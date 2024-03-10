// currently for use only by sqlite3 testing and local development
module.exports = {
  create: async function(knex) {
    const hasCalDaily= await knex.schema.hasTable('caldaily');
    if (!hasCalDaily) {
      await knex.schema
        .createTable('caldaily', function (table) {
          table.increments('pkid');
          table.timestamp('modified')
            // fix? sqlite doesnt allow onUpdate
            // could do this app side if needed.
            // .onUpdate(knex.fn.now())
            .defaultTo(knex.fn.now());
          table.int('id', 11)
            .defaultTo(null);
          table.text('newsflash', 11);
          table.date('eventdate')
            .defaultTo(null);
          table.string('eventstatus', 1)
            .defaultTo(null);
        });
    }
    const hasCalEvent= await knex.schema.hasTable('calevent');
    if (!hasCalEvent) {
      await knex.schema
        .createTable('calevent', function (table) {
          table.increments('id');
          table.timestamp('created')
            .defaultTo(knex.fn.now());
          table.timestamp('modified')
            // fix? sqlite doesnt allow onUpdate
            // could do this app side if needed.
            //.onUpdate(knex.fn.now())
            .defaultTo(knex.fn.now());
          table.int('changes', 11);
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
          table.string('tinytitle', 255),
          table.specificType('audience', "char(1)")
            .defaultTo(null);
          table.text('descr');
          table.text('printdescr');
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

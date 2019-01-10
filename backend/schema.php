<?php

// Override the database schema to note foreign key relationships

function updateSchema($database) {
    $schema = new fSchema($database);

    // Relate caldaily -> calevent
    $schema->setKeysOverride(
        array(
            array(
                'column'         => 'id', // on caldaily
                'foreign_table'  => 'calevent',
                'foreign_column' => 'id', // on calevent
                'on_delete'      => 'cascade',
                'on_update'      => 'cascade'
            ),
            array(
                'column'         => 'exceptionid', // on caldaily
                'foreign_table'  => 'calevent',
                'foreign_column' => 'id', // on calevent
                'on_delete'      => 'cascade',
                'on_update'      => 'cascade'
            )
        ),
        'caldaily',
        'foreign'
    );

    return $schema;
}

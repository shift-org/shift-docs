<?php

include_once('config.php');
include_once('schema.php');
include_once('util.php');

include('models/Event.php');
include('models/EventTime.php');

$database = new fDatabase($DBTYPE, $DBDB, $DBUSER, $DBPASS, $DBHOST, 3306);
fORMDatabase::attach($database);

$schema = updateSchema($database);
fORMSchema::attach($schema);

/**
 * Automatically includes classes
 *
 * @throws Exception
 *
 * @param  string $class_name  Name of the class to load
 * @return void
 */
function __autoload($class_name)
{
    // Customize this to your root Flourish directory
    $flourish_root = getcwd() . '/../vendor/flourish/';

    $file = $flourish_root . $class_name . '.php';

    if (file_exists($file)) {
        include $file;
        return;
    }

    throw new Exception('The class ' . $class_name . ' could not be loaded');
}
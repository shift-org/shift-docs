<?php

function env_default($name, $default) {
    return getenv($name, true) ? getenv($name) : $default;
}

$DBUSER = env_default('MYSQL_USER', 'shift');
$DBPASS = env_default('MYSQL_PASSWORD', 'shift');
$DBDB   = env_default('MYSQL_DATABASE', 'shift');
$DBHOST = env_default('MYSQL_HOST', 'db');
$DBTYPE = 'mysql';

date_default_timezone_set('America/Los_Angeles');

$PROTOCOL = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";
$HOST = env_default('SERVER_NAME', $_SERVER['SERVER_NAME']);
$PATH = "/";
$IMAGEDIR = "/opt/legacy/eventimages";
$IMAGEURL = "/eventimages";
$SITENAME = "SHIFT to Bikes";

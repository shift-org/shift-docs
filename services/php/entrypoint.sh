#!/usr/bin/env bash

# first arg is `-f` or `--some-option`
if [ "${1#-}" != "$1" ]; then
	set -- php "$@"
fi

FILENAME=/usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini
HOST_IP=`/sbin/ip route | awk '/default/ { print $3 }'`

cat << EOF > ${FILENAME}
`head -n 1 ${FILENAME}`
[xdebug]
; priority=999
xdebug.remote_autostart=true
xdebug.remote_enable = On
xdebug.remote_connect_back = Off
xdebug.remote_port = 9000
xdebug.remote_handler=dbgp
xdebug.remote_mode=req
xdebug.var_display_max_data = 2048
xdebug.var_display_max_depth = 128
xdebug.max_nesting_level = 500
xdebug.remote_host=${HOST_IP}
EOF

chmod 777 $EVENTIMAGES

exec "$@"

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

mkdir -p $EVENTIMAGES
chmod 777 $EVENTIMAGES

touch $SHIFT_EMAIL_LOG
chmod 777 $SHIFT_EMAIL_LOG

# If smtp secret then configure
if [ ! -z "$SMTP_HOST" ]; then
	sudo postconf -e "relayhost = [$SMTP_HOST]:587" \
	"smtp_sasl_auth_enable = yes" \
	"smtp_sasl_security_options = noanonymous" \
	"smtp_sasl_password_maps = hash:/etc/postfix/sasl_passwd" \
	"smtp_use_tls = yes" \
	"smtp_tls_security_level = encrypt" \
	"smtp_tls_note_starttls_offer = yes"

	echo $SMTP_DOMAIN > /etc/mailname

	echo "[$SMTP_HOST]:587 $SMTP_USER:$SMTP_PASS" > /etc/postfix/sasl_passwd
	postmap hash:/etc/postfix/sasl_passwd
	postconf -e "smtp_tls_CAfile = /etc/ssl/certs/ca-certificates.crt"

	service rsyslog start

	postfix start
	postfix reload
else
	echo "No secrets found, logging email to $SHIFT_EMAIL_LOG"
fi

exec "$@"

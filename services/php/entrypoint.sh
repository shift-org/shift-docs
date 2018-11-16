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

# If smtp secret then configure
if [ ! -z "$SMTP_HOST" ]; then
    echo "AuthInfo:$SMTP_HOST \"U:root\" \"I:$SMTP_USER\" \"P:$SMTP_PASS\" \"M:$SMTP_LOGIN\"" > /etc/mail/authinfo
    makemap hash /etc/mail/authinfo.db < /etc/mail/authinfo

	if [ ! -f /etc/mail/access.orig ]; then
		cp /etc/mail/access /etc/mail/access.orig
	fi
	cp /etc/mail/access.orig /etc/mail/access
	echo "Connect:$SMTP_HOST RELAY" >> /etc/mail/access

	if [ ! -f /etc/mail/sendmail.mc.orig ]; then
		cp /etc/mail/sendmail.mc /etc/mail/sendmail.mc.orig
	fi

	# add this conf to the start of the file
	echo "define(\`SMART_HOST', \`$SMTP_HOST')dnl" > /etc/mail/sendmail.mc
	echo "define(\`RELAY_MAILER_ARGS', \`TCP $h 25')dnl" >> /etc/mail/sendmail.mc
	echo "define(\`confAUTH_MECHANISMS', \`LOGIN PLAIN')dnl" >> /etc/mail/sendmail.mc
	echo "FEATURE(\`authinfo', \`hash -o /etc/mail/authinfo.db')dnl" >> /etc/mail/sendmail.mc
	echo "MASQUERADE_AS(\`$SMTP_DOMAIN')dnl" >> /etc/mail/sendmail.mc
	echo "FEATURE(masquerade_envelope)dnl" >> /etc/mail/sendmail.mc
	echo "FEATURE(masquerade_entire_domain)dnl" >> /etc/mail/sendmail.mc

	# and add the original
	cat /etc/mail/sendmail.mc.orig >> /etc/mail/sendmail.mc

	chmod 666 /etc/mail/sendmail.cf
	m4 /etc/mail/sendmail.mc > /etc/mail/sendmail.cf
	chmod 644 /etc/mail/sendmail.cf

	/etc/init.d/sendmail restart
fi

exec "$@"

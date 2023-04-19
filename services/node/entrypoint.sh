#!/usr/bin/env bash

# Defined in docker-compose.yml
mkdir -p /opt/backend/eventimages
chmod 777 /opt/backend/eventimages

#  '/opt/node/shift-mail.log':
touch $SHIFT_EMAIL_LOG
chmod 777 $SHIFT_EMAIL_LOG

# If smtp secret then configure
# if [ ! -z "$SMTP_HOST" ]; then
#     postconf -e "relayhost = [$SMTP_HOST]:587" \
#     "smtp_sasl_auth_enable = yes" \
#     "smtp_sasl_security_options = noanonymous" \
#     "smtp_sasl_password_maps = hash:/etc/postfix/sasl_passwd" \
#     "smtp_use_tls = yes" \
#     "smtp_tls_security_level = encrypt" \
#     "smtp_tls_note_starttls_offer = yes" \
#     "smtp_tls_CAfile = /etc/ssl/certs/ca-certificates.crt" \
#     "smtp_generic_maps = hash:/etc/postfix/generic"

#     echo "www-data@shift2bikes.org bikefun@shift2bikes.org" > /etc/postfix/generic
#     postmap /etc/postfix/generic

#     echo "[$SMTP_HOST]:587 $SMTP_USER:$SMTP_PASS" > /etc/postfix/sasl_passwd
#     postmap hash:/etc/postfix/sasl_passwd

#     echo $SMTP_DOMAIN > /etc/mailname

#     service rsyslog start

#     postfix start
#     postfix reload
# else
#     echo "No secrets found, logging email to $SHIFT_EMAIL_LOG"
# fi

# which node  /usr/local/bin/node
# pwd  /app
node ./app.js

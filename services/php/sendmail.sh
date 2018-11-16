#!/bin/bash

# apt update
# apt install sendmail

# always log email to file
# if secrets send to sendmail
# https://docs.aws.amazon.com/ses/latest/DeveloperGuide/send-email-sendmail.html

EMAIL_LOG=/var/log/shift-mail.log

echo "Sending email $(date):" >> $EMAIL_LOG
if [ -z $SMTP_HOST ]; then
    cat /dev/stdin >> $EMAIL_LOG
else
    cat /dev/stdin | tee -a $EMAIL_LOG | sendmail -i -t
fi
echo >> $EMAIL_LOG

# need a tee
# sendmail -i -t @

#!/bin/bash

# apt update
# apt install sendmail

# always log email to file
# if secrets send to sendmail
# https://docs.aws.amazon.com/ses/latest/DeveloperGuide/send-email-sendmail.html

echo "Sending email $(date):" >> $SHIFT_EMAIL_LOG
if [ -z $SMTP_HOST ]; then
    cat /dev/stdin >> $SHIFT_EMAIL_LOG
else
    cat /dev/stdin | tee -a $SHIFT_EMAIL_LOG | sendmail $@
fi
echo >> $SHIFT_EMAIL_LOG

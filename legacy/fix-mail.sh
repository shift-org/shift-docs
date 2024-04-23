#!/bin/sh
# to address postfix permissions problems we ran into in april 2024
UID=`ls -ld /var/lib/postfix |cut -d' ' -f3`
if [ x$UID = "x1000" ] ; then
        chown postfix /var/lib/postfix
        rmdir /var/spool/postfix/public/pickup
        chown -R postfix /var/spool/postfix
        chmod g+s  /usr/sbin/postqueue
        chmod g+s  /usr/sbin/postdrop
        service postfix start
        service postfix reload
fi

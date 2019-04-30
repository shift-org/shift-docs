FROM php:5.6-fpm

RUN echo "deb [check-valid-until=no] http://cdn-fastly.deb.debian.org/debian/ jessie main" > /tmp/apt-sources
RUN echo "deb [check-valid-until=no] http://archive.debian.org/debian jessie-backports main" >> /tmp/apt-sources
RUN echo "deb http://security.debian.org/ jessie/updates main" >> /tmp/apt-sources
RUN mv /tmp/apt-sources /etc/apt/sources.list

RUN docker-php-ext-install pdo pdo_mysql mysql

RUN pecl install xdebug-2.5.5 \
 && docker-php-ext-enable xdebug

RUN echo "postfix postfix/mailname string example.com" | debconf-set-selections
RUN echo "postfix postfix/main_mailer_type string 'Internet Site'" | debconf-set-selections
RUN apt-get update && apt-get install -q -y postfix libsasl2-modules rsyslog
RUN mkdir -p /var/spool/postfix/etc/ && cp -f /etc/services /var/spool/postfix/etc/services && cp /etc/resolv.conf /var/spool/postfix/etc/resolv.conf

RUN echo "sendmail_path=/opt/php/sendmail.sh" >> /usr/local/etc/php/conf.d/php-sendmail.ini

FROM php:5.6-fpm

RUN docker-php-ext-install pdo pdo_mysql

RUN pecl install xdebug-2.5.5 \
 && docker-php-ext-enable xdebug

RUN apt-get update && apt-get install -q -y sendmail

RUN echo "sendmail_path=/opt/services/php/sendmail.sh" >> /usr/local/etc/php/conf.d/php-sendmail.ini

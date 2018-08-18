FROM php:5.6-fpm

RUN docker-php-ext-install pdo pdo_mysql

RUN pecl install xdebug-2.5.5 \
 && docker-php-ext-enable xdebug

#!/usr/bin/env bash

set -e

echo nginx/entrypoint.sh

echo Clearing /etc/nginx/conf.d/

rm -rf /etc/nginx/conf.d/
mkdir -p /etc/nginx/conf.d/

echo Linking ${NGINX_CONF}
ln -s /etc/borzoi/nginx/sites-available/${NGINX_CONF} /etc/nginx/conf.d/${NGINX_CONF}

CERTS=/etc/borzoi/nginx/ssl
NGINX_CRT=${CERTS}/${NGINX_CERT_NAME}.crt
NGINX_KEY=${CERTS}/${NGINX_CERT_NAME}.key

COMMON_NAME=localhost

if [ ! -f ${NGINX_KEY} ] || [ ! -f ${NGINX_CRT} ]; then
    echo Creating ${NGINX_CRT} ${NGINX_KEY}
    apt-get update
    apt-get install openssl
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout ${NGINX_KEY} -out ${NGINX_CRT} -subj "/C=US/ST=OR/L=l/O=nift/OU=borzoi/CN=${COMMON_NAME}"
fi

ACTIVE_DIR=/etc/nginx/ssl
echo Clearing ${ACTIVE_DIR}
rm -rf ${ACTIVE_DIR}/*
mkdir -p ${ACTIVE_DIR}

ACTIVE_CRT=${ACTIVE_DIR}/active.crt
ACTIVE_KEY=${ACTIVE_DIR}/active.key

echo Activating ${ACTIVE_CRT} ${ACTIVE_KEY}
ln -s ${NGINX_CRT} ${ACTIVE_CRT}
ln -s ${NGINX_KEY} ${ACTIVE_KEY}

echo nginx up

exec "$@"

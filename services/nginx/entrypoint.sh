#!/usr/bin/env bash
set -e
echo services/nginx/entrypoint.sh
CERTS=/opt/nginx/ssl
NGINX_CRT=${CERTS}/default.crt
NGINX_KEY=${CERTS}/default.key
if [ ! -f ${NGINX_KEY} ] || [ ! -f ${NGINX_CRT} ]; then
    echo Creating ${NGINX_CRT} ${NGINX_KEY}
    apt-get update
    apt-get -y install openssl
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout ${NGINX_KEY} -out ${NGINX_CRT} -subj "/C=US/ST=OR/L=l/O=nift/OU=services/CN=${COMMON_NAME}"
fi
echo nginx up
exec "$@"
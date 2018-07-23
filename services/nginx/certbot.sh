#!/bin/bash
set -ex

echo "This script is intended to be run by root on the host computer"

SHIFT="/opt/shift-docs/shift"
WEBROOT="/tmp/letsencrypt-auto"
DOMAIN="api.shift2bikes.org"
CERTDIR="/etc/letsencrypt/live/${DOMAIN}"
CERTDST="/opt/shift-docs/services/nginx/ssl"

CRTSRC="${CERTDIR}/fullchain.pem"
KEYSRC="${CERTDIR}/privkey.pem"

CRTDST="${CERTDST}/default.crt"
KEYDST="${CERTDST}/default.key"

echo "Making webroot" 
mkdir -p "${WEBROOT}/.well-known/acme-challenge/"

echo "Running certbot"
certbot certonly -n --webroot --webroot-path "${WEBROOT}" -d "${DOMAIN}"

echo "Copying files"
cp "${CRTSRC}" "${CRTDST}"
cp "${KEYSRC}" "${KEYDST}"

echo "Restarting shift nginx"
"${SHIFT}" restart nginx

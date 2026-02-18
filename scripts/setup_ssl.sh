#!/bin/bash
# SSL Setup Script for Kitsu Enterprise
# Choose one of the options below:

set -e

DOMAIN="${KITSU_DOMAIN:-localhost}"
SSL_DIR="./nginx/ssl"
mkdir -p "$SSL_DIR"

if [ "$1" = "certbot" ]; then
    # Option 1: Let's Encrypt (production)
    echo "Setting up Let's Encrypt for $DOMAIN..."
    docker run --rm \
        -v "$(pwd)/nginx/ssl:/etc/letsencrypt" \
        -v "$(pwd)/nginx/www:/var/www/certbot" \
        -p 80:80 \
        certbot/certbot certonly \
        --standalone \
        --email "admin@${DOMAIN}" \
        --agree-tos \
        --no-eff-email \
        -d "$DOMAIN"
    cp "$SSL_DIR/live/$DOMAIN/fullchain.pem" "$SSL_DIR/fullchain.pem"
    cp "$SSL_DIR/live/$DOMAIN/privkey.pem" "$SSL_DIR/privkey.pem"
    echo "✅ Let's Encrypt certificate installed"

else
    # Option 2: Self-signed (development/staging)
    echo "Generating self-signed certificate for $DOMAIN..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$SSL_DIR/privkey.pem" \
        -out "$SSL_DIR/fullchain.pem" \
        -subj "/C=RU/ST=Moscow/L=Moscow/O=Kitsu/CN=$DOMAIN" \
        -addext "subjectAltName=DNS:$DOMAIN,DNS:localhost,IP:127.0.0.1"
    echo "✅ Self-signed certificate created (not trusted by browsers)"
    echo "   For production, run: $0 certbot"
fi

echo "SSL files saved to $SSL_DIR/"

FROM php:8.2-fpm-alpine

RUN apk add --no-cache \
    curl \
    libzip-dev \
    oniguruma-dev \
    python3 \
    py3-pip \
    font-dejavu \
    && docker-php-ext-install \
        pdo \
        pdo_mysql \
        zip \
        mbstring \
    && pip3 install reportlab pyyaml --break-system-packages

WORKDIR /var/www/html

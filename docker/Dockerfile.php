FROM php:8.2-fpm-alpine

RUN apk add --no-cache \
    curl \
    libzip-dev \
    oniguruma-dev \
    && docker-php-ext-install \
        pdo \
        pdo_mysql \
        zip \
        mbstring

WORKDIR /var/www/html

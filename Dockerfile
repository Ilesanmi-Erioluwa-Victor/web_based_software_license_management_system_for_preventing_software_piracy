# Stage 1: Build frontend assets
FROM node:20-alpine AS frontend-builder
WORKDIR /build
COPY package.json package-lock.json tailwind.config.js ./
COPY public ./public
RUN npm install && npm run build:css

# Stage 2: PHP runtime
FROM php:8.2-cli

# Install system dependencies
RUN apt-get update && apt-get install -y \
        git \
        unzip \
        curl \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install MongoDB extension using pre-compiled binaries (seconds, not minutes)
COPY --from=mlocati/php-extension-installer /usr/bin/install-php-extensions /usr/bin/
RUN install-php-extensions mongodb

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /app

# Copy application files
COPY . .

# Copy built CSS from frontend stage
COPY --from=frontend-builder /build/public/css/output.css ./public/css/output.css

# Install PHP dependencies
RUN composer install --no-dev --optimize-autoloader --ignore-platform-reqs

# Expose port
EXPOSE 8080

# Start PHP built-in server
CMD ["php", "-S", "0.0.0.0:8080", "-t", "public"]

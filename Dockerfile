# Stage 1: Build frontend assets
FROM node:20-alpine AS frontend-builder
WORKDIR /build
COPY package.json package-lock.json tailwind.config.js ./
COPY public/css/input.css ./public/css/input.css
RUN npm install && npm run build:css

# Stage 2: PHP runtime
FROM php:8.2-cli

# Install system dependencies + MongoDB extension
RUN apt-get update && apt-get install -y \
        git \
        unzip \
        libcurl4-openssl-dev \
        pkg-config \
        libssl-dev \
    && pecl install mongodb \
    && docker-php-ext-enable mongodb \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

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

#!/bin/bash
# Render build script
set -e

echo "Installing MongoDB PHP extension..."
pecl install mongodb || echo "MongoDB extension install skipped (may already be installed)"

echo "Installing PHP dependencies..."
composer install --no-dev --optimize-autoloader --ignore-platform-reqs

echo "Installing Node dependencies..."
npm ci

echo "Building Tailwind CSS..."
npm run build:css

echo "Build complete."

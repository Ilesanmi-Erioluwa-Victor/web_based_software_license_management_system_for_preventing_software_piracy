<?php

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

if (!str_starts_with($uri, '/api/')) {
    require __DIR__ . '/index.html';
    exit;
}

require_once __DIR__ . '/../src/bootstrap.php';

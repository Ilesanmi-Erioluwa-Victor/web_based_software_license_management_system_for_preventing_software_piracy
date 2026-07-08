<?php

require_once __DIR__ . '/../vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->safeLoad();

error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');

set_exception_handler(function (\Throwable $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => 'Internal server error',
        'debug' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
    ]);
    exit;
});

set_error_handler(function ($severity, $message, $file, $line) {
    throw new \ErrorException($message, 0, $severity, $file, $line);
}, E_ALL);

\App\Middleware\CorsMiddleware::handle();

\App\Middleware\RateLimitMiddleware::handle();

$routes = require __DIR__ . '/Routes/api.php';

$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

$matched = false;
foreach ($routes as $route) {
    [$routeMethod, $routePattern, $handler] = $route;

    if ($method !== $routeMethod) {
        continue;
    }

    $pattern = preg_replace('/\{(\w+)\}/', '(?P<$1>[^/]+)', $routePattern);
    $pattern = '#^' . $pattern . '$#';

    if (preg_match($pattern, $uri, $matches)) {
        $matched = true;
        $params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);

        if (is_callable($handler)) {
            $handler();
        } else {
            [$controller, $action] = $handler;
            $controller::$action(...array_values($params));
        }
        break;
    }
}

if (!$matched) {
    \App\Helpers\Response::error('Route not found', 404);
}

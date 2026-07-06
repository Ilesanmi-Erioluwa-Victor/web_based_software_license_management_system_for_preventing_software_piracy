<?php

namespace App\Middleware;

use App\Config\Database;
use App\Helpers\Response;

class RateLimitMiddleware
{
    private static int $windowSeconds = 60;

    public static function handle(): void
    {
        $max = (int) ($_ENV['RATE_LIMIT_PER_MINUTE'] ?? 60);
        $identifier = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $endpoint = $_SERVER['REQUEST_URI'] ?? '/';
        $windowStart = date('c', time() - self::$windowSeconds);

        Database::deleteMany('rate_limits', [
            'window_start' => ['$lt' => $windowStart],
        ]);

        $existing = Database::findOne('rate_limits', [
            'identifier' => $identifier,
            'endpoint' => $endpoint,
            'window_start' => ['$gte' => $windowStart],
        ]);

        if ($existing) {
            if ((int) $existing['hits'] >= $max) {
                Response::error('Rate limit exceeded. Try again later.', 429);
            }
            Database::updateOne('rate_limits', ['_id' => $existing['id']], [
                'hits' => (int) $existing['hits'] + 1,
            ]);
        } else {
            Database::insertOne('rate_limits', [
                'identifier' => $identifier,
                'endpoint' => $endpoint,
                'hits' => 1,
                'window_start' => date('c'),
            ]);
        }
    }
}

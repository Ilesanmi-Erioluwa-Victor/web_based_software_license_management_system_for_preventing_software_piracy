<?php

namespace App\Middleware;

use App\Helpers\Response;

class AdminMiddleware
{
    public static function handle(): void
    {
        $user = AuthMiddleware::handle();
        if ($user['role'] !== 'admin') {
            Response::error('Admin access required', 403);
        }
    }
}

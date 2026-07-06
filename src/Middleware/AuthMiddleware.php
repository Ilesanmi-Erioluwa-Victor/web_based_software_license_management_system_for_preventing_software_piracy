<?php

namespace App\Middleware;

use App\Config\Database;
use App\Helpers\Response;

class AuthMiddleware
{
    public static function handle(): array
    {
        $token = self::extractToken();
        if (!$token) {
            Response::error('Authentication required', 401);
        }

        $tokenHash = hash('sha256', $token);

        $session = Database::findOne('sessions', [
            'token_hash' => $tokenHash,
            'is_revoked' => false,
            'expires_at' => ['$gte' => date('c')],
        ]);

        if (!$session) {
            Response::error('Invalid or expired token', 401);
        }

        $user = Database::findOne('users', ['_id' => $session['user_id']]);
        if (!$user || !$user['is_active']) {
            Response::error('Account is disabled', 403);
        }

        $session['user_id'] = $user['id'];
        $session['email'] = $user['email'];
        $session['full_name'] = $user['full_name'];
        $session['role'] = $user['role'];
        $session['is_active'] = $user['is_active'];

        return $session;
    }

    private static function extractToken(): ?string
    {
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (preg_match('/Bearer\s+(.+)$/i', $header, $matches)) {
            return $matches[1];
        }
        if (!empty($_GET['token'])) {
            return $_GET['token'];
        }
        return null;
    }
}

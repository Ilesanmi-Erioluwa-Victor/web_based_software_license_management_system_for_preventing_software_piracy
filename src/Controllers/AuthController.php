<?php

namespace App\Controllers;

use App\Config\Database;
use App\Models\User;
use App\Helpers\Response;
use App\Helpers\Validator;
use App\Helpers\Logger;
use App\Middleware\AuthMiddleware;

class AuthController
{
    public static function register(): void
    {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $validation = Validator::make($data, [
            'email' => 'required|email',
            'password' => 'required|min:8',
            'full_name' => 'required|min:2',
        ]);

        if (!$validation['passes']) {
            Response::error('Validation failed', 422, $validation['errors']);
        }

        if (User::findByEmail($data['email'])) {
            Response::error('Email already registered', 409);
        }

        $userId = User::create($data);
        $user = User::findById($userId);

        Logger::audit('user_registered', $userId);
        Response::success(
            ['user' => $user],
            'Registration successful',
            201
        );
    }

    public static function login(): void
    {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $validation = Validator::make($data, [
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (!$validation['passes']) {
            Response::error('Validation failed', 422, $validation['errors']);
        }

        $user = User::findByEmail($data['email']);
        if (!$user || !password_verify($data['password'], $user['password_hash'])) {
            Response::error('Invalid credentials', 401);
        }

        if (!$user['is_active']) {
            Response::error('Account is disabled', 403);
        }

        $token = bin2hex(random_bytes(32));
        $tokenHash = hash('sha256', $token);

        Database::insertOne('sessions', [
            'user_id' => $user['id'],
            'token_hash' => $tokenHash,
            'ip_address' => $_SERVER['REMOTE_ADDR'] ?? null,
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null,
            'expires_at' => date('c', time() + (int) ($_ENV['SESSION_LIFETIME'] ?? 86400)),
            'is_revoked' => false,
            'created_at' => date('c'),
        ]);

        Logger::audit('user_login', $user['id']);

        Response::success([
            'token' => $token,
            'user' => [
                'id' => $user['id'],
                'email' => $user['email'],
                'full_name' => $user['full_name'],
                'role' => $user['role'],
                'company_name' => $user['company_name'],
            ],
        ], 'Login successful');
    }

    public static function logout(): void
    {
        $session = AuthMiddleware::handle();

        Database::updateOne('sessions', ['_id' => $session['id']], ['is_revoked' => true]);
        Logger::audit('user_logout', $session['user_id']);

        Response::success(null, 'Logged out successfully');
    }

    public static function me(): void
    {
        $session = AuthMiddleware::handle();
        $user = User::findById($session['user_id']);

        Response::success([
            'id' => $user['id'],
            'email' => $user['email'],
            'full_name' => $user['full_name'],
            'role' => $user['role'],
            'company_name' => $user['company_name'],
            'two_factor_enabled' => $user['two_factor_enabled'],
            'created_at' => $user['created_at'],
        ]);
    }
}

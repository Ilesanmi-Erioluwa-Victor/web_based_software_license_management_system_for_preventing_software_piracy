<?php

namespace App\Controllers;

use App\Models\User;
use App\Models\License;
use App\Models\Activation;
use App\Models\AuditLog;
use App\Helpers\Response;
use App\Middleware\AdminMiddleware;

class AdminController
{
    public static function stats(): void
    {
        AdminMiddleware::handle();

        $licenseStats = License::getStats();
        $userCounts = User::countByRole();
        $recentActivations = Activation::getRecentActivationCount(30);
        $recentLogs = AuditLog::findAll(1, 10);

        Response::success([
            'licenses' => $licenseStats,
            'users' => $userCounts,
            'recent_activations_30d' => $recentActivations,
            'recent_activity' => $recentLogs['items'],
        ]);
    }

    public static function users(): void
    {
        AdminMiddleware::handle();
        $page = (int) ($_GET['page'] ?? 1);
        $perPage = (int) ($_GET['per_page'] ?? 20);

        $result = User::findAll($page, $perPage);
        Response::paginated($result['items'], $result['total'], $page, $perPage);
    }

    public static function suspendUser(string $id): void
    {
        AdminMiddleware::handle();
        $user = User::findById($id);

        if (!$user) {
            Response::error('User not found', 404);
        }

        User::updateProfile($id, ['is_active' => false]);
        Response::success(null, 'User suspended');
    }

    public static function auditLogs(): void
    {
        AdminMiddleware::handle();
        $page = (int) ($_GET['page'] ?? 1);
        $perPage = (int) ($_GET['per_page'] ?? 50);

        $filters = [
            'action' => $_GET['action'] ?? null,
            'actor_id' => $_GET['actor_id'] ?? null,
            'license_id' => $_GET['license_id'] ?? null,
        ];

        $result = AuditLog::findAll($page, $perPage, $filters);
        Response::paginated($result['items'], $result['total'], $page, $perPage);
    }
}

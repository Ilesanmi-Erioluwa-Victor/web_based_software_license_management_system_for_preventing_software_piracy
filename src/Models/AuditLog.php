<?php

namespace App\Models;

use App\Config\Database;

class AuditLog
{
    private static string $collection = 'audit_logs';

    public static function findAll(int $page = 1, int $perPage = 50, array $filters = []): array
    {
        $filter = [];

        if (!empty($filters['action'])) {
            $filter['action'] = $filters['action'];
        }
        if (!empty($filters['license_id'])) {
            $filter['license_id'] = $filters['license_id'];
        }
        if (!empty($filters['actor_id'])) {
            $filter['actor_id'] = $filters['actor_id'];
        }

        $total = Database::count(self::$collection, $filter);
        $items = Database::findMany(
            self::$collection,
            $filter,
            ['sort' => ['created_at' => -1], 'skip' => ($page - 1) * $perPage, 'limit' => $perPage]
        );

        $items = array_map(function ($log) {
            if (!empty($log['actor_id'])) {
                $user = Database::findOne('users', ['_id' => $log['actor_id']], ['projection' => ['full_name' => 1]]);
                $log['actor_name'] = $user['full_name'] ?? null;
            }
            return $log;
        }, $items);

        return ['items' => $items, 'total' => $total];
    }
}

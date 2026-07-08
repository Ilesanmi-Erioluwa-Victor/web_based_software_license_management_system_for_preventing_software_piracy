<?php

namespace App\Models;

use App\Config\Database;

class License
{
    private static string $collection = 'licenses';

    public static function findById(string $id): ?array
    {
        $license = Database::findOne(self::$collection, ['_id' => $id]);
        if ($license) {
            $product = Database::findOne('products', ['_id' => $license['product_id']], ['projection' => ['name' => 1, 'version' => 1]]);
            $license['product_name'] = $product['name'] ?? 'Unknown';
            $license['product_version'] = $product['version'] ?? null;
        }
        return $license;
    }

    public static function findByKey(string $key): ?array
    {
        $license = Database::findOne(self::$collection, ['license_key' => $key]);
        if ($license) {
            $product = Database::findOne('products', ['_id' => $license['product_id']], ['projection' => ['name' => 1, 'version' => 1]]);
            $license['product_name'] = $product['name'] ?? 'Unknown';
            $license['product_version'] = $product['version'] ?? null;
        }
        return $license;
    }

    public static function create(array $data): string
    {
        return Database::insertOne(self::$collection, [
            'license_key' => $data['license_key'],
            'product_id' => $data['product_id'],
            'template_id' => $data['template_id'] ?? null,
            'user_id' => $data['user_id'] ?? null,
            'customer_name' => $data['customer_name'],
            'customer_email' => $data['customer_email'],
            'license_type' => $data['license_type'],
            'max_activations' => (int) ($data['max_activations'] ?? 1),
            'status' => 'active',
            'issued_at' => date('c'),
            'expires_at' => $data['expires_at'] ?? null,
            'revoked_at' => null,
            'revoked_reason' => null,
            'metadata' => $data['metadata'] ?? [],
            'created_at' => date('c'),
            'updated_at' => date('c'),
        ]);
    }

    public static function updateStatus(string $id, string $status, ?string $reason = null): void
    {
        $data = [
            'status' => $status,
            'updated_at' => date('c'),
        ];
        if ($status === 'revoked') {
            $data['revoked_at'] = date('c');
            $data['revoked_reason'] = $reason;
        }
        Database::updateOne(self::$collection, ['_id' => $id], $data);
    }

    public static function renew(string $id, string $newExpiresAt): void
    {
        Database::updateOne(self::$collection, ['_id' => $id], [
            'status' => 'active',
            'expires_at' => $newExpiresAt,
            'updated_at' => date('c'),
        ]);
    }

    public static function findAll(array $filters = [], int $page = 1, int $perPage = 20): array
    {
        $filter = [];

        if (!empty($filters['product_id'])) {
            $filter['product_id'] = $filters['product_id'];
        }
        if (!empty($filters['status'])) {
            $filter['status'] = $filters['status'];
        }
        if (!empty($filters['license_type'])) {
            $filter['license_type'] = $filters['license_type'];
        }
        if (!empty($filters['customer_email'])) {
            $filter['customer_email'] = $filters['customer_email'];
        }
        if (!empty($filters['search'])) {
            $s = $filters['search'];
            $filter['$or'] = [
                ['license_key' => ['$regex' => $s, '$options' => 'i']],
                ['customer_name' => ['$regex' => $s, '$options' => 'i']],
                ['customer_email' => ['$regex' => $s, '$options' => 'i']],
            ];
        }
        if (!empty($filters['publisher_id'])) {
            $productIds = Database::findMany('products', ['publisher_id' => $filters['publisher_id']], ['projection' => ['_id' => 1]]);
            $ids = array_map(fn($p) => $p['id'], $productIds);
            $filter['product_id'] = ['$in' => array_map(fn($id) => Database::id($id), $ids)];
        }

        $total = Database::count(self::$collection, $filter);
        $items = Database::findMany(
            self::$collection,
            $filter,
            ['sort' => ['created_at' => -1], 'skip' => ($page - 1) * $perPage, 'limit' => $perPage]
        );

        $items = array_map(function ($license) {
            $product = Database::findOne('products', ['_id' => $license['product_id']], ['projection' => ['name' => 1, 'version' => 1]]);
            $license['product_name'] = $product['name'] ?? 'Unknown';
            $license['product_version'] = $product['version'] ?? null;
            return $license;
        }, $items);

        return ['items' => $items, 'total' => $total];
    }

    public static function bulkInsert(array $licenses): int
    {
        $count = 0;
        foreach ($licenses as $license) {
            self::create($license);
            $count++;
        }
        return $count;
    }

    public static function getStats(?string $publisherId = null): array
    {
        $match = [];
        if ($publisherId) {
            $products = Database::findMany('products', ['publisher_id' => $publisherId], ['projection' => ['_id' => 1]]);
            $productIds = array_map(fn($p) => $p['id'], $products);
            $match['product_id'] = ['$in' => array_map(fn($id) => Database::id($id), $productIds)];
        }

        $total = Database::count(self::$collection, $match);

        $byStatus = Database::aggregate(self::$collection, [
            ['$match' => $match],
            ['$group' => ['_id' => '$status', 'count' => ['$sum' => 1]]],
            ['$project' => ['status' => '$_id', 'count' => 1, '_id' => 0]],
        ]);

        $expiringMatch = array_merge($match, [
            'status' => 'active',
            'expires_at' => ['$ne' => null],
        ]);
        $expiringSoon = Database::count(self::$collection, $expiringMatch);

        $activeActivations = 0;
        $licenses = Database::findMany(self::$collection, $match, ['projection' => ['_id' => 1]]);
        foreach ($licenses as $l) {
            $activeActivations += Activation::countActiveByLicense($l['id']);
        }

        return [
            'total_licenses' => $total,
            'by_status' => $byStatus,
            'expiring_in_7_days' => $expiringSoon,
            'active_activations' => $activeActivations,
        ];
    }

    public static function findExpiringLicenses(int $days = 7): array
    {
        $future = date('c', strtotime("+{$days} days"));
        return Database::findMany(self::$collection, [
            'status' => 'active',
            'expires_at' => ['$ne' => null, '$lte' => $future],
        ]);
    }

    public static function getExpiredCount(): int
    {
        $result = Database::updateMany(self::$collection, [
            'status' => 'active',
            'expires_at' => ['$ne' => null, '$lte' => date('c')],
        ], ['status' => 'expired', 'updated_at' => date('c')]);
        return $result;
    }
}

<?php

namespace App\Models;

use App\Config\Database;

class Product
{
    private static string $collection = 'products';

    public static function findById(string $id): ?array
    {
        $product = Database::findOne(self::$collection, ['_id' => $id]);
        if ($product) {
            $user = Database::findOne('users', ['_id' => $product['publisher_id']], ['projection' => ['full_name' => 1]]);
            $product['publisher_name'] = $user['full_name'] ?? 'Unknown';
        }
        return $product;
    }

    public static function create(array $data): string
    {
        return Database::insertOne(self::$collection, [
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'version' => $data['version'] ?? null,
            'publisher_id' => $data['publisher_id'],
            'metadata' => $data['metadata'] ?? [],
            'is_active' => true,
            'created_at' => date('c'),
            'updated_at' => date('c'),
        ]);
    }

    public static function update(string $id, array $data): void
    {
        $data['updated_at'] = date('c');
        Database::updateOne(self::$collection, ['_id' => $id], $data);
    }

    public static function delete(string $id): void
    {
        Database::deleteOne(self::$collection, ['_id' => $id]);
    }

    public static function findAll(?string $publisherId = null, int $page = 1, int $perPage = 20): array
    {
        $filter = [];
        if ($publisherId) {
            $filter['publisher_id'] = $publisherId;
        }

        $total = Database::count(self::$collection, $filter);
        $items = Database::findMany(
            self::$collection,
            $filter,
            ['sort' => ['created_at' => -1], 'skip' => ($page - 1) * $perPage, 'limit' => $perPage]
        );

        $items = array_map(function ($product) {
            $user = Database::findOne('users', ['_id' => $product['publisher_id']], ['projection' => ['full_name' => 1]]);
            $product['publisher_name'] = $user['full_name'] ?? 'Unknown';
            return $product;
        }, $items);

        return ['items' => $items, 'total' => $total];
    }

    public static function getLicensesCount(string $id): int
    {
        return Database::count('licenses', ['product_id' => $id]);
    }
}

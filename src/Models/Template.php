<?php

namespace App\Models;

use App\Config\Database;

class Template
{
    private static string $collection = 'license_templates';

    public static function findById(string $id): ?array
    {
        $template = Database::findOne(self::$collection, ['_id' => $id]);
        if ($template) {
            $product = Database::findOne('products', ['_id' => $template['product_id']], ['projection' => ['name' => 1]]);
            $template['product_name'] = $product['name'] ?? 'Unknown';
        }
        return $template;
    }

    public static function findByProduct(string $productId): array
    {
        return Database::findMany(
            self::$collection,
            ['product_id' => $productId, 'is_active' => true],
            ['sort' => ['name' => 1]]
        );
    }

    public static function create(array $data): string
    {
        return Database::insertOne(self::$collection, [
            'product_id' => $data['product_id'],
            'name' => $data['name'],
            'license_type' => $data['license_type'],
            'duration_days' => $data['duration_days'] ?? null,
            'max_activations' => $data['max_activations'] ?? 1,
            'features' => $data['features'] ?? [],
            'price' => $data['price'] ?? null,
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
}

<?php

namespace App\Models;

use App\Config\Database;

class User
{
    private static string $collection = 'users';

    public static function findById(string $id): ?array
    {
        return Database::findOne(self::$collection, ['_id' => $id]);
    }

    public static function findByEmail(string $email): ?array
    {
        return Database::findOne(self::$collection, ['email' => $email]);
    }

    public static function create(array $data): string
    {
        return Database::insertOne(self::$collection, [
            'email' => $data['email'],
            'password_hash' => password_hash($data['password'], PASSWORD_BCRYPT),
            'full_name' => $data['full_name'],
            'company_name' => $data['company_name'] ?? null,
            'role' => $data['role'] ?? 'user',
            'is_active' => true,
            'two_factor_enabled' => false,
            'two_factor_secret' => null,
            'email_verified_at' => null,
            'created_at' => date('c'),
            'updated_at' => date('c'),
        ]);
    }

    public static function updatePassword(string $id, string $password): void
    {
        Database::updateOne(self::$collection, ['_id' => $id], [
            'password_hash' => password_hash($password, PASSWORD_BCRYPT),
            'updated_at' => date('c'),
        ]);
    }

    public static function updateProfile(string $id, array $data): void
    {
        $data['updated_at'] = date('c');
        Database::updateOne(self::$collection, ['_id' => $id], $data);
    }

    public static function findAll(int $page = 1, int $perPage = 20): array
    {
        $total = Database::count(self::$collection);
        $items = Database::findMany(
            self::$collection,
            [],
            ['sort' => ['created_at' => -1], 'skip' => ($page - 1) * $perPage, 'limit' => $perPage]
        );
        return ['items' => $items, 'total' => $total];
    }

    public static function countByRole(): array
    {
        return Database::aggregate(self::$collection, [
            ['$group' => ['_id' => '$role', 'count' => ['$sum' => 1]]],
            ['$project' => ['role' => '$_id', 'count' => 1, '_id' => 0]],
        ]);
    }

    public static function setTwoFactorSecret(string $id, ?string $secret): void
    {
        Database::updateOne(self::$collection, ['_id' => $id], [
            'two_factor_secret' => $secret,
            'two_factor_enabled' => $secret !== null,
            'updated_at' => date('c'),
        ]);
    }
}

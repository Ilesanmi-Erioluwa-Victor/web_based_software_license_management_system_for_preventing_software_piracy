<?php

namespace App\Models;

use App\Config\Database;

class Activation
{
    private static string $collection = 'activations';

    public static function findById(string $id): ?array
    {
        return Database::findOne(self::$collection, ['_id' => $id]);
    }

    public static function findByLicenseAndHardware(string $licenseId, string $hardwareId): ?array
    {
        return Database::findOne(self::$collection, [
            'license_id' => $licenseId,
            'hardware_id' => $hardwareId,
            'is_active' => true,
        ]);
    }

    public static function create(array $data): string
    {
        return Database::insertOne(self::$collection, [
            'license_id' => $data['license_id'],
            'hardware_id' => $data['hardware_id'],
            'machine_name' => $data['machine_name'] ?? null,
            'ip_address' => $data['ip_address'] ?? ($_SERVER['REMOTE_ADDR'] ?? null),
            'is_active' => true,
            'activated_at' => date('c'),
            'last_validated_at' => null,
            'deactivated_at' => null,
            'metadata' => $data['metadata'] ?? [],
        ]);
    }

    public static function deactivate(string $id): void
    {
        Database::updateOne(self::$collection, ['_id' => $id], [
            'is_active' => false,
            'deactivated_at' => date('c'),
        ]);
    }

    public static function updateLastValidated(string $id): void
    {
        Database::updateOne(self::$collection, ['_id' => $id], [
            'last_validated_at' => date('c'),
            'ip_address' => $_SERVER['REMOTE_ADDR'] ?? null,
        ]);
    }

    public static function countActiveByLicense(string $licenseId): int
    {
        return Database::count(self::$collection, [
            'license_id' => $licenseId,
            'is_active' => true,
        ]);
    }

    public static function findByLicense(string $licenseId): array
    {
        return Database::findMany(
            self::$collection,
            ['license_id' => $licenseId],
            ['sort' => ['activated_at' => -1]]
        );
    }

    public static function getRecentActivationCount(int $days = 30): int
    {
        $since = date('c', strtotime("-{$days} days"));
        return Database::count(self::$collection, [
            'activated_at' => ['$gte' => $since],
        ]);
    }
}

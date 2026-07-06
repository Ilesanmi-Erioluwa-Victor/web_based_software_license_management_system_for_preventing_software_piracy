<?php

namespace App\Services;

use App\Models\License;
use App\Models\Activation;
use App\Helpers\Logger;

class LicenseValidator
{
    public static function validate(string $licenseKey, string $hardwareId, ?string $machineName = null): array
    {
        $license = License::findByKey($licenseKey);

        if (!$license) {
            Logger::audit('validate_failed', null, null, null, null, [
                'license_key' => $licenseKey,
                'hardware_id' => $hardwareId,
                'reason' => 'License key not found',
            ]);
            return ['valid' => false, 'reason' => 'License key not found'];
        }

        if ($license['status'] === 'revoked') {
            Logger::audit('validate_failed', null, $license['id'], null, null, [
                'license_key' => $licenseKey,
                'hardware_id' => $hardwareId,
                'reason' => 'License has been revoked',
                'revoked_reason' => $license['revoked_reason'],
            ]);
            return ['valid' => false, 'reason' => 'License has been revoked'];
        }

        if ($license['status'] === 'suspended') {
            Logger::audit('validate_failed', null, $license['id'], null, null, [
                'license_key' => $licenseKey,
                'hardware_id' => $hardwareId,
                'reason' => 'License is suspended',
            ]);
            return ['valid' => false, 'reason' => 'License is suspended'];
        }

        if ($license['status'] === 'expired') {
            Logger::audit('validate_failed', null, $license['id'], null, null, [
                'license_key' => $licenseKey,
                'hardware_id' => $hardwareId,
                'reason' => 'License has expired',
            ]);
            return ['valid' => false, 'reason' => 'License has expired'];
        }

        if ($license['expires_at'] && strtotime($license['expires_at']) < time()) {
            License::updateStatus($license['id'], 'expired');
            Logger::audit('validate_failed', null, $license['id'], null, null, [
                'license_key' => $licenseKey,
                'hardware_id' => $hardwareId,
                'reason' => 'License has expired',
            ]);
            return ['valid' => false, 'reason' => 'License has expired'];
        }

        $existingActivation = Activation::findByLicenseAndHardware($license['id'], $hardwareId);
        if ($existingActivation) {
            Activation::updateLastValidated($existingActivation['id']);
            Logger::audit('validate_success', null, $license['id'], null, null, [
                'license_key' => $licenseKey,
                'hardware_id' => $hardwareId,
                'machine_name' => $machineName,
                'activation_id' => $existingActivation['id'],
            ]);
            return [
                'valid' => true,
                'license_type' => $license['license_type'],
                'expires_at' => $license['expires_at'],
                'product_name' => $license['product_name'],
                'product_version' => $license['product_version'],
                'features' => json_decode($license['metadata'], true) ?? [],
            ];
        }

        $activeCount = Activation::countActiveByLicense($license['id']);
        if ($activeCount >= (int) $license['max_activations']) {
            Logger::audit('validate_failed', null, $license['id'], null, null, [
                'license_key' => $licenseKey,
                'hardware_id' => $hardwareId,
                'reason' => 'Maximum activations reached',
                'active_count' => $activeCount,
                'max_activations' => $license['max_activations'],
            ]);
            return ['valid' => false, 'reason' => 'Maximum number of activations reached'];
        }

        Logger::audit('validate_success', null, $license['id'], null, null, [
            'license_key' => $licenseKey,
            'hardware_id' => $hardwareId,
            'machine_name' => $machineName,
        ]);

        return [
            'valid' => true,
            'license_type' => $license['license_type'],
            'expires_at' => $license['expires_at'],
            'product_name' => $license['product_name'],
            'product_version' => $license['product_version'],
            'features' => json_decode($license['metadata'], true) ?? [],
        ];
    }

    public static function canActivate(string $licenseKey, string $hardwareId): array
    {
        $license = License::findByKey($licenseKey);

        if (!$license || $license['status'] !== 'active') {
            return ['allowed' => false, 'reason' => 'License is not active'];
        }

        if ($license['expires_at'] && strtotime($license['expires_at']) < time()) {
            return ['allowed' => false, 'reason' => 'License has expired'];
        }

        $existingActivation = Activation::findByLicenseAndHardware($license['id'], $hardwareId);
        if ($existingActivation) {
            return ['allowed' => true, 'already_activated' => true, 'activation_id' => $existingActivation['id']];
        }

        $activeCount = Activation::countActiveByLicense($license['id']);
        if ($activeCount >= (int) $license['max_activations']) {
            return ['allowed' => false, 'reason' => 'Maximum activations reached'];
        }

        return ['allowed' => true, 'already_activated' => false];
    }
}

<?php

namespace App\Controllers;

use App\Models\License;
use App\Models\Activation;
use App\Helpers\Response;
use App\Helpers\Validator;
use App\Helpers\Logger;
use App\Middleware\AuthMiddleware;
use App\Services\LicenseValidator;
use App\Services\EmailService;

class ActivationController
{
    public static function activate(): void
    {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $validation = Validator::make($data, [
            'license_key' => 'required',
            'hardware_id' => 'required',
        ]);

        if (!$validation['passes']) {
            Response::error('Validation failed', 422, $validation['errors']);
        }

        $canActivate = LicenseValidator::canActivate($data['license_key'], $data['hardware_id']);

        if (!$canActivate['allowed']) {
            Response::error($canActivate['reason'], 400);
        }

        if ($canActivate['already_activated']) {
            Activation::updateLastValidated($canActivate['activation_id']);
            Logger::audit('activation_verified', null, null, null, null, [
                'license_key' => $data['license_key'],
                'hardware_id' => $data['hardware_id'],
                'activation_id' => $canActivate['activation_id'],
            ]);
            Response::success([
                'activated' => true,
                'activation_id' => $canActivate['activation_id'],
            ], 'Already activated. Verified.');
        }

        $license = License::findByKey($data['license_key']);
        $activationId = Activation::create([
            'license_id' => $license['id'],
            'hardware_id' => $data['hardware_id'],
            'machine_name' => $data['machine_name'] ?? null,
        ]);

        Logger::audit('license_activated', null, $license['id'], null, null, [
            'hardware_id' => $data['hardware_id'],
            'machine_name' => $data['machine_name'] ?? null,
        ]);

        EmailService::sendActivationAlert(
            $license['customer_email'],
            $license['customer_name'],
            $license['license_key'],
            $license['product_name'],
            $data['hardware_id'],
            $data['machine_name'] ?? 'Unknown'
        );

        Response::success([
            'activated' => true,
            'activation_id' => $activationId,
        ], 'License activated', 201);
    }

    public static function deactivate(): void
    {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $validation = Validator::make($data, [
            'license_key' => 'required',
            'hardware_id' => 'required',
        ]);

        if (!$validation['passes']) {
            Response::error('Validation failed', 422, $validation['errors']);
        }

        $license = License::findByKey($data['license_key']);
        if (!$license) {
            Response::error('License not found', 404);
        }

        $activation = Activation::findByLicenseAndHardware($license['id'], $data['hardware_id']);
        if (!$activation) {
            Response::error('Activation not found', 404);
        }

        Activation::deactivate($activation['id']);

        Logger::audit('license_deactivated', null, $license['id'], null, null, [
            'hardware_id' => $data['hardware_id'],
        ]);

        Response::success(null, 'License deactivated');
    }

    public static function listByLicense(string $licenseId): void
    {
        $session = AuthMiddleware::handle();
        $license = License::findById($licenseId);

        if (!$license) {
            Response::error('License not found', 404);
        }

        $activations = Activation::findByLicense($licenseId);
        Response::success($activations);
    }
}

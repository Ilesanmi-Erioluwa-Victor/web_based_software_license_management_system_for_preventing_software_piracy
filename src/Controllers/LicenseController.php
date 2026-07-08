<?php

namespace App\Controllers;

use App\Models\License;
use App\Models\Product;
use App\Models\Activation;
use App\Helpers\Response;
use App\Helpers\Validator;
use App\Helpers\Logger;
use App\Middleware\AuthMiddleware;
use App\Services\LicenseGenerator;
use App\Services\LicenseValidator;
use App\Services\EmailService;
use App\Services\ExportService;

class LicenseController
{
    public static function index(): void
    {
        $session = AuthMiddleware::handle();
        $page = (int) ($_GET['page'] ?? 1);
        $perPage = (int) ($_GET['per_page'] ?? 20);

        $filters = [
            'product_id' => $_GET['product_id'] ?? null,
            'status' => $_GET['status'] ?? null,
            'search' => $_GET['search'] ?? null,
            'license_type' => $_GET['license_type'] ?? null,
        ];

        if ($session['role'] !== 'admin') {
            $filters['publisher_id'] = $session['user_id'];
        }

        $result = License::findAll($filters, $page, $perPage);
        Response::paginated($result['items'], $result['total'], $page, $perPage);
    }

    public static function show(string $id): void
    {
        $session = AuthMiddleware::handle();
        $license = License::findById($id);

        if (!$license) {
            Response::error('License not found', 404);
        }

        $product = Product::findById($license['product_id']);
        if (!$product) {
            Response::error('Product not found', 404);
        }

        if ($session['role'] !== 'admin' && $product['publisher_id'] !== $session['user_id']) {
            Response::error('Forbidden', 403);
        }

        $license['activations'] = Activation::findByLicense($id);
        Response::success($license);
    }

    public static function store(): void
    {
        $session = AuthMiddleware::handle();
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $validation = Validator::make($data, [
            'product_id' => 'required',
            'customer_name' => 'required|min:2',
            'customer_email' => 'required|email',
            'license_type' => 'required|in:trial,subscription,perpetual,rental,floating,standard',
            'max_activations' => 'numeric',
        ]);

        if (!$validation['passes']) {
            Response::error('Validation failed', 422, $validation['errors']);
        }

        $product = Product::findById($data['product_id']);
        if (!$product) {
            Response::error('Product not found', 404);
        }

        if ($session['role'] !== 'admin' && $product['publisher_id'] !== $session['user_id']) {
            Response::error('Forbidden', 403);
        }

        $maxActivations = (int) ($data['max_activations'] ?? 1);
        $expiresAt = null;

        if (!empty($data['template_id'])) {
            $template = \App\Models\Template::findById($data['template_id']);
            if ($template) {
                $maxActivations = (int) ($template['max_activations'] ?? $maxActivations);
                $expiresAt = LicenseGenerator::calculateExpiry($template['license_type'], $template['duration_days']);
                $data['license_type'] = $template['license_type'];
            }
        }

        if (empty($expiresAt) && !empty($data['duration_days'])) {
            $expiresAt = LicenseGenerator::calculateExpiry('trial', (int) $data['duration_days']);
        }

        $licenseData = [
            'license_key' => LicenseGenerator::generateKey(),
            'product_id' => $data['product_id'],
            'template_id' => $data['template_id'] ?? null,
            'user_id' => $data['user_id'] ?? $session['user_id'],
            'customer_name' => $data['customer_name'],
            'customer_email' => $data['customer_email'],
            'license_type' => $data['license_type'],
            'max_activations' => $maxActivations,
            'expires_at' => $expiresAt,
            'metadata' => $data['metadata'] ?? [],
        ];

        $licenseId = License::create($licenseData);
        $license = License::findById($licenseId);

        Logger::audit('license_generated', $session['user_id'], $licenseId, null, null, [
            'product_id' => $data['product_id'],
            'customer_email' => $data['customer_email'],
            'license_type' => $data['license_type'],
        ]);

        EmailService::sendLicenseCreated(
            $data['customer_email'],
            $data['customer_name'],
            $license['license_key'],
            $product['name'],
            $expiresAt
        );

        Response::success($license, 'License generated', 201);
    }

    public static function bulkStore(): void
    {
        $session = AuthMiddleware::handle();
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        if (empty($data['licenses']) || !is_array($data['licenses'])) {
            Response::error('licenses array is required', 422);
        }

        $licenses = [];
        foreach ($data['licenses'] as $item) {
            $product = Product::findById($item['product_id']);
            if (!$product) continue;

            if ($session['role'] !== 'admin' && $product['publisher_id'] !== $session['user_id']) continue;

            $expiresAt = !empty($item['duration_days'])
                ? LicenseGenerator::calculateExpiry('trial', (int) $item['duration_days'])
                : null;

            $licenses[] = [
                'license_key' => LicenseGenerator::generateKey(),
                'product_id' => $item['product_id'],
                'customer_name' => $item['customer_name'],
                'customer_email' => $item['customer_email'],
                'license_type' => $item['license_type'] ?? 'standard',
                'max_activations' => $item['max_activations'] ?? 1,
                'expires_at' => $expiresAt,
                'metadata' => json_encode($item['metadata'] ?? []),
            ];
        }

        $count = License::bulkInsert($licenses);

        Logger::audit('licenses_bulk_generated', $session['user_id'], null, null, null, [
            'count' => $count,
        ]);

        Response::success(['generated' => $count], "{$count} licenses generated", 201);
    }

    public static function validate(): void
    {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $validation = Validator::make($data, [
            'license_key' => 'required',
            'hardware_id' => 'required',
        ]);

        if (!$validation['passes']) {
            Response::error('Validation failed', 422, $validation['errors']);
        }

        $result = LicenseValidator::validate(
            $data['license_key'],
            $data['hardware_id'],
            $data['machine_name'] ?? null
        );

        if ($result['valid']) {
            Response::success($result, 'License is valid');
        } else {
            Response::error($result['reason'], 400, $result);
        }
    }

    public static function renew(string $id): void
    {
        $session = AuthMiddleware::handle();
        $license = License::findById($id);

        if (!$license) {
            Response::error('License not found', 404);
        }

        $product = Product::findById($license['product_id']);
        if ($session['role'] !== 'admin' && $product['publisher_id'] !== $session['user_id']) {
            Response::error('Forbidden', 403);
        }

        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $newExpiry = $data['expires_at'] ?? date('c', strtotime('+1 year'));

        License::renew($id, $newExpiry);

        Logger::audit('license_renewed', $session['user_id'], $id, null, null, [
            'new_expiry' => $newExpiry,
        ]);

        Response::success(License::findById($id), 'License renewed');
    }

    public static function revoke(string $id): void
    {
        $session = AuthMiddleware::handle();
        $license = License::findById($id);

        if (!$license) {
            Response::error('License not found', 404);
        }

        $product = Product::findById($license['product_id']);
        if ($session['role'] !== 'admin' && $product['publisher_id'] !== $session['user_id']) {
            Response::error('Forbidden', 403);
        }

        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        License::updateStatus($id, 'revoked', $data['reason'] ?? null);

        $activations = Activation::findByLicense($id);
        foreach ($activations as $activation) {
            if ($activation['is_active']) {
                Activation::deactivate($activation['id']);
            }
        }

        Logger::audit('license_revoked', $session['user_id'], $id, null, null, [
            'reason' => $data['reason'] ?? null,
        ]);

        EmailService::sendLicenseRevoked(
            $license['customer_email'],
            $license['customer_name'],
            $license['license_key'],
            $product['name'],
            $data['reason'] ?? null
        );

        Response::success(License::findById($id), 'License revoked');
    }

    public static function export(): void
    {
        $session = AuthMiddleware::handle();

        $filters = [];
        if ($session['role'] !== 'admin') {
            $filters['publisher_id'] = $session['user_id'];
        }

        $csv = ExportService::exportLicensesCSV($filters);

        header('Content-Type: text/csv');
        header('Content-Disposition: attachment; filename="licenses_export_' . date('Y-m-d') . '.csv"');
        echo $csv;
        exit;
    }
}

<?php

use App\Controllers\AuthController;
use App\Controllers\ProductController;
use App\Controllers\TemplateController;
use App\Controllers\LicenseController;
use App\Controllers\ActivationController;
use App\Controllers\AdminController;
use App\Controllers\CustomerPortalController;

return [
    // Auth
    ['POST', '/api/auth/register', [AuthController::class, 'register']],
    ['POST', '/api/auth/login', [AuthController::class, 'login']],
    ['POST', '/api/auth/logout', [AuthController::class, 'logout']],
    ['GET', '/api/auth/me', [AuthController::class, 'me']],

    // Products
    ['GET', '/api/products', [ProductController::class, 'index']],
    ['POST', '/api/products', [ProductController::class, 'store']],
    ['GET', '/api/products/{id}', [ProductController::class, 'show']],
    ['PUT', '/api/products/{id}', [ProductController::class, 'update']],
    ['DELETE', '/api/products/{id}', [ProductController::class, 'destroy']],

    // License Templates
    ['GET', '/api/products/{productId}/templates', [TemplateController::class, 'index']],
    ['POST', '/api/products/{productId}/templates', [TemplateController::class, 'store']],
    ['PUT', '/api/templates/{id}', [TemplateController::class, 'update']],
    ['DELETE', '/api/templates/{id}', [TemplateController::class, 'destroy']],

    // Licenses
    ['GET', '/api/licenses', [LicenseController::class, 'index']],
    ['POST', '/api/licenses', [LicenseController::class, 'store']],
    ['POST', '/api/licenses/bulk', [LicenseController::class, 'bulkStore']],
    ['GET', '/api/licenses/export.csv', [LicenseController::class, 'export']],
    ['GET', '/api/licenses/{id}', [LicenseController::class, 'show']],
    ['POST', '/api/licenses/validate', [LicenseController::class, 'validate']],
    ['PUT', '/api/licenses/{id}/renew', [LicenseController::class, 'renew']],
    ['POST', '/api/licenses/{id}/revoke', [LicenseController::class, 'revoke']],

    // Activations
    ['POST', '/api/activations/activate', [ActivationController::class, 'activate']],
    ['POST', '/api/activations/deactivate', [ActivationController::class, 'deactivate']],
    ['GET', '/api/licenses/{licenseId}/activations', [ActivationController::class, 'listByLicense']],

    // Customer Portal
    ['GET', '/api/customer/licenses', [CustomerPortalController::class, 'myLicenses']],
    ['GET', '/api/customer/licenses/{id}', [CustomerPortalController::class, 'showLicense']],

    // Admin
    ['GET', '/api/admin/stats', [AdminController::class, 'stats']],
    ['GET', '/api/admin/users', [AdminController::class, 'users']],
    ['PUT', '/api/admin/users/{id}/suspend', [AdminController::class, 'suspendUser']],
    ['GET', '/api/admin/audit-logs', [AdminController::class, 'auditLogs']],

    // System
    ['GET', '/api/health', function () {
        \App\Helpers\Response::success([
            'status' => 'healthy',
            'timestamp' => date('c'),
            'php_version' => PHP_VERSION,
        ]);
    }],
    ['POST', '/api/cron/expire', function () {
        $result = \App\Services\ExpiryService::run();
        \App\Helpers\Response::success($result, 'Expiry check completed');
    }],
];

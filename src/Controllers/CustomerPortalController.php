<?php

namespace App\Controllers;

use App\Models\License;
use App\Models\Activation;
use App\Helpers\Response;
use App\Middleware\AuthMiddleware;

class CustomerPortalController
{
    public static function myLicenses(): void
    {
        $session = AuthMiddleware::handle();
        $page = (int) ($_GET['page'] ?? 1);
        $perPage = (int) ($_GET['per_page'] ?? 20);

        $result = License::findAll(
            ['search' => $session['email']],
            $page,
            $perPage
        );

        $items = array_map(function ($license) {
            $license['activations'] = Activation::findByLicense($license['id']);
            return $license;
        }, $result['items']);

        Response::paginated($items, $result['total'], $page, $perPage);
    }

    public static function showLicense(string $id): void
    {
        $session = AuthMiddleware::handle();
        $license = License::findById($id);

        if (!$license) {
            Response::error('License not found', 404);
        }

        if ($license['user_id'] !== $session['user_id'] && $license['customer_email'] !== $session['email']) {
            Response::error('Forbidden', 403);
        }

        $license['activations'] = Activation::findByLicense($id);
        Response::success($license);
    }
}

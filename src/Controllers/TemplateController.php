<?php

namespace App\Controllers;

use App\Models\Template;
use App\Models\Product;
use App\Helpers\Response;
use App\Helpers\Validator;
use App\Middleware\AuthMiddleware;

class TemplateController
{
    public static function index(string $productId): void
    {
        AuthMiddleware::handle();
        $templates = Template::findByProduct($productId);
        Response::success($templates);
    }

    public static function store(string $productId): void
    {
        $session = AuthMiddleware::handle();
        $product = Product::findById($productId);

        if (!$product) {
            Response::error('Product not found', 404);
        }

        if ($session['role'] !== 'admin' && $product['publisher_id'] !== $session['user_id']) {
            Response::error('Forbidden', 403);
        }

        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $validation = Validator::make($data, [
            'name' => 'required|min:2',
            'license_type' => 'required|in:trial,subscription,perpetual,rental,floating',
        ]);

        if (!$validation['passes']) {
            Response::error('Validation failed', 422, $validation['errors']);
        }

        $data['product_id'] = $productId;
        $id = Template::create($data);

        Response::success(Template::findById($id), 'Template created', 201);
    }

    public static function update(string $id): void
    {
        $session = AuthMiddleware::handle();
        $template = Template::findById($id);

        if (!$template) {
            Response::error('Template not found', 404);
        }

        $product = Product::findById($template['product_id']);
        if ($session['role'] !== 'admin' && $product['publisher_id'] !== $session['user_id']) {
            Response::error('Forbidden', 403);
        }

        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        Template::update($id, $data);

        Response::success(Template::findById($id), 'Template updated');
    }

    public static function destroy(string $id): void
    {
        $session = AuthMiddleware::handle();
        $template = Template::findById($id);

        if (!$template) {
            Response::error('Template not found', 404);
        }

        $product = Product::findById($template['product_id']);
        if ($session['role'] !== 'admin' && $product['publisher_id'] !== $session['user_id']) {
            Response::error('Forbidden', 403);
        }

        Template::delete($id);
        Response::success(null, 'Template deleted');
    }
}

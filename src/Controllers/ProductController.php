<?php

namespace App\Controllers;

use App\Models\Product;
use App\Helpers\Response;
use App\Helpers\Validator;
use App\Helpers\Logger;
use App\Middleware\AuthMiddleware;

class ProductController
{
    public static function index(): void
    {
        $session = AuthMiddleware::handle();
        $page = (int) ($_GET['page'] ?? 1);
        $perPage = (int) ($_GET['per_page'] ?? 20);

        $publisherId = $session['role'] === 'admin' ? ($_GET['publisher_id'] ?? null) : $session['user_id'];
        $result = Product::findAll($publisherId, $page, $perPage);

        Response::paginated($result['items'], $result['total'], $page, $perPage);
    }

    public static function show(string $id): void
    {
        AuthMiddleware::handle();
        $product = Product::findById($id);

        if (!$product) {
            Response::error('Product not found', 404);
        }

        Response::success($product);
    }

    public static function store(): void
    {
        $session = AuthMiddleware::handle();
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $validation = Validator::make($data, [
            'name' => 'required|min:2|max:255',
        ]);

        if (!$validation['passes']) {
            Response::error('Validation failed', 422, $validation['errors']);
        }

        $data['publisher_id'] = $session['user_id'];
        $productId = Product::create($data);

        Logger::audit('product_created', $session['user_id'], null, null, null, [
            'product_id' => $productId,
            'name' => $data['name'],
        ]);

        $product = Product::findById($productId);
        Response::success($product, 'Product created', 201);
    }

    public static function update(string $id): void
    {
        $session = AuthMiddleware::handle();
        $product = Product::findById($id);

        if (!$product) {
            Response::error('Product not found', 404);
        }

        if ($session['role'] !== 'admin' && $product['publisher_id'] !== $session['user_id']) {
            Response::error('Forbidden', 403);
        }

        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        Product::update($id, $data);

        Logger::audit('product_updated', $session['user_id'], null, null, null, [
            'product_id' => $id,
        ]);

        Response::success(Product::findById($id), 'Product updated');
    }

    public static function destroy(string $id): void
    {
        $session = AuthMiddleware::handle();
        $product = Product::findById($id);

        if (!$product) {
            Response::error('Product not found', 404);
        }

        if ($session['role'] !== 'admin' && $product['publisher_id'] !== $session['user_id']) {
            Response::error('Forbidden', 403);
        }

        Product::delete($id);

        Logger::audit('product_deleted', $session['user_id'], null, null, null, [
            'product_id' => $id,
            'name' => $product['name'],
        ]);

        Response::success(null, 'Product deleted');
    }
}

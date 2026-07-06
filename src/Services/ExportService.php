<?php

namespace App\Services;

use App\Models\License;

class ExportService
{
    public static function exportLicensesCSV(array $filters = []): string
    {
        $licenses = License::findAll($filters, 1, 1000000);
        $output = fopen('php://temp', 'w+');

        fputcsv($output, [
            'License Key', 'Product', 'Customer Name', 'Customer Email',
            'License Type', 'Status', 'Max Activations', 'Issued At',
            'Expires At', 'Revoked At', 'Revoked Reason',
        ]);

        foreach ($licenses['items'] as $license) {
            fputcsv($output, [
                $license['license_key'],
                $license['product_name'],
                $license['customer_name'],
                $license['customer_email'],
                $license['license_type'],
                $license['status'],
                $license['max_activations'],
                $license['issued_at'],
                $license['expires_at'] ?? 'Perpetual',
                $license['revoked_at'] ?? '',
                $license['revoked_reason'] ?? '',
            ]);
        }

        rewind($output);
        $csv = stream_get_contents($output);
        fclose($output);

        return $csv;
    }
}

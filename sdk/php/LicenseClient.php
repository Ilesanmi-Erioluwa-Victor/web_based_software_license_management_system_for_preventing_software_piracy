<?php

/**
 * LicenseClient - PHP SDK for License Manager API
 *
 * Integrate this into your software to validate licenses.
 *
 * Usage:
 *   $client = new LicenseClient('https://your-app.onrender.com', 'your-api-key');
 *   $result = $client->validate('LICENSE-KEY', 'HW-ID');
 *   if ($result['success'] && $result['data']['valid']) {
 *       echo "License is valid!";
 *   }
 */

class LicenseClient
{
    private string $apiUrl;
    private string $apiKey;

    public function __construct(string $apiUrl, string $apiKey)
    {
        $this->apiUrl = rtrim($apiUrl, '/');
        $this->apiKey = $apiKey;
    }

    public function validate(string $licenseKey, string $hardwareId, ?string $machineName = null): array
    {
        return $this->request('POST', '/api/licenses/validate', [
            'license_key' => $licenseKey,
            'hardware_id' => $hardwareId,
            'machine_name' => $machineName,
        ]);
    }

    public function activate(string $licenseKey, string $hardwareId, ?string $machineName = null): array
    {
        return $this->request('POST', '/api/activations/activate', [
            'license_key' => $licenseKey,
            'hardware_id' => $hardwareId,
            'machine_name' => $machineName,
        ]);
    }

    public function deactivate(string $licenseKey, string $hardwareId): array
    {
        return $this->request('POST', '/api/activations/deactivate', [
            'license_key' => $licenseKey,
            'hardware_id' => $hardwareId,
        ]);
    }

    private function request(string $method, string $path, array $data = []): array
    {
        $ch = curl_init($this->apiUrl . $path);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 10,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $this->apiKey,
            ],
        ]);

        if ($method === 'POST') {
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($response === false) {
            return ['success' => false, 'message' => 'Connection failed'];
        }

        return json_decode($response, true) ?? ['success' => false, 'message' => 'Invalid response'];
    }
}

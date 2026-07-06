const SettingsPage = {
    render() {
        const app = document.getElementById('app');
        const user = Router.user;

        app.innerHTML = `
            <div class="min-h-screen flex">
                ${Sidebar.render(user)}
                <div class="flex-1 flex flex-col">
                    ${Navbar.render(user)}
                    <main class="flex-1 p-6 lg:p-8 overflow-y-auto">
                        <div class="max-w-3xl mx-auto">
                            <div class="mb-6">
                                <h1 class="text-2xl font-bold text-gray-900">Settings</h1>
                                <p class="text-sm text-gray-500 mt-1">Your profile and account information</p>
                            </div>

                            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                                <h2 class="text-lg font-semibold text-gray-900 mb-4">Profile</h2>
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                        <p class="text-sm text-gray-900">${user.full_name}</p>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                        <p class="text-sm text-gray-900">${user.email}</p>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                        <p class="text-sm text-gray-900 capitalize">${user.role}</p>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">Company</label>
                                        <p class="text-sm text-gray-900">${user.company_name || '-'}</p>
                                    </div>
                                </div>
                            </div>

                            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h2 class="text-lg font-semibold text-gray-900 mb-4">API Client SDK</h2>
                                <p class="text-sm text-gray-600 mb-4">Use the following code to validate licenses from your software:</p>
                                <div class="space-y-4">
                                    <div>
                                        <h3 class="text-sm font-medium text-gray-700 mb-2">PHP</h3>
                                        <pre class="bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-x-auto"><code>&lt;?php

class LicenseClient {
    private string $apiUrl;
    private string $apiKey;

    public function __construct(string $apiUrl, string $apiKey) {
        \$this->apiUrl = rtrim(\$apiUrl, '/');
        \$this->apiKey = \$apiKey;
    }

    public function validate(string \$licenseKey, string \$hardwareId, ?string \$machineName = null): array {
        \$ch = curl_init(\$this->apiUrl . '/api/licenses/validate');
        curl_setopt_array(\$ch, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Authorization: Bearer ' . \$this->apiKey,
            ],
            CURLOPT_POSTFIELDS => json_encode([
                'license_key' => \$licenseKey,
                'hardware_id' => \$hardwareId,
                'machine_name' => \$machineName,
            ]),
        ]);

        \$response = curl_exec(\$ch);
        \$httpCode = curl_getinfo(\$ch, CURLINFO_HTTP_CODE);
        curl_close(\$ch);

        return json_decode(\$response, true) ?? ['success' => false, 'message' => 'Connection failed'];
    }

    public function activate(string \$licenseKey, string \$hardwareId, ?string \$machineName = null): array {
        \$ch = curl_init(\$this->apiUrl . '/api/activations/activate');
        curl_setopt_array(\$ch, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Authorization: Bearer ' . \$this->apiKey,
            ],
            CURLOPT_POSTFIELDS => json_encode([
                'license_key' => \$licenseKey,
                'hardware_id' => \$hardwareId,
                'machine_name' => \$machineName,
            ]),
        ]);

        \$response = curl_exec(\$ch);
        \$httpCode = curl_getinfo(\$ch, CURLINFO_HTTP_CODE);
        curl_close(\$ch);

        return json_decode(\$response, true) ?? ['success' => false, 'message' => 'Connection failed'];
    }

    public function deactivate(string \$licenseKey, string \$hardwareId): array {
        \$ch = curl_init(\$this->apiUrl . '/api/activations/deactivate');
        curl_setopt_array(\$ch, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Authorization: Bearer ' . \$this->apiKey,
            ],
            CURLOPT_POSTFIELDS => json_encode([
                'license_key' => \$licenseKey,
                'hardware_id' => \$hardwareId,
            ]),
        ]);

        \$response = curl_exec(\$ch);
        \$httpCode = curl_getinfo(\$ch, CURLINFO_HTTP_CODE);
        curl_close(\$ch);

        return json_decode(\$response, true) ?? ['success' => false, 'message' => 'Connection failed'];
    }
}

// Usage:
// \$client = new LicenseClient('https://your-app.onrender.com', 'your-api-key');
// \$result = \$client->validate('LICENSE-KEY', 'HW-ID');
// if (\$result['success'] && \$result['data']['valid']) {
//     echo "License is valid!";
// }
</code></pre>
                                    </div>
                                    <div>
                                        <h3 class="text-sm font-medium text-gray-700 mb-2">JavaScript</h3>
                                        <pre class="bg-gray-900 text-yellow-300 p-4 rounded-lg text-xs overflow-x-auto"><code>class LicenseClient {
    constructor(apiUrl, apiKey) {
        this.apiUrl = apiUrl.replace(/\/$/, '');
        this.apiKey = apiKey;
    }

    async validate(licenseKey, hardwareId, machineName = null) {
        const res = await fetch(\`\${this.apiUrl}/api/licenses/validate\`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': \`Bearer \${this.apiKey}\`,
            },
            body: JSON.stringify({ license_key: licenseKey, hardware_id: hardwareId, machine_name: machineName }),
        });
        return res.json();
    }

    async activate(licenseKey, hardwareId, machineName = null) {
        const res = await fetch(\`\${this.apiUrl}/api/activations/activate\`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': \`Bearer \${this.apiKey}\`,
            },
            body: JSON.stringify({ license_key: licenseKey, hardware_id: hardwareId, machine_name: machineName }),
        });
        return res.json();
    }

    async deactivate(licenseKey, hardwareId) {
        const res = await fetch(\`\${this.apiUrl}/api/activations/deactivate\`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': \`Bearer \${this.apiKey}\`,
            },
            body: JSON.stringify({ license_key: licenseKey, hardware_id: hardwareId }),
        });
        return res.json();
    }
}

// Usage:
// const client = new LicenseClient('https://your-app.onrender.com', 'your-api-key');
// const result = await client.validate('LICENSE-KEY', 'HW-ID');
// if (result.success && result.data.valid) {
//     console.log('License is valid!');
// }
</code></pre>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        `;
    }
};

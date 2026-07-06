/**
 * LicenseClient - JavaScript SDK for License Manager API
 *
 * Usage:
 *   const client = new LicenseClient('https://your-app.onrender.com', 'your-api-key');
 *   const result = await client.validate('LICENSE-KEY', 'HW-ID');
 *   if (result.success && result.data.valid) {
 *       console.log('License is valid!');
 *   }
 */

class LicenseClient {
    constructor(apiUrl, apiKey) {
        this.apiUrl = apiUrl.replace(/\/+$/, '');
        this.apiKey = apiKey;
    }

    async validate(licenseKey, hardwareId, machineName = null) {
        return this.request('POST', '/api/licenses/validate', {
            license_key: licenseKey,
            hardware_id: hardwareId,
            machine_name: machineName,
        });
    }

    async activate(licenseKey, hardwareId, machineName = null) {
        return this.request('POST', '/api/activations/activate', {
            license_key: licenseKey,
            hardware_id: hardwareId,
            machine_name: machineName,
        });
    }

    async deactivate(licenseKey, hardwareId) {
        return this.request('POST', '/api/activations/deactivate', {
            license_key: licenseKey,
            hardware_id: hardwareId,
        });
    }

    async request(method, path, body = null) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        try {
            const res = await fetch(`${this.apiUrl}${path}`, options);
            return await res.json();
        } catch (err) {
            return { success: false, message: 'Network error: ' + err.message };
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = LicenseClient;
}

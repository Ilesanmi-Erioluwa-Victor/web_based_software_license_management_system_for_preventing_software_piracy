const CustomerPortalPage = {
    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="min-h-screen flex">
                ${Sidebar.render(Router.user)}
                <div class="flex-1 flex flex-col">
                    ${Navbar.render(Router.user)}
                    <main class="flex-1 p-6 lg:p-8 overflow-y-auto">
                        <div class="max-w-7xl mx-auto">
                            <div class="mb-6">
                                <h1 class="text-2xl font-bold text-gray-900">My Licenses</h1>
                                <p class="text-sm text-gray-500 mt-1">View your software licenses and activations</p>
                            </div>
                            <div id="customer-licenses-content">
                                <div class="text-center py-12 text-gray-400">Loading...</div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        `;
        await this.loadLicenses();
    },

    async loadLicenses() {
        try {
            const res = await api.get('/api/customer/licenses?per_page=50');
            const items = res.data || [];
            const html = items.length === 0
                ? '<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-400">No licenses assigned to you yet.</div>'
                : `<div class="grid grid-cols-1 md:grid-cols-2 gap-4">${items.map(l => `
                    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                        <div class="flex items-center justify-between mb-3">
                            <h3 class="font-semibold text-gray-900">${l.product_name || 'Software'}</h3>
                            ${this.statusBadge(l.status)}
                        </div>
                        <div class="space-y-2 text-sm">
                            <div class="flex justify-between">
                                <span class="text-gray-500">License Key</span>
                                <code class="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">${l.license_key}</code>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-500">Type</span>
                                <span class="capitalize">${l.license_type}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-500">Expires</span>
                                <span>${l.expires_at ? new Date(l.expires_at).toLocaleDateString() : 'Perpetual'}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-500">Activations</span>
                                <span>${l.activations ? l.activations.filter(a => a.is_active).length : 0} / ${l.max_activations}</span>
                            </div>
                        </div>
                        ${l.activations && l.activations.length > 0 ? `
                        <div class="mt-3 pt-3 border-t border-gray-100">
                            <p class="text-xs font-medium text-gray-500 mb-2">Activated Machines</p>
                            ${l.activations.map(a => `
                                <div class="flex items-center gap-2 text-xs text-gray-600 py-1">
                                    <span class="w-1.5 h-1.5 rounded-full ${a.is_active ? 'bg-green-500' : 'bg-gray-300'}"></span>
                                    <span>${a.machine_name || a.hardware_id.substring(0, 12)}...</span>
                                </div>
                            `).join('')}
                        </div>` : ''}
                    </div>
                `).join('')}</div>`;
            document.getElementById('customer-licenses-content').innerHTML = html;
        } catch (err) {
            document.getElementById('customer-licenses-content').innerHTML = `<div class="text-center py-12 text-red-600">${err.message}</div>`;
        }
    },

    statusBadge(status) {
        const colors = {
            active: 'bg-green-100 text-green-700',
            expired: 'bg-red-100 text-red-700',
            revoked: 'bg-gray-100 text-gray-600',
            suspended: 'bg-yellow-100 text-yellow-700',
        };
        return `<span class="px-2 py-0.5 text-xs font-medium rounded-full ${colors[status] || 'bg-gray-100 text-gray-600'} capitalize">${status}</span>`;
    }
};

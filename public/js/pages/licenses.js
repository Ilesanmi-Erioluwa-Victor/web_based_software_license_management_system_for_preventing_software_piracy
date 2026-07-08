const LicensesPage = {
    currentPage: 1,
    filters: {},

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="min-h-screen flex">
                ${Sidebar.render(Router.user)}
                <div class="flex-1 flex flex-col">
                    ${Navbar.render(Router.user)}
                    <main class="flex-1 p-6 lg:p-8 overflow-y-auto">
                        <div class="max-w-7xl mx-auto">
                            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                <div>
                                    <h1 class="text-2xl font-bold text-gray-900">Licenses</h1>
                                    <p class="text-sm text-gray-500 mt-1">Generate, manage, and validate software licenses</p>
                                </div>
                                <div class="flex gap-2">
                                    <button onclick="LicensesPage.showValidateForm()" class="px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition">Validate</button>
                                    <button onclick="LicensesPage.showGenerateForm()" class="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition">+ Generate</button>
                                </div>
                            </div>

                            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
                                <div class="flex flex-wrap gap-3">
                                    <input type="text" id="search-input" placeholder="Search by key, name or email..." class="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                                    <select id="status-filter" class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                                        <option value="">All Status</option>
                                        <option value="active">Active</option>
                                        <option value="expired">Expired</option>
                                        <option value="revoked">Revoked</option>
                                        <option value="suspended">Suspended</option>
                                    </select>
                                    <select id="type-filter" class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                                        <option value="">All Types</option>
                                        <option value="trial">Trial</option>
                                        <option value="subscription">Subscription</option>
                                        <option value="perpetual">Perpetual</option>
                                        <option value="rental">Rental</option>
                                        <option value="floating">Floating</option>
                                        <option value="standard">Standard</option>
                                    </select>
                                    <button onclick="LicensesPage.applyFilters()" class="px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-lg hover:bg-gray-700 transition">Search</button>
                                    <button onclick="LicensesPage.exportCSV()" class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition">Export CSV</button>
                                </div>
                            </div>

                            <div id="licenses-content">
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
            const params = new URLSearchParams({ page: this.currentPage, per_page: 20 });
            if (this.filters.search) params.set('search', this.filters.search);
            if (this.filters.status) params.set('status', this.filters.status);
            if (this.filters.license_type) params.set('license_type', this.filters.license_type);

            const res = await api.get(`/api/licenses?${params}`);
            this.renderTable(res);
        } catch (err) {
            document.getElementById('licenses-content').innerHTML = `<div class="text-center py-12 text-red-600">${err.message}</div>`;
        }
    },

    applyFilters() {
        this.filters = {
            search: document.getElementById('search-input').value,
            status: document.getElementById('status-filter').value,
            license_type: document.getElementById('type-filter').value,
        };
        this.currentPage = 1;
        this.loadLicenses();
    },

    renderTable(res) {
        const total = res.meta?.total || 0;
        const items = res.data || [];

        let html = `
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead>
                            <tr class="bg-gray-50 border-b border-gray-200">
                                <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">License Key</th>
                                <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Customer</th>
                                <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Product</th>
                                <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                                <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Expires</th>
                                <th class="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200">
                            ${items.length === 0 ? '<tr><td colspan="7" class="px-4 py-8 text-center text-gray-400">No licenses found</td></tr>' :
                            items.map(l => `
                                <tr class="hover:bg-gray-50 transition">
                                    <td class="px-4 py-3">
                                        <code class="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-800">${l.license_key}</code>
                                    </td>
                                    <td class="px-4 py-3">
                                        <div class="text-sm font-medium text-gray-900">${l.customer_name}</div>
                                        <div class="text-xs text-gray-500">${l.customer_email}</div>
                                    </td>
                                    <td class="px-4 py-3 text-sm text-gray-600">${l.product_name || '-'}</td>
                                    <td class="px-4 py-3 text-sm text-gray-600">${l.license_type}</td>
                                    <td class="px-4 py-3">${this.statusBadge(l.status)}</td>
                                    <td class="px-4 py-3 text-sm text-gray-500">${l.expires_at ? new Date(l.expires_at).toLocaleDateString() : 'Perpetual'}</td>
                                    <td class="px-4 py-3 text-right">
                                        <button onclick="LicensesPage.viewDetails('${l.id}')" class="text-indigo-600 hover:text-indigo-800 text-sm font-medium mr-2">View</button>
                                        <button onclick="LicensesPage.showRenew('${l.id}')" class="text-green-600 hover:text-green-800 text-sm font-medium mr-2">Renew</button>
                                        <button onclick="LicensesPage.confirmRevoke('${l.id}')" class="text-red-600 hover:text-red-800 text-sm font-medium">Revoke</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                ${total > 20 ? `
                <div class="flex items-center justify-between px-4 py-3 border-t">
                    <p class="text-sm text-gray-600">${total} total</p>
                    <div class="flex gap-2">
                        <button onclick="LicensesPage.prevPage()" ${this.currentPage <= 1 ? 'disabled' : ''} class="px-3 py-1 text-sm border rounded-lg ${this.currentPage <= 1 ? 'text-gray-300' : 'text-gray-700 hover:bg-gray-50'}">Prev</button>
                        <button onclick="LicensesPage.nextPage()" ${this.currentPage >= (res.meta?.last_page || 1) ? 'disabled' : ''} class="px-3 py-1 text-sm border rounded-lg ${this.currentPage >= (res.meta?.last_page || 1) ? 'text-gray-300' : 'text-gray-700 hover:bg-gray-50'}">Next</button>
                    </div>
                </div>` : ''}
            </div>
        `;
        document.getElementById('licenses-content').innerHTML = html;
    },

    statusBadge(status) {
        const colors = {
            active: 'bg-green-100 text-green-700',
            expired: 'bg-red-100 text-red-700',
            revoked: 'bg-gray-100 text-gray-600',
            suspended: 'bg-yellow-100 text-yellow-700',
        };
        return `<span class="px-2 py-1 text-xs font-medium rounded-full ${colors[status] || 'bg-gray-100 text-gray-600'} capitalize">${status}</span>`;
    },

    showGenerateForm() {
        Modal.show('Generate License', `
            <form id="license-form" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Product *</label>
                    <select name="product_id" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                        <option value="">Select product...</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
                    <input type="text" name="customer_name" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="John Doe" />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Customer Email *</label>
                    <input type="email" name="customer_email" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="customer@example.com" />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">License Type *</label>
                    <select name="license_type" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                        <option value="standard">Standard</option>
                        <option value="trial">Trial</option>
                        <option value="subscription">Subscription</option>
                        <option value="perpetual">Perpetual</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Duration (days, empty = perpetual)</label>
                    <input type="number" name="duration_days" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="365" />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Max Activations</label>
                    <input type="number" name="max_activations" value="1" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
            </form>
        `, async () => {
            const form = document.getElementById('license-form');
            try {
                await api.post('/api/licenses', {
                    product_id: form.product_id.value,
                    customer_name: form.customer_name.value,
                    customer_email: form.customer_email.value,
                    license_type: form.license_type.value,
                    duration_days: form.duration_days.value ? parseInt(form.duration_days.value) : null,
                    max_activations: parseInt(form.max_activations.value) || 1,
                });
                Modal.close();
                await this.loadLicenses();
            } catch (err) {
                alert(err.message);
            }
        });

        api.get('/api/products').then(res => {
            const select = document.querySelector('#license-form select[name="product_id"]');
            if (select && res.data) {
                res.data.forEach(p => {
                    select.innerHTML += `<option value="${p.id}">${p.name} ${p.version ? `(${p.version})` : ''}</option>`;
                });
            }
        });
    },

    showValidateForm() {
        Modal.show('Validate License', `
            <form id="validate-form" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">License Key *</label>
                    <input type="text" name="license_key" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono" placeholder="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX" />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Hardware ID *</label>
                    <input type="text" name="hardware_id" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono" placeholder="CPU serial or MAC address" />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Machine Name</label>
                    <input type="text" name="machine_name" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="My Workstation" />
                </div>
                <button id="validate-btn" type="submit" class="w-full py-2.5 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                    Validate
                </button>
                <div id="validate-result"></div>
            </form>
        `);

        document.querySelector('#validate-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const form = e.target;
            const btn = document.getElementById('validate-btn');
            const resultEl = document.getElementById('validate-result');
            resultEl.innerHTML = '';
            btn.disabled = true;
            btn.innerHTML = '<span class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span> Validating...';
            try {
                const res = await api.post('/api/licenses/validate', {
                    license_key: form.license_key.value,
                    hardware_id: form.hardware_id.value,
                    machine_name: form.machine_name.value || null,
                });
                resultEl.innerHTML = `<div class="p-3 bg-green-50 text-green-700 rounded-lg border border-green-200 text-sm font-medium">✅ License is valid!</div>`;
                btn.disabled = false;
                btn.innerHTML = 'Validate';
            } catch (err) {
                resultEl.innerHTML = `<div class="p-3 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm font-medium">❌ ${err.message}</div>`;
                btn.disabled = false;
                btn.innerHTML = 'Validate';
            }
        });
    },

    viewDetails(id) {
        api.get(`/api/licenses/${id}`).then(res => {
            const l = res.data;
            if (!l) return;
            const html = `
                <div class="space-y-3 text-sm">
                    <div class="grid grid-cols-2 gap-2">
                        <span class="text-gray-500">License Key</span>
                        <code class="font-mono bg-gray-100 px-2 py-1 rounded">${l.license_key}</code>
                        <span class="text-gray-500">Status</span>
                        <span>${this.statusBadge(l.status)}</span>
                        <span class="text-gray-500">Product</span>
                        <span>${l.product_name || '-'}</span>
                        <span class="text-gray-500">Customer</span>
                        <span>${l.customer_name} (${l.customer_email})</span>
                        <span class="text-gray-500">Type</span>
                        <span class="capitalize">${l.license_type}</span>
                        <span class="text-gray-500">Max Activations</span>
                        <span>${l.max_activations}</span>
                        <span class="text-gray-500">Issued</span>
                        <span>${l.issued_at ? new Date(l.issued_at).toLocaleString() : '-'}</span>
                        <span class="text-gray-500">Expires</span>
                        <span>${l.expires_at ? new Date(l.expires_at).toLocaleString() : 'Perpetual'}</span>
                    </div>
                    ${l.activations && l.activations.length > 0 ? `
                    <div class="mt-4">
                        <h4 class="font-medium text-gray-900 mb-2">Activations (${l.activations.length})</h4>
                        ${l.activations.map(a => `
                            <div class="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                                <span class="w-2 h-2 rounded-full ${a.is_active ? 'bg-green-500' : 'bg-gray-300'}"></span>
                                <code class="text-xs font-mono bg-gray-100 px-1 rounded">${a.hardware_id}</code>
                                <span class="text-xs text-gray-500">${a.machine_name || '-'}</span>
                                <span class="text-xs text-gray-400">${a.activated_at ? new Date(a.activated_at).toLocaleDateString() : ''}</span>
                            </div>
                        `).join('')}
                    </div>` : ''}
                </div>
            `;
            Modal.show('License Details', html);
        }).catch(err => alert(err.message));
    },

    showRenew(id) {
        Modal.show('Renew License', `
            <form id="renew-form" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">New Expiry Date *</label>
                    <input type="date" name="expires_at" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
            </form>
        `, async () => {
            const form = document.getElementById('renew-form');
            try {
                await api.put(`/api/licenses/${id}/renew`, {
                    expires_at: new Date(form.expires_at.value).toISOString(),
                });
                Modal.close();
                await this.loadLicenses();
            } catch (err) {
                alert(err.message);
            }
        });
    },

    confirmRevoke(id) {
        Modal.show('Revoke License', `
            <form id="revoke-form" class="space-y-4">
                <p class="text-gray-600">This will deactivate all activations and prevent future validation.</p>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
                    <textarea name="reason" rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="License violation"></textarea>
                </div>
            </form>
        `, async () => {
            const form = document.getElementById('revoke-form');
            try {
                await api.post(`/api/licenses/${id}/revoke`, {
                    reason: form.reason.value || null,
                });
                Modal.close();
                await this.loadLicenses();
            } catch (err) {
                alert(err.message);
            }
        });
    },

    async exportCSV() {
        try {
            const res = await fetch(`${API_BASE}/api/licenses/export.csv?token=${api.token}`);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `licenses_export_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            alert('Failed to export: ' + err.message);
        }
    },

    prevPage() { if (this.currentPage > 1) { this.currentPage--; this.loadLicenses(); } },
    nextPage() { this.currentPage++; this.loadLicenses(); },
};

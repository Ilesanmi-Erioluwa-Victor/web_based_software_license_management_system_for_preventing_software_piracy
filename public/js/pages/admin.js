const AdminPage = {
    async render() {
        if (Router.user.role !== 'admin') {
            document.getElementById('app').innerHTML = '<div class="p-8 text-center text-red-600">Access denied. Admin only.</div>';
            return;
        }

        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="min-h-screen flex">
                ${Sidebar.render(Router.user)}
                <div class="flex-1 flex flex-col">
                    ${Navbar.render(Router.user)}
                    <main class="flex-1 p-6 lg:p-8 overflow-y-auto">
                        <div class="max-w-7xl mx-auto">
                            <div class="mb-6">
                                <h1 class="text-2xl font-bold text-gray-900">Admin Panel</h1>
                                <p class="text-sm text-gray-500 mt-1">User management and audit logs</p>
                            </div>

                            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                                    <h2 class="text-sm font-semibold text-gray-900 mb-4">Users</h2>
                                    <div id="admin-users"><p class="text-sm text-gray-400">Loading...</p></div>
                                </div>
                                <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                                    <h2 class="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h2>
                                    <div class="space-y-2">
                                        <button onclick="Router.navigate('#/licenses')" class="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">🔑 Manage Licenses</button>
                                        <button onclick="Router.navigate('#/products')" class="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">📦 Manage Products</button>
                                        <button onclick="AdminPage.runExpiryCheck()" class="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">⏰ Run Expiry Check Now</button>
                                    </div>
                                </div>
                            </div>

                            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                                <h2 class="text-sm font-semibold text-gray-900 mb-4">Audit Logs</h2>
                                <div id="admin-logs"><p class="text-sm text-gray-400">Loading...</p></div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        `;

        this.loadUsers();
        this.loadLogs();
    },

    async loadUsers() {
        try {
            const res = await api.get('/api/admin/users?per_page=10');
            const users = res.data || [];
            const html = users.length === 0
                ? '<p class="text-sm text-gray-400">No users found</p>'
                : `<div class="space-y-2">${users.map(u => `
                    <div class="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                        <div>
                            <p class="text-sm font-medium text-gray-900">${u.full_name}</p>
                            <p class="text-xs text-gray-500">${u.email} <span class="capitalize">(${u.role})</span></p>
                        </div>
                        <span class="px-2 py-1 text-xs font-medium rounded-full ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">${u.is_active ? 'Active' : 'Suspended'}</span>
                    </div>
                `).join('')}</div>`;
            document.getElementById('admin-users').innerHTML = html;
        } catch (err) {
            document.getElementById('admin-users').innerHTML = `<p class="text-sm text-red-600">${err.message}</p>`;
        }
    },

    async loadLogs() {
        try {
            const res = await api.get('/api/admin/audit-logs?per_page=10');
            const logs = res.data || [];
            const html = logs.length === 0
                ? '<p class="text-sm text-gray-400">No audit logs found</p>'
                : `<div class="space-y-2 max-h-96 overflow-y-auto">${logs.map(log => `
                    <div class="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
                        <span class="text-sm">${this.actionIcon(log.action)}</span>
                        <div class="flex-1 min-w-0">
                            <p class="text-sm text-gray-900">${log.action.replace(/_/g, ' ')}</p>
                            <p class="text-xs text-gray-400">${log.actor_name || 'System'} · ${log.created_at ? new Date(log.created_at).toLocaleString() : ''}</p>
                        </div>
                    </div>
                `).join('')}</div>`;
            document.getElementById('admin-logs').innerHTML = html;
        } catch (err) {
            document.getElementById('admin-logs').innerHTML = `<p class="text-sm text-red-600">${err.message}</p>`;
        }
    },

    async runExpiryCheck() {
        try {
            const res = await api.post('/api/cron/expire');
            alert(`Expiry check complete:\n- ${res.data.licenses_expired} licenses expired\n- ${res.data.warning_notifications_sent} warnings sent`);
        } catch (err) {
            alert('Error: ' + err.message);
        }
    },

    actionIcon(action) {
        const icons = {
            user_login: '🔑', user_logout: '🚪', user_registered: '👤',
            license_generated: '🆕', license_revoked: '⛔', license_renewed: '🔄',
            license_activated: '💻', license_deactivated: '🛑',
            validate_success: '✅', validate_failed: '❌',
            product_created: '📦', product_updated: '📝', product_deleted: '🗑️',
        };
        return icons[action] || '📋';
    }
};

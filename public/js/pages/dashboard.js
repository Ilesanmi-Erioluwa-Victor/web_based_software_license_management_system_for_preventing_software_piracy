const DashboardPage = {
    async render() {
        const app = document.getElementById('app');

        try {
            let stats = null;
            if (Router.user.role === 'admin') {
                const res = await api.get('/api/admin/stats');
                stats = res.data;
            } else {
                const res = await api.get('/api/licenses?per_page=1');
                stats = { licenses: { total_licenses: 0, by_status: [], expiring_in_7_days: 0, active_activations: 0 } };
                const res2 = await api.get('/api/auth/me');
                stats.licenses = {
                    total_licenses: res.meta?.total || 0,
                    by_status: [],
                    expiring_in_7_days: 0,
                    active_activations: 0,
                };
            }

            const { licenses } = stats;
            const statusMap = {};
            if (licenses.by_status) {
                licenses.by_status.forEach(s => { statusMap[s.status] = s.count; });
            }

            const totalLicenses = licenses.total_licenses || 0;
            const activeLicenses = parseInt(statusMap['active']) || 0;
            const expiredLicenses = parseInt(statusMap['expired']) || 0;
            const revokedLicenses = parseInt(statusMap['revoked']) || 0;
            const expiringSoon = licenses.expiring_in_7_days || 0;
            const activeActivations = licenses.active_activations || 0;

            app.innerHTML = `
                <div class="min-h-screen flex">
                    ${Sidebar.render(Router.user)}
                    <div class="flex-1 flex flex-col">
                        ${Navbar.render(Router.user)}
                        <main class="flex-1 p-6 lg:p-8 overflow-y-auto">
                            <div class="max-w-7xl mx-auto">
                                <div class="flex items-center justify-between mb-6">
                                    <div>
                                        <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
                                        <p class="text-sm text-gray-500 mt-1">Overview of your license management system</p>
                                    </div>
                                    <button onclick="Router.navigate('#/licenses')" class="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition">
                                        + New License
                                    </button>
                                </div>

                                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                    ${this.statCard('Total Licenses', totalLicenses, '🔑', 'bg-blue-50 text-blue-700')}
                                    ${this.statCard('Active', activeLicenses, '✅', 'bg-green-50 text-green-700')}
                                    ${this.statCard('Expiring in 7 Days', expiringSoon, '⚠️', 'bg-yellow-50 text-yellow-700')}
                                    ${this.statCard('Active Activations', activeActivations, '💻', 'bg-purple-50 text-purple-700')}
                                </div>

                                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                                    ${this.statusChart(statusMap)}
                                    ${this.recentActivity(stats.recent_activity || [])}
                                </div>

                                ${Router.user.role === 'admin' ? this.userStats(stats.users || []) : ''}
                            </div>
                        </main>
                    </div>
                </div>
            `;
        } catch (err) {
            app.innerHTML = `<div class="p-8 text-center text-red-600">Failed to load dashboard: ${err.message}</div>`;
        }
    },

    statCard(label, value, icon, colorClass) {
        return `
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-gray-500">${label}</p>
                        <p class="text-3xl font-bold text-gray-900 mt-1">${value}</p>
                    </div>
                    <div class="w-12 h-12 rounded-lg flex items-center justify-center text-xl ${colorClass}">${icon}</div>
                </div>
            </div>
        `;
    },

    statusChart(statusMap) {
        const total = Object.values(statusMap).reduce((a, b) => a + parseInt(b), 0) || 1;
        const colors = { active: 'bg-green-500', expired: 'bg-red-500', revoked: 'bg-gray-500', suspended: 'bg-yellow-500' };
        const labels = { active: 'Active', expired: 'Expired', revoked: 'Revoked', suspended: 'Suspended' };
        const order = ['active', 'expired', 'revoked', 'suspended'];

        return `
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h3 class="text-sm font-semibold text-gray-900 mb-4">License Status Distribution</h3>
                <div class="space-y-3">
                    ${order.filter(s => statusMap[s]).map(s => `
                        <div>
                            <div class="flex justify-between text-sm mb-1">
                                <span class="text-gray-600">${labels[s]}</span>
                                <span class="font-medium text-gray-900">${statusMap[s]}</span>
                            </div>
                            <div class="w-full bg-gray-100 rounded-full h-2">
                                <div class="${colors[s]} h-2 rounded-full transition-all" style="width: ${(parseInt(statusMap[s]) / total) * 100}%"></div>
                            </div>
                        </div>
                    `).join('')}
                    ${Object.keys(statusMap).filter(s => !order.includes(s)).map(s => `
                        <div>
                            <div class="flex justify-between text-sm mb-1">
                                <span class="text-gray-600 capitalize">${s}</span>
                                <span class="font-medium text-gray-900">${statusMap[s]}</span>
                            </div>
                            <div class="w-full bg-gray-100 rounded-full h-2">
                                <div class="bg-blue-500 h-2 rounded-full" style="width: ${(parseInt(statusMap[s]) / total) * 100}%"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    recentActivity(logs) {
        return `
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h3 class="text-sm font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div class="space-y-3">
                    ${logs.length === 0 ? '<p class="text-sm text-gray-400">No recent activity</p>' :
                      logs.slice(0, 5).map(log => `
                        <div class="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
                            <span class="text-lg">${this.actionIcon(log.action)}</span>
                            <div class="flex-1 min-w-0">
                                <p class="text-sm text-gray-900">${log.action.replace(/_/g, ' ')}</p>
                                <p class="text-xs text-gray-400">${log.created_at ? new Date(log.created_at).toLocaleString() : ''}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
                ${logs.length > 0 ? '<a href="#/admin" class="text-sm text-indigo-600 hover:text-indigo-800 mt-3 inline-block">View all logs →</a>' : ''}
            </div>
        `;
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
    },

    userStats(users) {
        return `
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h3 class="text-sm font-semibold text-gray-900 mb-4">Users by Role</h3>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    ${users.map(u => `
                        <div class="text-center p-3 rounded-lg bg-gray-50">
                            <p class="text-2xl font-bold text-gray-900">${u.count}</p>
                            <p class="text-sm text-gray-500 capitalize">${u.role}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
};

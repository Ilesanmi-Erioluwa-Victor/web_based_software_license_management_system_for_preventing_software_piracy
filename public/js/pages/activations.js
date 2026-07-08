const ActivationsPage = {
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
                                <h1 class="text-2xl font-bold text-gray-900">Activation Tester</h1>
                                <p class="text-sm text-gray-500 mt-1">Test license activation and deactivation</p>
                            </div>

                            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                    <h2 class="text-lg font-semibold text-gray-900 mb-4">Activate</h2>
                                    <form id="activate-form" class="space-y-4">
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-1">License Key</label>
                                            <input type="text" name="license_key" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono" />
                                        </div>
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-1">Hardware ID</label>
                                            <input type="text" name="hardware_id" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono" />
                                        </div>
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-1">Machine Name</label>
                                            <input type="text" name="machine_name" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                                        </div>
                                        <button id="activate-btn" type="submit" class="w-full py-2.5 px-4 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                                            Activate
                                        </button>
                                        <div id="activate-result"></div>
                                    </form>
                                </div>

                                <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                    <h2 class="text-lg font-semibold text-gray-900 mb-4">Deactivate</h2>
                                    <form id="deactivate-form" class="space-y-4">
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-1">License Key</label>
                                            <input type="text" name="license_key" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono" />
                                        </div>
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-1">Hardware ID</label>
                                            <input type="text" name="hardware_id" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono" />
                                        </div>
                                        <button id="deactivate-btn" type="submit" class="w-full py-2.5 px-4 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                                            Deactivate
                                        </button>
                                        <div id="deactivate-result"></div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        `;

        document.getElementById('activate-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const form = e.target;
            const btn = document.getElementById('activate-btn');
            const resultEl = document.getElementById('activate-result');
            resultEl.innerHTML = '';
            btn.disabled = true;
            btn.innerHTML = '<span class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span> Activating...';
            try {
                const res = await api.post('/api/activations/activate', {
                    license_key: form.license_key.value,
                    hardware_id: form.hardware_id.value,
                    machine_name: form.machine_name.value || null,
                });
                resultEl.innerHTML = `<div class="p-3 bg-green-50 text-green-700 rounded-lg text-sm font-medium">✅ ${res.message}</div>`;
                btn.disabled = false;
                btn.innerHTML = 'Activate';
            } catch (err) {
                resultEl.innerHTML = `<div class="p-3 bg-red-50 text-red-700 rounded-lg text-sm font-medium">❌ ${err.message}</div>`;
                btn.disabled = false;
                btn.innerHTML = 'Activate';
            }
        });

        document.getElementById('deactivate-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const form = e.target;
            const btn = document.getElementById('deactivate-btn');
            const resultEl = document.getElementById('deactivate-result');
            resultEl.innerHTML = '';
            btn.disabled = true;
            btn.innerHTML = '<span class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span> Deactivating...';
            try {
                const res = await api.post('/api/activations/deactivate', {
                    license_key: form.license_key.value,
                    hardware_id: form.hardware_id.value,
                });
                resultEl.innerHTML = `<div class="p-3 bg-green-50 text-green-700 rounded-lg text-sm font-medium">✅ ${res.message}</div>`;
                btn.disabled = false;
                btn.innerHTML = 'Deactivate';
            } catch (err) {
                resultEl.innerHTML = `<div class="p-3 bg-red-50 text-red-700 rounded-lg text-sm font-medium">❌ ${err.message}</div>`;
                btn.disabled = false;
                btn.innerHTML = 'Deactivate';
            }
        });
    }
};

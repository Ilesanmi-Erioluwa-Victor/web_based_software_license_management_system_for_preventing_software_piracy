const ProductsPage = {
    products: [],
    currentPage: 1,

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="min-h-screen flex">
                ${Sidebar.render(Router.user)}
                <div class="flex-1 flex flex-col">
                    ${Navbar.render(Router.user)}
                    <main class="flex-1 p-6 lg:p-8 overflow-y-auto">
                        <div class="max-w-7xl mx-auto">
                            <div class="flex items-center justify-between mb-6">
                                <div>
                                    <h1 class="text-2xl font-bold text-gray-900">Products</h1>
                                    <p class="text-sm text-gray-500 mt-1">Manage your software products</p>
                                </div>
                                <button onclick="ProductsPage.showCreateForm()" class="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition">
                                    + New Product
                                </button>
                            </div>
                            <div id="products-content">
                                <div class="text-center py-12 text-gray-400">Loading...</div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        `;
        await this.loadProducts();
    },

    async loadProducts() {
        try {
            const res = await api.get(`/api/products?page=${this.currentPage}&per_page=20`);
            this.products = res.data;
            this.renderTable(res);
        } catch (err) {
            document.getElementById('products-content').innerHTML = `
                <div class="text-center py-12 text-red-600">Failed to load products: ${err.message}</div>
            `;
        }
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
                                <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Version</th>
                                <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Publisher</th>
                                <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                                <th class="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200">
                            ${items.length === 0 ? '<tr><td colspan="6" class="px-4 py-8 text-center text-gray-400">No products found. Create your first product!</td></tr>' :
                            items.map(p => `
                                <tr class="hover:bg-gray-50 transition">
                                    <td class="px-4 py-3 text-sm font-medium text-gray-900">${p.name}</td>
                                    <td class="px-4 py-3 text-sm text-gray-600">${p.version || '-'}</td>
                                    <td class="px-4 py-3 text-sm text-gray-600">${p.publisher_name || '-'}</td>
                                    <td class="px-4 py-3">
                                        <span class="px-2 py-1 text-xs font-medium rounded-full ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}">${p.is_active ? 'Active' : 'Inactive'}</span>
                                    </td>
                                    <td class="px-4 py-3 text-sm text-gray-500">${p.created_at ? new Date(p.created_at).toLocaleDateString() : '-'}</td>
                                    <td class="px-4 py-3 text-right">
                                        <button onclick="ProductsPage.showEdit('${p.id}')" class="text-indigo-600 hover:text-indigo-800 text-sm font-medium mr-3">Edit</button>
                                        <button onclick="ProductsPage.showTemplates('${p.id}', '${p.name}')" class="text-blue-600 hover:text-blue-800 text-sm font-medium mr-3">Templates</button>
                                        <button onclick="ProductsPage.confirmDelete('${p.id}')" class="text-red-600 hover:text-red-800 text-sm font-medium">Delete</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                ${total > 20 ? `
                <div class="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                    <p class="text-sm text-gray-600">${total} total</p>
                    <div class="flex gap-2">
                        <button onclick="ProductsPage.prevPage()" ${this.currentPage <= 1 ? 'disabled' : ''} class="px-3 py-1 text-sm border rounded-lg ${this.currentPage <= 1 ? 'text-gray-300' : 'text-gray-700 hover:bg-gray-50'}">Prev</button>
                        <button onclick="ProductsPage.nextPage()" ${this.currentPage >= (res.meta?.last_page || 1) ? 'disabled' : ''} class="px-3 py-1 text-sm border rounded-lg ${this.currentPage >= (res.meta?.last_page || 1) ? 'text-gray-300' : 'text-gray-700 hover:bg-gray-50'}">Next</button>
                    </div>
                </div>` : ''}
            </div>
        `;

        document.getElementById('products-content').innerHTML = html;
    },

    showCreateForm() {
        Modal.show('New Product', `
            <form id="product-form" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                    <input type="text" name="name" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="My Software" />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Version</label>
                    <input type="text" name="version" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="1.0.0" />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea name="description" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Describe your software..."></textarea>
                </div>
            </form>
        `, async () => {
            const form = document.getElementById('product-form');
            const data = {
                name: form.name.value,
                version: form.version.value || null,
                description: form.description.value || null,
            };
            try {
                await api.post('/api/products', data);
                Modal.close();
                await this.loadProducts();
            } catch (err) {
                alert(err.message);
            }
        });
    },

    showEdit(id) {
        const product = this.products.find(p => p.id === id);
        if (!product) return;

        Modal.show('Edit Product', `
            <form id="product-form" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                    <input type="text" name="name" value="${product.name}" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Version</label>
                    <input type="text" name="version" value="${product.version || ''}" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea name="description" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">${product.description || ''}</textarea>
                </div>
            </form>
        `, async () => {
            const form = document.getElementById('product-form');
            try {
                await api.put(`/api/products/${id}`, {
                    name: form.name.value,
                    version: form.version.value || null,
                    description: form.description.value || null,
                });
                Modal.close();
                await this.loadProducts();
            } catch (err) {
                alert(err.message);
            }
        });
    },

    showTemplates(productId, productName) {
        this.productId = productId;
        this.productName = productName;
        TemplatesPage.productId = productId;
        TemplatesPage.productName = productName;
        TemplatesPage.render();
    },

    confirmDelete(id) {
        Modal.show('Delete Product', `
            <p class="text-gray-600">Are you sure you want to delete this product? This action cannot be undone.</p>
        `, async () => {
            try {
                await api.del(`/api/products/${id}`);
                await this.loadProducts();
            } catch (err) {
                alert(err.message);
            }
        });
    },

    prevPage() { if (this.currentPage > 1) { this.currentPage--; this.loadProducts(); } },
    nextPage() { this.currentPage++; this.loadProducts(); },
};

const TemplatesPage = {
    productId: null,
    productName: '',

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="min-h-screen flex">
                ${Sidebar.render(Router.user)}
                <div class="flex-1 flex flex-col">
                    ${Navbar.render(Router.user)}
                    <main class="flex-1 p-6 lg:p-8 overflow-y-auto">
                        <div class="max-w-7xl mx-auto">
                            <div class="flex items-center justify-between mb-6">
                                <div>
                                    <h1 class="text-2xl font-bold text-gray-900">Templates: ${this.productName}</h1>
                                    <p class="text-sm text-gray-500 mt-1">License templates for this product</p>
                                </div>
                                <div class="flex gap-3">
                                    <button onclick="Router.navigate('#/products')" class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition">← Back</button>
                                    <button onclick="TemplatesPage.showCreateForm()" class="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition">+ New Template</button>
                                </div>
                            </div>
                            <div id="templates-content">
                                <div class="text-center py-12 text-gray-400">Loading...</div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        `;
        await this.loadTemplates();
    },

    async loadTemplates() {
        try {
            const res = await api.get(`/api/products/${this.productId}/templates`);
            const templates = res.data || [];
            const html = templates.length === 0
                ? '<div class="bg-white rounded-xl shadow-sm border p-8 text-center text-gray-400">No templates yet. Create one!</div>'
                : `
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    ${templates.map(t => `
                        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                            <h3 class="font-semibold text-gray-900">${t.name}</h3>
                            <div class="mt-3 space-y-2 text-sm">
                                <p class="text-gray-600">Type: <span class="font-medium text-gray-900">${t.license_type}</span></p>
                                <p class="text-gray-600">Duration: <span class="font-medium text-gray-900">${t.duration_days ? `${t.duration_days} days` : 'Perpetual'}</span></p>
                                <p class="text-gray-600">Max Activations: <span class="font-medium text-gray-900">${t.max_activations}</span></p>
                                ${t.price ? `<p class="text-gray-600">Price: <span class="font-medium text-gray-900">$${t.price}</span></p>` : ''}
                            </div>
                            <div class="mt-4 flex gap-3">
                                <button onclick="TemplatesPage.showEdit('${t.id}')" class="text-sm text-indigo-600 hover:text-indigo-800">Edit</button>
                                <button onclick="TemplatesPage.confirmDelete('${t.id}')" class="text-sm text-red-600 hover:text-red-800">Delete</button>
                            </div>
                        </div>
                    `).join('')}
                </div>`;
            document.getElementById('templates-content').innerHTML = html;
        } catch (err) {
            document.getElementById('templates-content').innerHTML = `<div class="text-center py-12 text-red-600">${err.message}</div>`;
        }
    },

    showCreateForm() {
        Modal.show('New Template', `
            <form id="template-form" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Template Name *</label>
                    <input type="text" name="name" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Basic License" />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">License Type *</label>
                    <select name="license_type" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                        <option value="trial">Trial</option>
                        <option value="subscription">Subscription</option>
                        <option value="perpetual">Perpetual</option>
                        <option value="rental">Rental</option>
                        <option value="floating">Floating</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Duration (days, leave empty for perpetual)</label>
                    <input type="number" name="duration_days" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="30" />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Max Activations</label>
                    <input type="number" name="max_activations" value="1" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                    <input type="number" step="0.01" name="price" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="29.99" />
                </div>
            </form>
        `, async () => {
            const form = document.getElementById('template-form');
            try {
                await api.post(`/api/products/${this.productId}/templates`, {
                    name: form.name.value,
                    license_type: form.license_type.value,
                    duration_days: form.duration_days.value ? parseInt(form.duration_days.value) : null,
                    max_activations: parseInt(form.max_activations.value) || 1,
                    price: form.price.value ? parseFloat(form.price.value) : null,
                });
                Modal.close();
                await this.loadTemplates();
            } catch (err) {
                alert(err.message);
            }
        });
    },

    showEdit(id) {
        Modal.show('Edit Template', `
            <p class="text-gray-600">Edit functionality would go here. For now, create a new template.</p>
        `);
    },

    confirmDelete(id) {
        Modal.show('Delete Template', `
            <p class="text-gray-600">Are you sure?</p>
        `, async () => {
            try {
                await api.del(`/api/templates/${id}`);
                await this.loadTemplates();
            } catch (err) {
                alert(err.message);
            }
        });
    },
};

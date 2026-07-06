const Sidebar = {
    isOpen: false,

    toggle() {
        this.isOpen = !this.isOpen;
        const el = document.getElementById('sidebar');
        if (el) {
            el.classList.toggle('-translate-x-full', !this.isOpen);
            el.classList.toggle('translate-x-0', this.isOpen);
        }
    },

    close() {
        this.isOpen = false;
        const el = document.getElementById('sidebar');
        if (el) {
            el.classList.add('-translate-x-full');
            el.classList.remove('translate-x-0');
        }
    },

    render(user) {
        const links = [
            { hash: '#/dashboard', label: 'Dashboard', icon: '📊', show: true },
            { hash: '#/products', label: 'Products', icon: '📦', show: true },
            { hash: '#/licenses', label: 'Licenses', icon: '🔑', show: true },
            { hash: '#/customer/licenses', label: 'My Licenses', icon: '👤', show: true },
            { hash: '#/admin', label: 'Admin Panel', icon: '⚙️', show: user.role === 'admin' },
        ];

        return `
            <aside id="sidebar" class="fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform -translate-x-full lg:translate-x-0 lg:static lg:z-auto transition-transform duration-200 ease-in-out">
                <div class="flex items-center justify-between h-16 px-6 border-b border-gray-200 lg:hidden">
                    <span class="text-lg font-bold text-indigo-600">🔑 LM</span>
                    <button onclick="Sidebar.close()" class="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">&times;</button>
                </div>
                <nav class="p-4 space-y-1">
                    ${links.filter(l => l.show).map(link => `
                        <a href="${link.hash}" onclick="Sidebar.close()"
                           class="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors
                                  ${window.location.hash === link.hash || (window.location.hash === '' && link.hash === '#/dashboard')
                                    ? 'bg-indigo-50 text-indigo-700'
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}">
                            <span>${link.icon}</span>
                            ${link.label}
                        </a>
                    `).join('')}
                </nav>
                <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
                    <p class="text-xs text-gray-400 text-center">License Manager v1.0</p>
                </div>
            </aside>
            <div id="sidebar-backdrop" class="fixed inset-0 bg-black/30 z-30 hidden lg:hidden" onclick="Sidebar.close()"></div>
        `;
    }
};

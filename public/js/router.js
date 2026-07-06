const Router = {
    user: null,

    async init() {
        const hash = window.location.hash || '#/login';

        if (hash === '#/login' || hash === '#/register') {
            AuthPage.render();
            return;
        }

        await this.initApp();
    },

    async initApp() {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            window.location.hash = '#/login';
            AuthPage.render();
            return;
        }

        api.setToken(token);

        try {
            const res = await api.get('/api/auth/me');
            this.user = res.data;
            this.handleRoute();
        } catch (err) {
            api.setToken(null);
            window.location.hash = '#/login';
            AuthPage.render();
        }
    },

    handleRoute() {
        const hash = window.location.hash || '#/dashboard';

        switch (hash) {
            case '#/dashboard':
                DashboardPage.render();
                break;
            case '#/products':
                ProductsPage.render();
                break;
            case '#/licenses':
                LicensesPage.render();
                break;
            case '#/activations':
                ActivationsPage.render();
                break;
            case '#/customer/licenses':
                CustomerPortalPage.render();
                break;
            case '#/admin':
                AdminPage.render();
                break;
            case '#/settings':
                SettingsPage.render();
                break;
            default:
                if (hash.startsWith('#/products/')) {
                    ProductsPage.render();
                } else {
                    DashboardPage.render();
                }
        }
    },

    navigate(hash) {
        window.location.hash = hash;
    },

    logout() {
        api.post('/api/auth/logout').catch(() => {});
        api.setToken(null);
        this.user = null;
        window.location.hash = '#/login';
        AuthPage.render();
    },
};

window.addEventListener('hashchange', () => {
    if (Router.user) {
        Router.handleRoute();
    } else {
        Router.init();
    }
});

document.addEventListener('DOMContentLoaded', () => Router.init());

const API_BASE = window.location.origin;

const api = {
    token: localStorage.getItem('auth_token'),

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('auth_token', token);
        } else {
            localStorage.removeItem('auth_token');
        }
    },

    async request(method, path, body = null) {
        const url = `${API_BASE}${path}`;
        const headers = { 'Content-Type': 'application/json' };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const options = { method, headers };
        if (body !== null) {
            options.body = JSON.stringify(body);
        }

        try {
            const res = await fetch(url, options);
            const data = await res.json();

            if (!res.ok) {
                if (res.status === 401) {
                    this.setToken(null);
                    window.location.hash = '#/login';
                }
                throw { status: res.status, ...data };
            }

            return data;
        } catch (err) {
            if (err.status) throw err;
            throw { status: 0, message: 'Network error', errors: null };
        }
    },

    get(path) { return this.request('GET', path); },
    post(path, body) { return this.request('POST', path, body); },
    put(path, body) { return this.request('PUT', path, body); },
    del(path) { return this.request('DELETE', path); },
};

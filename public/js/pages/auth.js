const AuthPage = {
    render() {
        const isRegister = window.location.hash === '#/register';
        document.getElementById('app').innerHTML = `
            <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 px-4">
                <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
                    <div class="text-center mb-8">
                        <span class="text-4xl">🔑</span>
                        <h1 class="text-2xl font-bold text-gray-900 mt-2">License Manager</h1>
                        <p class="text-sm text-gray-500 mt-1">Software License Management System</p>
                    </div>

                    <form id="auth-form" class="space-y-4">
                        <div id="form-error" class="hidden p-3 text-sm text-red-700 bg-red-50 rounded-lg border border-red-200"></div>

                        <div id="name-field" class="${isRegister ? '' : 'hidden'}">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <input type="text" name="full_name" required
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                                   placeholder="John Doe" />
                        </div>

                        <div id="company-field" class="${isRegister ? '' : 'hidden'}">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Company (optional)</label>
                            <input type="text" name="company_name"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                                   placeholder="Acme Inc." />
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input type="email" name="email" required
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                                   placeholder="you@example.com" />
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input type="password" name="password" required
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                                   placeholder="Min. 8 characters" minlength="8" />
                        </div>

                        <button type="submit" class="w-full py-2.5 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 transition">
                            ${isRegister ? 'Create Account' : 'Sign In'}
                        </button>
                    </form>

                    <div class="mt-6 text-center text-sm text-gray-500">
                        ${isRegister
                            ? 'Already have an account? <a href="#/login" class="text-indigo-600 hover:text-indigo-800 font-medium">Sign in</a>'
                            : 'Don\'t have an account? <a href="#/register" class="text-indigo-600 hover:text-indigo-800 font-medium">Register</a>'}
                    </div>
                </div>
            </div>
        `;

        document.getElementById('auth-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const form = e.target;
            const errorEl = document.getElementById('form-error');
            errorEl.classList.add('hidden');

            const data = {
                email: form.email.value,
                password: form.password.value,
                full_name: form.full_name?.value,
                company_name: form.company_name?.value,
            };

            try {
                const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
                const result = await api.post(endpoint, data);

                if (isRegister) {
                    window.location.hash = '#/login';
                } else {
                    api.setToken(result.data.token);
                    Router.initApp();
                }
            } catch (err) {
                errorEl.textContent = err.message || 'An error occurred';
                errorEl.classList.remove('hidden');
            }
        });
    }
};

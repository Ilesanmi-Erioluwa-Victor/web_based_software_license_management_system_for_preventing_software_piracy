const Modal = {
    show(title, contentHtml, onConfirm = null) {
        const existing = document.getElementById('modal-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'modal-overlay';
        overlay.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
        overlay.innerHTML = `
            <div class="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h3 class="text-lg font-semibold text-gray-900">${title}</h3>
                    <button onclick="Modal.close()" class="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
                </div>
                <div class="px-6 py-4">${contentHtml}</div>
                ${onConfirm ? `
                <div class="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
                    <button onclick="Modal.close()" class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                    <button id="modal-confirm-btn" class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2">
                        Confirm
                    </button>
                </div>` : ''}
            </div>
        `;
        document.body.appendChild(overlay);

        if (onConfirm) {
            document.getElementById('modal-confirm-btn').onclick = async () => {
                const btn = document.getElementById('modal-confirm-btn');
                btn.disabled = true;
                btn.innerHTML = '<span class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span> Saving...';
                try {
                    await onConfirm();
                    Modal.close();
                } catch (err) {
                    btn.disabled = false;
                    btn.innerHTML = 'Confirm';
                    alert(err.message);
                }
            };
        }

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) Modal.close();
        });
    },

    close() {
        const el = document.getElementById('modal-overlay');
        if (el) el.remove();
    }
};

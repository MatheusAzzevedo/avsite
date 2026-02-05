/**
 * Dashboard do cliente - busca de excursão por código.
 * Script externalizado para compatibilidade com Content-Security-Policy (CSP).
 */

(function () {
    async function init() {
        const isAuth = await clienteAuth.requireAuth();
        if (!isAuth) return;

        const cliente = clienteAuth.getCliente();
        if (cliente) {
            const el = document.getElementById('clienteNome');
            if (el) el.textContent = cliente.nome.split(' ')[0];
        }

        const logoutBtn = document.querySelector('.btn-logout') || document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function () {
                clienteAuth.logout();
                window.location.href = '/cliente/login.html';
            });
        }

        const searchForm = document.getElementById('searchForm');
        const codigoInput = document.getElementById('codigoInput');
        const searchBtn = document.getElementById('searchBtn');
        const errorMessage = document.getElementById('errorMessage');
        const loadingMessage = document.getElementById('loadingMessage');

        if (!searchForm || !codigoInput) return;

        searchForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const codigo = codigoInput.value.trim().toUpperCase();
            if (!codigo) return;

            if (errorMessage) errorMessage.classList.remove('show');
            if (loadingMessage) loadingMessage.classList.add('show');
            if (searchBtn) searchBtn.disabled = true;

            try {
                const response = await fetch(`/api/cliente/pedidos/excursao/${encodeURIComponent(codigo)}`);
                const data = await response.json();

                if (response.ok && data.success) {
                    window.location.href = `excursao.html?codigo=${encodeURIComponent(codigo)}`;
                } else {
                    if (errorMessage) {
                        errorMessage.textContent = data.error || 'Excursão não encontrada';
                        errorMessage.classList.add('show');
                    }
                }
            } catch (error) {
                console.error('[Busca] Erro:', error);
                if (errorMessage) {
                    errorMessage.textContent = 'Erro ao buscar excursão. Tente novamente.';
                    errorMessage.classList.add('show');
                }
            } finally {
                if (loadingMessage) loadingMessage.classList.remove('show');
                if (searchBtn) searchBtn.disabled = false;
            }
        });
    }

    if (typeof clienteAuth !== 'undefined') {
        init();
    } else {
        document.addEventListener('DOMContentLoaded', function () {
            if (typeof clienteAuth !== 'undefined') init();
        });
    }
})();

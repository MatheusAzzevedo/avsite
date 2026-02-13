/**
 * Página Início do cliente - digitação do código da excursão pedagógica.
 * Garante autenticação, exibe nome do cliente, formulário de busca e logout.
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

        document.querySelectorAll('.btn-logout').forEach(function (btn) {
            btn.addEventListener('click', function () {
                clienteAuth.logout();
                window.location.href = '/cliente/login.html';
            });
        });

        const searchForm = document.getElementById('searchForm');
        const codigoInput = document.getElementById('codigoInput');
        const searchBtn = document.getElementById('searchBtn');
        const errorMessage = document.getElementById('errorMessage');
        const loadingMessage = document.getElementById('loadingMessage');

        if (searchForm && codigoInput) {
            searchForm.addEventListener('submit', async function (e) {
                e.preventDefault();

                const codigo = codigoInput.value.trim().toUpperCase();
                if (!codigo) return;
                if (!/^[A-Za-z0-9_\-]+$/.test(codigo)) {
                    if (errorMessage) {
                        errorMessage.textContent = 'Código deve conter apenas letras, números, hífen e underscore.';
                        errorMessage.classList.add('show');
                    }
                    return;
                }

                if (errorMessage) errorMessage.classList.remove('show');
                if (loadingMessage) loadingMessage.classList.add('show');
                if (searchBtn) searchBtn.disabled = true;

                try {
                    const token = clienteAuth.getToken();
                    const headers = { 'Content-Type': 'application/json' };
                    if (token) headers['Authorization'] = 'Bearer ' + token;

                    const response = await fetch('/api/cliente/pedidos/excursao/' + encodeURIComponent(codigo), { headers });
                    const data = await response.json();

                    if (response.ok && data.success) {
                        window.location.href = 'excursao.html?codigo=' + encodeURIComponent(codigo);
                    } else {
                        if (errorMessage) {
                            errorMessage.textContent = data.error || 'Excursão não encontrada';
                            errorMessage.classList.add('show');
                        }
                    }
                } catch (err) {
                    console.error('[Busca] Erro:', err);
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
    }

    if (typeof clienteAuth !== 'undefined') {
        init();
    } else {
        document.addEventListener('DOMContentLoaded', function () {
            if (typeof clienteAuth !== 'undefined') init();
        });
    }
})();

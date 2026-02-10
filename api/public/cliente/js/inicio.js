/**
 * Página Início do cliente - escolha entre Turismo Pedagógico e Pacotes de Viagens.
 * Garante autenticação, exibe nome do cliente e trata logout.
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

        // Evita que o clique no "!" dispare o link do card
        ['infoTurismo', 'infoPacotes'].forEach(function (id) {
            const infoEl = document.getElementById(id);
            if (infoEl) {
                infoEl.addEventListener('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                });
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

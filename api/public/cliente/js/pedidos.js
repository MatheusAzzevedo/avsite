/**
 * Página Meus Pedidos - carrega e exibe lista de pedidos do cliente.
 * Script externo para compatibilidade com Content-Security-Policy (CSP).
 */
(function() {
    async function init() {
        var loadingEl = document.getElementById('loading');
        var containerEl = document.getElementById('pedidosContainer');

        function hideLoading() {
            if (loadingEl) loadingEl.style.display = 'none';
        }
        function renderEmpty() {
            if (containerEl) containerEl.innerHTML = '<div class="empty-state"><i class="fas fa-shopping-bag"></i><p>Nenhum pedido encontrado</p></div>';
        }
        function renderError(msg) {
            if (containerEl) containerEl.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>' + (msg || 'Erro ao carregar pedidos') + '</p></div>';
        }

        if (!window.clienteAuth) {
            hideLoading();
            renderError('Sessão indisponível. Recarregue a página.');
            return;
        }
        if (!(await window.clienteAuth.requireAuth())) {
            hideLoading();
            if (containerEl) containerEl.innerHTML = '<div class="empty-state"><i class="fas fa-sign-in-alt"></i><p>Redirecionando para login...</p></div>';
            return;
        }
        if (!containerEl) {
            hideLoading();
            return;
        }

        try {
            var response = await window.clienteAuth.fetchAuth('/cliente/pedidos');
            var data;
            try {
                data = await response.json();
            } catch (e) {
                hideLoading();
                renderError('Resposta inválida do servidor.');
                return;
            }

            hideLoading();

            console.log('[Pedidos] Resposta API:', { ok: response.ok, success: data && data.success, total: Array.isArray(data && data.data) ? data.data.length : 0 });

            if (!response.ok) {
                throw new Error((data && (data.error || data.message)) || 'Erro ao carregar pedidos');
            }

            var raw = data != null && data.data !== undefined ? data.data : (Array.isArray(data) ? data : null);
            var pedidos = Array.isArray(raw) ? raw : [];
            containerEl.innerHTML = '';

            if (pedidos.length > 0) {
                var statusLabels = {
                    'PENDENTE': 'Pendente',
                    'AGUARDANDO_PAGAMENTO': 'Aguardando Pagamento',
                    'PAGO': 'Pago',
                    'CONFIRMADO': 'Confirmado',
                    'EXPIRADO': 'Expirado',
                    'CANCELADO': 'Cancelado'
                };
                pedidos.forEach(function(pedido) {
                    var titulo = (pedido.excursaoPedagogica && pedido.excursaoPedagogica.titulo)
                        ? pedido.excursaoPedagogica.titulo
                        : (pedido.excursao && pedido.excursao.titulo)
                            ? pedido.excursao.titulo
                            : 'Viagem';
                    var tipoLabel = pedido.tipo === 'CONVENCIONAL' ? 'Viagem convencional' : 'Excursão pedagógica';
                    var statusLabel = statusLabels[pedido.status] || pedido.status;
                    var showPayButton = pedido.status === 'PENDENTE' || pedido.status === 'AGUARDANDO_PAGAMENTO';
                    var payButtonHtml = showPayButton
                        ? '<a href="/cliente/pagamento.html?pedidoId=' + pedido.id + '" class="btn-pagar"><i class="fas fa-credit-card"></i> Pagar</a>'
                        : '';
                    var valorTotal = Number(pedido.valorTotal);
                    var valorStr = isNaN(valorTotal) ? '0,00' : valorTotal.toFixed(2);
                    var dataStr = pedido.createdAt ? new Date(pedido.createdAt).toLocaleDateString('pt-BR') : '-';

                    containerEl.innerHTML +=
                        '<div class="pedido-card">' +
                        '<div class="pedido-header">' +
                        '<div class="pedido-titulo">' + titulo + '</div>' +
                        '<div class="pedido-status status-' + pedido.status + '">' + statusLabel + '</div>' +
                        '</div>' +
                        '<div class="pedido-info">' +
                        '<span class="pedido-tipo">' + tipoLabel + '</span>' +
                        '<div><i class="fas fa-calendar-alt"></i> ' + dataStr + '</div>' +
                        '<div><i class="fas fa-users"></i> ' + (pedido.quantidade || 0) + ' pessoa(s)</div>' +
                        '</div>' +
                        '<div class="pedido-footer">' +
                        '<div class="pedido-valor">R$ <span>' + valorStr + '</span></div>' +
                        payButtonHtml +
                        '</div>' +
                        '</div>';
                });
            } else {
                renderEmpty();
            }
        } catch (error) {
            console.error('[Pedidos] Erro:', error);
            hideLoading();
            renderError(error && error.message ? error.message : 'Erro ao carregar pedidos');
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

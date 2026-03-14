/**
 * Página Meus Pedidos - carrega e exibe lista de pedidos do cliente.
 * Menu mobile (hamburger/sidebar) e logout externalizados para compatibilidade com CSP.
 */
(function() {
    /**
     * Explicação da função [showToastPedidos]:
     * Exibe uma mensagem estilo toast no topo da tela de Meus Pedidos.
     * type: 'success' | 'error' | 'info'.
     */
    function showToastPedidos(message, type) {
        type = type || 'info';
        var el = document.getElementById('checkoutToast');
        if (!el) {
            el = document.createElement('div');
            el.id = 'checkoutToast';
            document.body.appendChild(el);
        }
        // Estilos básicos inline para não depender de CSS externo
        if (!el.dataset.styled) {
            el.style.position = 'fixed';
            el.style.top = '1rem';
            el.style.left = '50%';
            el.style.transform = 'translateX(-50%)';
            el.style.zIndex = '9999';
            el.style.padding = '0.75rem 1.25rem';
            el.style.borderRadius = '10px';
            el.style.boxShadow = '0 4px 14px rgba(0,0,0,0.15)';
            el.style.maxWidth = '90%';
            el.style.display = 'none';
            el.style.alignItems = 'center';
            el.style.gap = '0.75rem';
            el.style.fontWeight = '500';
            el.style.fontSize = '0.9rem';
            el.style.background = '#e0f2fe';
            el.style.color = '#0369a1';
            el.style.border = '1px solid #7dd3fc';
            el.dataset.styled = '1';
        }

        if (type === 'error') {
            el.style.background = '#fee2e2';
            el.style.color = '#991b1b';
            el.style.border = '1px solid #fca5a5';
        } else if (type === 'success') {
            el.style.background = '#dcfce7';
            el.style.color = '#166534';
            el.style.border = '1px solid #86efac';
        } else {
            el.style.background = '#e0f2fe';
            el.style.color = '#0369a1';
            el.style.border = '1px solid #7dd3fc';
        }

        el.textContent = message;
        el.setAttribute('role', 'alert');
        el.style.display = 'flex';

        setTimeout(function() {
            el.style.display = 'none';
        }, 5000);
    }

    function bindDownloadButtons() {
        var buttons = document.querySelectorAll('.btn-download-doc');
        if (!buttons || !buttons.length) return;

        buttons.forEach(function(btn) {
            if (btn.dataset.bound === '1') return;
            btn.dataset.bound = '1';

            btn.addEventListener('click', function(e) {
                e.preventDefault();
                var href = btn.getAttribute('href');
                if (!href || href === '#') {
                    showToastPedidos('Arquivo não está mais disponível.', 'error');
                    return;
                }

                fetch(href)
                    .then(function(res) {
                        var ct = (res.headers.get('content-type') || '').toLowerCase();

                        if (!res.ok || ct.indexOf('application/json') === 0) {
                            // Provavelmente resposta de erro da API
                            return res
                                .clone()
                                .json()
                                .then(function() {
                                    showToastPedidos('Arquivo não está mais disponível.', 'error');
                                })
                                .catch(function() {
                                    showToastPedidos('Arquivo não está mais disponível.', 'error');
                                });
                        }

                        // Sucesso: abre o PDF/arquivo em nova aba (download normal)
                        window.open(href, '_blank');
                        return null;
                    })
                    .catch(function() {
                        showToastPedidos('Arquivo não está mais disponível.', 'error');
                    });
            });
        });
    }
    function initMobileMenu() {
        var sidebar = document.getElementById('sidebar');
        var overlay = document.getElementById('sidebarOverlay');
        var hamburgerBtn = document.getElementById('hamburgerBtn');
        var closeBtn = document.getElementById('closeSidebarBtn');

        function openSidebar(e) {
            if (e && e.type === 'touchend') e.preventDefault();
            if (sidebar && overlay) {
                sidebar.classList.add('open');
                overlay.classList.add('open');
                overlay.style.display = 'block';
                document.body.style.overflow = 'hidden';
            }
        }

        function closeSidebar(e) {
            if (e && e.type === 'touchend') e.preventDefault();
            if (sidebar && overlay) {
                sidebar.classList.remove('open');
                overlay.classList.remove('open');
                overlay.style.display = '';
                document.body.style.overflow = '';
            }
        }

        if (hamburgerBtn) {
            hamburgerBtn.addEventListener('click', openSidebar);
            hamburgerBtn.addEventListener('touchend', function(e) { e.preventDefault(); openSidebar(e); }, { passive: false });
        }
        if (closeBtn) {
            closeBtn.addEventListener('click', closeSidebar);
            closeBtn.addEventListener('touchend', closeSidebar, { passive: false });
        }
        if (overlay) {
            overlay.addEventListener('click', closeSidebar);
            overlay.addEventListener('touchend', closeSidebar, { passive: false });
        }
        document.querySelectorAll('.sidebar-link').forEach(function(link) {
            link.addEventListener('click', closeSidebar);
        });
    }

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
                    var excPed = pedido.excursaoPedagogica;
                    var docUrl = excPed && excPed.documentoUrl ? excPed.documentoUrl : null;
                    var docNome = (excPed && excPed.documentoNome) || (docUrl ? docUrl.split('/').pop() : '') || 'Documento';
                    var docFilename = docUrl ? docUrl.split('/').pop() : null;
                    var docHref = docFilename ? '/api/documentos/download/' + encodeURIComponent(docFilename) : '#';
                    var payButtonHtml = showPayButton
                        ? '<a href="/cliente/pagamento.html?pedidoId=' + pedido.id + '" class="btn-pagar"><i class="fas fa-credit-card"></i> Pagar</a>'
                        : '';
                    var docButtonHtml = docUrl
                        ? '<a href="' + docHref + '" target="_blank" rel="noopener" class="btn-download-doc"><i class="fas fa-download"></i> ' + docNome + '</a>'
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
                        '<div style="display: flex; gap: 0.75rem; align-items: center;">' + docButtonHtml + payButtonHtml + '</div>' +
                        '</div>' +
                        '</div>';
                });

                // Vincula handlers de download após renderizar todos os cards
                bindDownloadButtons();
            } else {
                renderEmpty();
            }
        } catch (error) {
            console.error('[Pedidos] Erro:', error);
            hideLoading();
            renderError(error && error.message ? error.message : 'Erro ao carregar pedidos');
        }
    }

    function bindLogout() {
        document.querySelectorAll('.btn-logout').forEach(function(btn) {
            btn.addEventListener('click', function() {
                if (window.clienteAuth) window.clienteAuth.logout();
                window.location.href = '/cliente/login.html';
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            initMobileMenu();
            bindLogout();
            init();
        });
    } else {
        initMobileMenu();
        bindLogout();
        init();
    }
})();

/**
 * Explicação do Arquivo [pacotes-viagens.js]
 *
 * Página Pacotes de Viagens do cliente: carrega excursões ativas da API,
 * renderiza grid com filtros por categoria. Adaptado de portfolio-excursoes.js
 * para o contexto do painel do cliente (autenticado). Links levam para
 * ../portfolio-single.html (página de detalhe do site).
 */

(function () {
    let allExcursoes = [];
    const DETAIL_BASE = '../portfolio-single.html';

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function escapeAttr(t) {
        if (t == null) return '';
        return String(t)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    async function loadCategoriasFilter() {
        const filterTabs = document.getElementById('filterTabs');
        if (!filterTabs) return;
        try {
            const res = await apiRequest('/public/categorias');
            const list = Array.isArray(res?.data) ? res.data : [];
            let html = '<li class="active filter" data-role="button" data-filter="all">Todas</li>';
            list.forEach(function (c) {
                html += '<li class="filter" data-role="button" data-filter="' + escapeAttr(c.slug) + '">' + escapeHtml(c.nome) + '</li>';
            });
            filterTabs.innerHTML = html;
        } catch (e) {
            console.warn('[Pacotes] Erro ao carregar categorias:', e);
            filterTabs.innerHTML = '<li class="active filter" data-role="button" data-filter="all">Todas</li>';
        }
    }

    function renderExcursoes(excursoes) {
        const grid = document.getElementById('excursoesGrid');
        const loadingState = document.getElementById('loadingState');
        const emptyState = document.getElementById('emptyState');

        if (loadingState) loadingState.remove();

        if (excursoes.length === 0) {
            grid.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';

        grid.innerHTML = excursoes.map(function (excursao) {
            let image = excursao.imagemCapa || 'images/background/Queda de agua.webp';
            if (image.startsWith('images/')) image = '../' + image;
            const categoria = excursao.categoria || 'natureza';
            const preco = ExcursaoManager.formatPrice(excursao.preco);
            const slug = encodeURIComponent(excursao.slug || '');
            const detailUrl = DETAIL_BASE + '?slug=' + slug;
            return (
                '<div class="portfolio-block mix all ' + categoria + '" data-categoria="' + categoria + '">' +
                '<a href="' + detailUrl + '" class="inner-box excursao-card-link" style="text-decoration: none; color: inherit;">' +
                '<div class="image excursao-image-4-5">' +
                '<img src="' + image + '" alt="' + escapeHtml(excursao.titulo) + '" onerror="this.src=\'../images/Imagens%20para%20o%20site/IMG-20251022-WA0002.jpg\'">' +
                '</div>' +
                '<div class="overlay">' +
                '<div class="cat"><span>Viagens</span></div>' +
                '<h5><span>' + escapeHtml(excursao.titulo) + '</span></h5>' +
                '<div class="price">' + preco + '</div>' +
                '</div></a></div>'
            );
        }).join('');

        filterExcursoes('all');
    }

    function filterExcursoes(categoria) {
        document.querySelectorAll('#filterTabs .filter').forEach(function (tab) {
            tab.classList.remove('active');
            if (tab.dataset.filter === categoria) {
                tab.classList.add('active');
            }
        });

        const items = document.querySelectorAll('.portfolio-block');
        items.forEach(function (item) {
            const itemCategoria = item.dataset.categoria;
            if (categoria === 'all' || itemCategoria === categoria) {
                item.style.display = 'block';
                item.style.opacity = '1';
            } else {
                item.style.opacity = '0';
                setTimeout(function () {
                    item.style.display = 'none';
                }, 300);
            }
        });

        const visibleItems = Array.from(items).filter(function (item) {
            const itemCategoria = item.dataset.categoria;
            return categoria === 'all' || itemCategoria === categoria;
        });

        const emptyState = document.getElementById('emptyState');
        if (visibleItems.length === 0) {
            emptyState.style.display = 'block';
        } else {
            emptyState.style.display = 'none';
        }
    }

    async function loadExcursoes() {
        const grid = document.getElementById('excursoesGrid');
        const loadingState = document.getElementById('loadingState');
        const emptyState = document.getElementById('emptyState');

        function removeLoadingAndShowEmpty(message, isError) {
            if (loadingState && loadingState.parentNode) loadingState.remove();
            if (grid) grid.innerHTML = '';
            if (emptyState) {
                emptyState.innerHTML = isError
                    ? '<i class="fas fa-exclamation-circle" style="font-size: 4rem; color: #ff5c00; margin-bottom: 1rem;"></i><h3>Erro ao carregar pacotes</h3><p>' + escapeHtml(message) + '</p>'
                    : '<h3>Em breve novas excursões</h3>';
                emptyState.style.display = 'block';
            }
        }

        if (typeof ExcursaoManager === 'undefined' || typeof apiRequest === 'undefined') {
            setTimeout(loadExcursoes, 100);
            return;
        }

        try {
            await loadCategoriasFilter();

            allExcursoes = await ExcursaoManager.getAll(true);
            if (!Array.isArray(allExcursoes)) {
                allExcursoes = [];
            }
            renderExcursoes(allExcursoes);
        } catch (error) {
            console.error('[Pacotes] Erro ao carregar excursões:', error);
            removeLoadingAndShowEmpty(error.message || 'Não foi possível carregar os pacotes.', true);
        }
    }

    async function init() {
        const isAuth = await clienteAuth.requireAuth();
        if (!isAuth) return;

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function () {
                clienteAuth.logout();
                window.location.href = '/cliente/login.html';
            });
        }

        const filterTabs = document.getElementById('filterTabs');
        if (filterTabs) {
            filterTabs.addEventListener('click', function (e) {
                const tab = e.target.closest('.filter');
                if (tab && tab.dataset.filter) {
                    filterExcursoes(tab.dataset.filter);
                }
            });
        }

        setTimeout(loadExcursoes, 200);
    }

    if (typeof clienteAuth !== 'undefined') {
        init();
    } else {
        document.addEventListener('DOMContentLoaded', function () {
            if (typeof clienteAuth !== 'undefined') init();
        });
    }
})();

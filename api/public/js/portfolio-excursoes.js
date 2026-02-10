/**
 * Explicação do Arquivo [portfolio-excursoes.js]
 *
 * Lógica da página de excursões (portfolio): carrega excursões ativas da API,
 * renderiza no grid, filtros por categoria. Externalizado para compatibilidade
 * com Content-Security-Policy (CSP) - script-src 'self' não permite inline.
 */

// Variáveis globais
let allExcursoes = [];
let currentFilter = 'all';

/**
 * Carrega categorias da API (nomes controlados pelo admin) e preenche os botões de filtro.
 */
async function loadCategoriasFilter() {
    const filterTabs = document.getElementById('filterTabs');
    if (!filterTabs) return;
    try {
        const res = await apiRequest('/public/categorias');
        const list = Array.isArray(res?.data) ? res.data : [];
        var html = '<li class="active filter" data-role="button" data-filter="all">Todas</li>';
        list.forEach(function (c) {
            html += '<li class="filter" data-role="button" data-filter="' + escapeAttr(c.slug) + '">' + escapeHtml(c.nome) + '</li>';
        });
        filterTabs.innerHTML = html;
    } catch (e) {
        console.warn('[Portfolio] Erro ao carregar categorias (usando só Todas):', e);
        filterTabs.innerHTML = '<li class="active filter" data-role="button" data-filter="all">Todas</li>';
    }
}
function escapeAttr(t) {
    if (t == null) return '';
    return String(t).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Explicação da função [loadExcursoes]
 * Carrega categorias (filtros), depois excursões ativas da API e renderiza na página.
 */
async function loadExcursoes() {
    console.log('[Portfolio] Carregando categorias e excursões da API...');

    if (typeof ExcursaoManager === 'undefined' || typeof apiRequest === 'undefined') {
        setTimeout(loadExcursoes, 100);
        return;
    }

    const grid = document.getElementById('excursoesGrid');
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');

    function removeLoadingAndShowEmpty(message, isError) {
        if (loadingState && loadingState.parentNode) loadingState.remove();
        if (grid) grid.innerHTML = '';
        if (emptyState) {
            emptyState.innerHTML = isError
                ? '<i class="fas fa-exclamation-circle" style="font-size: 4rem; color: #ff5c00; margin-bottom: 1rem;"></i><h3>Erro ao carregar excursões</h3><p>' + escapeHtml(message) + '</p>'
                : '<h3 style="color: #fff; font-size: 1.5rem;">Em breve novas excursões</h3>';
            emptyState.style.display = 'block';
        }
    }

    try {
        await loadCategoriasFilter();

        allExcursoes = await ExcursaoManager.getAll(true);
        if (!Array.isArray(allExcursoes)) {
            allExcursoes = [];
        }
        renderExcursoes(allExcursoes);
    } catch (error) {
        console.error('[Portfolio] Erro ao carregar excursões:', error);
        removeLoadingAndShowEmpty(error.message || 'Não foi possível carregar as excursões.', true);
    }
}

/**
 * Explicação da função [renderExcursoes]
 * Renderiza a lista de excursões na página.
 */
function renderExcursoes(excursoes) {
    const grid = document.getElementById('excursoesGrid');
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');

    if (loadingState) {
        loadingState.remove();
    }

    if (excursoes.length === 0) {
        grid.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    var detailBase = 'portfolio-single.html';
    grid.innerHTML = excursoes.map(function(excursao) {
        var image = excursao.imagemCapa || 'images/background/Queda de agua.webp';
        var categoria = excursao.categoria || 'natureza';
        var preco = ExcursaoManager.formatPrice(excursao.preco);
        var slug = encodeURIComponent(excursao.slug || '');
        var detailUrl = detailBase + '?slug=' + slug;
        return (
            '<div class="portfolio-block mix all ' + categoria + ' col-xl-4 col-lg-4 col-md-6 col-sm-12" data-categoria="' + categoria + '">' +
            '<a href="' + detailUrl + '" class="inner-box excursao-card-link" style="text-decoration: none; color: inherit;">' +
            '<div class="image excursao-image-4-5">' +
            '<img src="' + image + '" alt="' + escapeHtml(excursao.titulo) + '" onerror="this.src=\'images/Imagens%20para%20o%20site/IMG-20251022-WA0002.jpg\'">' +
            '</div>' +
            '<div class="overlay">' +
            '<div class="more-link"><span class="theme-btn"><i class="fa-solid fa-bars-staggered"></i></span></div>' +
            '<div class="inner">' +
            '<div class="cat"><span>Viagens</span></div>' +
            '<h5><span>' + escapeHtml(excursao.titulo) + '</span></h5>' +
            '<div class="price" style="color: #ff5c00; font-weight: bold; margin-top: 0.5rem;">' + preco + '</div>' +
            '</div></div></a></div>'
        );
    }).join('');

    // Garante que os cards fiquem visíveis no carregamento (filtro "Todas" ativo)
    filterExcursoes('all');
}

/**
 * Explicação da função [filterExcursoes]
 * Filtra as excursões por categoria. Exposta globalmente para onclick nos filtros.
 */
function filterExcursoes(categoria) {
    currentFilter = categoria;

    document.querySelectorAll('#filterTabs .filter').forEach(function(tab) {
        tab.classList.remove('active');
        if (tab.dataset.filter === categoria) {
            tab.classList.add('active');
        }
    });

    var items = document.querySelectorAll('.portfolio-block');
    items.forEach(function(item) {
        var itemCategoria = item.dataset.categoria;
        if (categoria === 'all' || itemCategoria === categoria) {
            item.style.display = 'block';
            item.style.opacity = '1';
        } else {
            item.style.opacity = '0';
            setTimeout(function() {
                item.style.display = 'none';
            }, 300);
        }
    });

    var visibleItems = Array.from(items).filter(function(item) {
        var itemCategoria = item.dataset.categoria;
        return categoria === 'all' || itemCategoria === categoria;
    });

    var emptyState = document.getElementById('emptyState');
    if (visibleItems.length === 0) {
        emptyState.style.display = 'block';
    } else {
        emptyState.style.display = 'none';
    }
}

function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function escapeHtml(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(loadExcursoes, 200);

    // Filtros por categoria (sem inline onclick, compatível com CSP)
    var filterTabs = document.getElementById('filterTabs');
    if (filterTabs) {
        filterTabs.addEventListener('click', function(e) {
            var tab = e.target.closest('.filter');
            if (tab && tab.dataset.filter) {
                filterExcursoes(tab.dataset.filter);
            }
        });
    }
});

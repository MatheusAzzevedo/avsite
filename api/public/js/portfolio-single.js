/**
 * Explicação do Arquivo [portfolio-single.js]
 *
 * Lógica da página de detalhe da excursão (portfolio-single): carrega excursão
 * por slug da API, renderiza título, galeria, descrição, preço, tabs. Externalizado
 * para compatibilidade com Content-Security-Policy (CSP).
 */

var currentExcursao = null;

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

function formatListContent(content) {
    if (!content) return '<p>-</p>';
    var lines = content.split('\n').filter(function(line) { return line.trim(); });
    if (lines.length === 0) return '<p>-</p>';
    var listItems = lines.map(function(line) {
        var cleanLine = line.replace(/^[-•*]\s*/, '');
        return '<li><i class="fas fa-check-circle" style="color: #ff5c00; margin-right: 10px;"></i>' + escapeHtml(cleanLine) + '</li>';
    }).join('');
    return '<ul style="list-style: none; padding: 0;">' + listItems + '</ul>';
}

function changeImage(thumb) {
    document.getElementById('mainImage').src = thumb.src;
    var thumbs = document.querySelectorAll('.thumb');
    for (var i = 0; i < thumbs.length; i++) thumbs[i].classList.remove('active');
    thumb.classList.add('active');
}

function switchProductTab(tabName, btn) {
    document.querySelectorAll('.tab-panel').forEach(function(panel) { panel.classList.remove('active'); });
    document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
    var panel = document.getElementById('tab-' + tabName);
    if (panel) panel.classList.add('active');
    if (btn) btn.classList.add('active');
}

function increaseQty() {
    var qty = document.getElementById('quantity');
    var val = parseInt(qty.value, 10);
    if (val < 20) qty.value = val + 1;
}

function decreaseQty() {
    var qty = document.getElementById('quantity');
    var val = parseInt(qty.value, 10);
    if (val > 1) qty.value = val - 1;
}

function contactWhatsApp() {
    if (!currentExcursao) return;
    var qty = document.getElementById('quantity').value;
    var msg = encodeURIComponent('Olá! Tenho interesse na excursão "' + currentExcursao.titulo + '" para ' + qty + ' pessoa(s). Gostaria de mais informações.');
    window.open('https://wa.me/553125147884?text=' + msg, '_blank');
}

function buyNow() {
    var slug = getSlugFromURL();
    var qtyInput = document.getElementById('quantity');
    var quantidade = qtyInput ? qtyInput.value : '1';
    
    // Redireciona para checkout convencional com parâmetros
    window.location.href = '/cliente/checkout-convencional.html?viagem=' + slug + '&quantidade=' + quantidade;
}

function renderExcursao(excursao) {
    var el = document.getElementById('pageTitle');
    if (el) el.textContent = excursao.titulo + ' - Avorar Turismo';

    var breadcrumb = document.getElementById('breadcrumbTitle');
    if (breadcrumb) breadcrumb.textContent = excursao.titulo;
    var tituloEl = document.getElementById('excursaoTitulo');
    if (tituloEl) tituloEl.textContent = excursao.titulo;
    var subtitulo = document.getElementById('excursaoSubtitulo');
    if (subtitulo) subtitulo.textContent = excursao.subtitulo || '';
    var duracao = document.getElementById('excursaoDuracao');
    if (duracao) duracao.textContent = excursao.duracao || 'Consulte';
    var cat = document.getElementById('excursaoCategoria');
    if (cat) cat.textContent = capitalizeFirst(excursao.categoria);
    var local = document.getElementById('excursaoLocal');
    if (local) local.textContent = excursao.local || 'Angra dos Reis';

    var mainImage = document.getElementById('mainImage');
    if (mainImage) {
        if (excursao.imagemPrincipal) {
            mainImage.src = excursao.imagemPrincipal;
        } else if (excursao.imagemCapa) {
            mainImage.src = excursao.imagemCapa;
        }
        mainImage.alt = excursao.titulo;
    }

    var galleryThumbs = document.getElementById('galleryThumbs');
    var images = [];
    if (excursao.imagemCapa) images.push(excursao.imagemCapa);
    if (excursao.imagemPrincipal && excursao.imagemPrincipal !== excursao.imagemCapa) images.push(excursao.imagemPrincipal);
    if (excursao.galeria && excursao.galeria.length > 0) {
        excursao.galeria.forEach(function(item) {
            images.push(typeof item === 'string' ? item : (item && item.url ? item.url : null));
        });
        images = images.filter(Boolean);
    }

    if (galleryThumbs) {
        if (images.length > 0) {
            galleryThumbs.style.display = '';
            galleryThumbs.innerHTML = images.slice(0, 4).map(function(img, index) {
                var activeClass = index === 0 ? 'thumb active' : 'thumb';
                return '<img src="' + img + '" alt="Imagem ' + (index + 1) + '" class="' + activeClass + '" data-thumb="1">';
            }).join('');
        } else {
            galleryThumbs.style.display = 'none';
        }
    }

    var descEl = document.getElementById('excursaoDescricao');
    if (descEl) {
        var desc = (excursao.descricao || '').toString().trim();
        descEl.innerHTML = desc ? desc : '<p>Descrição em breve.</p>';
        descEl.style.color = '#4b5563';
    }

    var inclusosEl = document.getElementById('excursaoInclusos');
    if (inclusosEl) inclusosEl.innerHTML = formatListContent(excursao.inclusos || '');
    var recEl = document.getElementById('excursaoRecomendacoes');
    if (recEl) recEl.innerHTML = formatListContent(excursao.recomendacoes || '');

    var infoLocal = document.getElementById('infoLocal');
    if (infoLocal) infoLocal.textContent = excursao.local || 'Centro de Angra dos Reis';
    var infoHorario = document.getElementById('infoHorario');
    if (infoHorario) infoHorario.textContent = excursao.horario || 'Consulte';
    var infoDuracao = document.getElementById('infoDuracao');
    if (infoDuracao) infoDuracao.textContent = excursao.duracao || 'Consulte';
    var infoCat = document.getElementById('infoCategoria');
    if (infoCat) infoCat.textContent = capitalizeFirst(excursao.categoria);

    var tagsContainer = document.getElementById('excursaoTags');
    if (tagsContainer) {
        if (excursao.tags && excursao.tags.length > 0) {
            tagsContainer.innerHTML = excursao.tags.map(function(tag) {
                return '<span class="tag">' + escapeHtml(tag) + '</span>';
            }).join('');
        } else {
            tagsContainer.innerHTML = '<span class="tag">' + capitalizeFirst(excursao.categoria) + '</span>';
        }
    }

    var precoEl = document.getElementById('excursaoPreco');
    if (precoEl) precoEl.textContent = ExcursaoManager.formatPrice(excursao.preco);
    var precoPix = document.getElementById('precoPix');
    if (precoPix) {
        var precoComDesconto = (excursao.preco * 0.97).toFixed(2);
        precoPix.textContent = '✓ Desconto de 3% no PIX: ' + ExcursaoManager.formatPrice(parseFloat(precoComDesconto));
    }
}

async function loadExcursao() {
    console.log('[Portfolio Single] Carregando excursão...');

    if (typeof ExcursaoManager === 'undefined') {
        setTimeout(loadExcursao, 100);
        return;
    }

    var urlParams = new URLSearchParams(window.location.search);
    var slug = urlParams.get('slug');

    var loadingState = document.getElementById('loadingState');
    var errorState = document.getElementById('errorState');
    var excursaoContent = document.getElementById('excursaoContent');

    if (!slug) {
        if (loadingState) loadingState.style.display = 'none';
        if (errorState) errorState.style.display = 'block';
        return;
    }

    try {
        var excursao = await ExcursaoManager.getBySlug(slug);
        var statusOk = excursao && (excursao.status || '').toUpperCase() === 'ATIVO';

        if (!excursao || !statusOk) {
            if (loadingState) loadingState.style.display = 'none';
            if (errorState) errorState.style.display = 'block';
            return;
        }

        currentExcursao = excursao;
        renderExcursao(excursao);

        if (loadingState) loadingState.style.display = 'none';
        if (excursaoContent) excursaoContent.style.display = 'block';
    } catch (err) {
        console.error('[Portfolio Single] Erro ao carregar excursão:', err);
        if (loadingState) loadingState.style.display = 'none';
        if (errorState) errorState.style.display = 'block';
    }
}

function bindEvents() {
    var filterTabs = document.querySelector('.tab-navigation');
    if (filterTabs) {
        filterTabs.addEventListener('click', function(e) {
            var btn = e.target.closest('.tab-btn');
            if (btn && btn.dataset.tab) {
                switchProductTab(btn.dataset.tab, btn);
            }
        });
    }

    var galleryThumbs = document.getElementById('galleryThumbs');
    if (galleryThumbs) {
        galleryThumbs.addEventListener('click', function(e) {
            var thumb = e.target.closest('.thumb');
            if (thumb) changeImage(thumb);
        });
    }

    var qtyControl = document.querySelector('.quantity-control');
    if (qtyControl) {
        qtyControl.addEventListener('click', function(e) {
            var btn = e.target.closest('.qty-btn');
            if (btn) {
                var isMinus = btn.getAttribute('aria-label') === 'Diminuir' || btn.textContent.indexOf('−') !== -1;
                if (isMinus) decreaseQty(); else increaseQty();
            }
        });
    }

    var whatsappBtn = document.querySelector('.btn-add-cart');
    if (whatsappBtn) whatsappBtn.addEventListener('click', contactWhatsApp);

    var buyBtn = document.querySelector('.btn-buy-now');
    if (buyBtn) buyBtn.addEventListener('click', buyNow);
}

document.addEventListener('DOMContentLoaded', function() {
    bindEvents();
    setTimeout(loadExcursao, 200);
});

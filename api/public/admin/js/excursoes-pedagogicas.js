/**
 * Página Gerenciar Excursões Pedagógicas - api/public/admin
 */
(function() {
  function initSidebarToggle() {
    var toggle = document.getElementById('sidebarToggle');
    if (!toggle) return;
    toggle.style.display = window.innerWidth <= 768 ? 'inline-block' : 'none';
    window.addEventListener('resize', function() {
      toggle.style.display = window.innerWidth <= 768 ? 'inline-block' : 'none';
    });
  }
  function escapeHtml(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  function capitalizeFirst(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
  }
  async function loadExcursoesPedagogicas() {
    try {
      var excursoes = typeof ExcursaoPedagogicaManager !== 'undefined'
        ? await ExcursaoPedagogicaManager.getAll(false)
        : [];
      renderExcursoesPedagogicas(Array.isArray(excursoes) ? excursoes : []);
    } catch (error) {
      console.error('[Excursões Pedagógicas] Erro:', error);
      var grid = document.getElementById('excursoesGrid');
      var emptyState = document.getElementById('emptyState');
      if (grid) grid.innerHTML = '';
      if (emptyState) {
        emptyState.innerHTML = '<p style="color: var(--danger-color);">Erro ao carregar. Verifique se está logado e se a API está disponível.</p>';
        emptyState.style.display = 'block';
      }
    }
  }
  function renderExcursoesPedagogicas(excursoes) {
    var grid = document.getElementById('excursoesGrid');
    var emptyState = document.getElementById('emptyState');
    var excursaoCount = document.getElementById('excursaoCount');
    if (!grid || !emptyState) return;
    if (excursaoCount) excursaoCount.textContent = excursoes.length;
    if (excursoes.length === 0) {
      grid.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }
    emptyState.style.display = 'none';
    var formatPrice = typeof ExcursaoPedagogicaManager !== 'undefined' && ExcursaoPedagogicaManager.formatPrice
      ? ExcursaoPedagogicaManager.formatPrice
      : function(p) { return 'R$ ' + (p != null ? Number(p).toFixed(2).replace('.', ',') : '0,00'); };
    grid.innerHTML = excursoes.map(function(e) {
      var imgStyle = e.imagemCapa ? "url('" + e.imagemCapa.replace(/'/g, "\\'") + "')" : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      return '<div class="excursao-card" data-id="' + escapeHtml(e.id) + '" style="border: 2px solid var(--light-border); border-radius: var(--radius-lg); overflow: hidden;">' +
        '<div style="height: 200px; background: ' + imgStyle + ' center/cover; position: relative;">' +
        '<span class="badge ' + (e.status === 'ATIVO' ? 'badge-success' : 'badge-danger') + '" style="position: absolute; top: 1rem; right: 1rem;">' + capitalizeFirst((e.status || '').toLowerCase()) + '</span>' +
        '<span class="badge badge-primary" style="position: absolute; top: 1rem; left: 1rem;">' + escapeHtml(e.codigo) + '</span></div>' +
        '<div style="padding: 1.5rem;"><h3 style="font-size: 1.25rem; margin: 0 0 0.5rem 0;">' + escapeHtml(e.titulo) + '</h3>' +
        '<p style="color: var(--text-light); font-size: 0.875rem; margin-bottom: 1rem;">' + escapeHtml((e.subtitulo || '').substring(0, 80)) + (e.subtitulo && e.subtitulo.length > 80 ? '...' : '') + '</p>' +
        '<div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;"><span class="badge badge-info">' + capitalizeFirst(e.categoria || '') + '</span></div>' +
        '<div style="display: flex; justify-content: space-between; align-items: center; padding-top: 1rem; border-top: 1px solid var(--light-border);">' +
        '<strong style="color: var(--primary-color);">' + formatPrice(e.preco) + '</strong>' +
        '<div style="display: flex; gap: 0.5rem;">' +
        '<a href="excursao-pedagogica-editor.html?id=' + encodeURIComponent(e.id) + '" class="btn btn-sm btn-secondary"><i class="fas fa-edit"></i></a>' +
        '</div></div></div>';
    }).join('');
  }
  window.loadExcursoesPedagogicas = loadExcursoesPedagogicas;
  document.addEventListener('DOMContentLoaded', function() {
    initSidebarToggle();
    loadExcursoesPedagogicas();
    var navLogout = document.getElementById('navLogout');
    if (navLogout && typeof window.logout === 'function') {
      navLogout.addEventListener('click', function(e) { e.preventDefault(); window.logout(); });
    }
  });
})();

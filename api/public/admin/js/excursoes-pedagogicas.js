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
    
    // Limpar grid antes de renderizar
    grid.innerHTML = '';
    
    // Renderizar cada card individualmente para garantir ordem da esquerda para direita
    excursoes.forEach(function(e) {
      var card = document.createElement('div');
      card.className = 'excursao-card';
      card.setAttribute('data-id', escapeHtml(e.id));
      
      var imgStyle = e.imagemCapa 
        ? "background-image: url('" + e.imagemCapa.replace(/'/g, "\\'") + "'); background-size: cover; background-position: center;"
        : 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);';
      
      var statusBadgeClass = e.status === 'ATIVO' ? 'badge-success' : 'badge-danger';
      var statusText = capitalizeFirst((e.status || '').toLowerCase());
      
      card.innerHTML = 
        '<div class="excursao-card-image" style="height: 200px; ' + imgStyle + ' position: relative;">' +
          '<span class="badge ' + statusBadgeClass + '" style="position: absolute; top: 1rem; right: 1rem; z-index: 10;">' + statusText + '</span>' +
          '<span class="badge badge-info" style="position: absolute; top: 1rem; left: 1rem; z-index: 10; background-color: rgba(0,0,0,0.6); color: white;">' + escapeHtml(e.codigo) + '</span>' +
        '</div>' +
        '<div class="excursao-card-content" style="padding: 1.5rem; display: flex; flex-direction: column; flex-grow: 1;">' +
          '<h3 style="font-size: 1.25rem; font-weight: 600; margin: 0 0 0.5rem 0; color: var(--text-dark);">' + escapeHtml(e.titulo) + '</h3>' +
          '<p style="color: var(--text-light); font-size: 0.875rem; margin: 0 0 1rem 0; line-height: 1.5; flex-grow: 1;">' + escapeHtml((e.subtitulo || '').substring(0, 100)) + (e.subtitulo && e.subtitulo.length > 100 ? '...' : '') + '</p>' +
          '<div style="display: flex; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap;">' +
            '<span class="badge badge-info">' + capitalizeFirst(e.categoria || '') + '</span>' +
          '</div>' +
          '<div style="display: flex; justify-content: space-between; align-items: center; padding-top: 1rem; border-top: 1px solid var(--light-border); margin-top: auto;">' +
            '<strong style="color: var(--primary-color); font-size: 1.25rem;">' + formatPrice(e.preco) + '</strong>' +
            '<a href="excursao-pedagogica-editor.html?id=' + encodeURIComponent(e.id) + '" class="btn btn-sm btn-secondary" style="text-decoration: none;"><i class="fas fa-edit"></i> Editar</a>' +
          '</div>' +
        '</div>';
      
      
      grid.appendChild(card);
    });
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

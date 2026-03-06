/**
 * Página Gerenciar Excursões Pedagógicas - api/public/admin
 */
(function() {
  var excursoesData = [];

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
      excursoesData = Array.isArray(excursoes) ? excursoes : [];
      applyFiltersAndRender();
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
  function getFilteredExcursoes() {
    var searchNome = (document.getElementById('searchExcursoesPedagogicas') && document.getElementById('searchExcursoesPedagogicas').value || '').trim().toLowerCase();
    var filterCodigo = (document.getElementById('filterCodigo') && document.getElementById('filterCodigo').value || '').trim().toLowerCase();
    var filterCategoria = document.getElementById('filterCategoria') ? document.getElementById('filterCategoria').value : 'todos';
    var filterStatus = document.getElementById('filterStatus') ? document.getElementById('filterStatus').value : 'todos';
    var filterLocalidade = (document.getElementById('filterLocalidade') && document.getElementById('filterLocalidade').value || '').trim().toLowerCase();
    var filterData = document.getElementById('filterData') ? document.getElementById('filterData').value : '';
    var filterHorario = (document.getElementById('filterHorario') && document.getElementById('filterHorario').value || '').trim().toLowerCase();
    var filterValorMin = document.getElementById('filterValorMin') ? parseFloat(document.getElementById('filterValorMin').value) : NaN;
    var filterValorMax = document.getElementById('filterValorMax') ? parseFloat(document.getElementById('filterValorMax').value) : NaN;

    return excursoesData.filter(function(e) {
      if (searchNome) {
        var titulo = (e.titulo || '').toLowerCase();
        var subtitulo = (e.subtitulo || '').toLowerCase();
        if (titulo.indexOf(searchNome) === -1 && subtitulo.indexOf(searchNome) === -1) return false;
      }
      if (filterCodigo && !(e.codigo || '').toLowerCase().includes(filterCodigo)) return false;
      if (filterCategoria !== 'todos' && e.categoria !== filterCategoria) return false;
      if (filterStatus !== 'todos' && e.status !== filterStatus) return false;
      if (filterLocalidade && !(e.local || '').toLowerCase().includes(filterLocalidade)) return false;
      if (filterData && e.dataDestino) {
        var dataStr = e.dataDestino instanceof Date ? e.dataDestino.toISOString().split('T')[0] : String(e.dataDestino).split('T')[0];
        if (dataStr !== filterData) return false;
      } else if (filterData && !e.dataDestino) return false;
      if (filterHorario && e.horario && !String(e.horario).toLowerCase().includes(filterHorario)) return false;
      else if (filterHorario && !e.horario) return false;
      var preco = e.preco != null ? Number(e.preco) : 0;
      if (!isNaN(filterValorMin) && preco < filterValorMin) return false;
      if (!isNaN(filterValorMax) && preco > filterValorMax) return false;
      return true;
    });
  }

  function applyFiltersAndRender() {
    renderExcursoesPedagogicas(getFilteredExcursoes());
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
          '<div style="padding-top: 1rem; border-top: 1px solid var(--light-border); margin-top: auto;">' +
            '<div style="margin-bottom: 0.75rem;"><strong style="color: var(--primary-color); font-size: 1.25rem;">' + formatPrice(e.preco) + '</strong></div>' +
            '<div style="display: flex; gap: 0.5rem; flex-wrap: nowrap; align-items: center;">' +
              '<a href="excursao-pedagogica-editor.html?id=' + encodeURIComponent(e.id) + '" class="btn btn-sm btn-secondary" style="text-decoration: none; padding: 0.35rem 0.5rem;" title="Editar"><i class="fas fa-edit"></i></a>' +
              '<a href="listas.html?excursaoId=' + encodeURIComponent(e.id) + '" class="btn btn-sm btn-primary" style="text-decoration: none; padding: 0.35rem 0.5rem;" title="Lista de Alunos"><i class="fas fa-list-alt"></i></a>' +
              '<button type="button" class="btn btn-sm btn-danger btn-delete-excursao-pedagogica" style="padding: 0.35rem 0.5rem;" data-id="' + escapeHtml(e.id) + '" data-titulo="' + escapeHtml(e.titulo) + '" data-codigo="' + escapeHtml(e.codigo) + '" title="Excluir"><i class="fas fa-trash"></i></button>' +
            '</div>' +
          '</div>' +
        '</div>';
      
      
      grid.appendChild(card);
    });

    // Event listeners para botões de excluir
    grid.querySelectorAll('.btn-delete-excursao-pedagogica').forEach(function(btn) {
      btn.addEventListener('click', function() {
        deleteExcursaoPedagogica(
          this.getAttribute('data-id') || '',
          this.getAttribute('data-titulo') || '',
          this.getAttribute('data-codigo') || ''
        );
      });
    });
  }

  /**
   * Explicação da função [deleteExcursaoPedagogica]
   * Exclui permanentemente uma excursão pedagógica após confirmação do usuário.
   * Usa confirmDelete para dialog de confirmação e ExcursaoPedagogicaManager.delete para a API.
   */
  function deleteExcursaoPedagogica(id, titulo, codigo) {
    var label = codigo ? '[' + codigo + '] ' + titulo : titulo;
    if (typeof confirmDelete === 'function') {
      confirmDelete(label + ' (excursão pedagógica)', doDelete);
    } else if (confirm('Tem certeza que deseja excluir permanentemente a excursão "' + label + '"? Esta ação não pode ser desfeita.')) {
      doDelete();
    } else {
      return;
    }
    function doDelete() {
      if (typeof ExcursaoPedagogicaManager === 'undefined' || !ExcursaoPedagogicaManager.delete) {
        console.error('[Excursões Pedagógicas] ExcursaoPedagogicaManager.delete não disponível');
        if (typeof showToast === 'function') showToast('Erro: API não disponível.', 'error');
        return;
      }
      ExcursaoPedagogicaManager.delete(id).then(function() {
        console.log('[Excursões Pedagógicas] Excursão excluída:', id);
        if (typeof showToast === 'function') showToast('Excursão excluída com sucesso.', 'success');
        loadExcursoesPedagogicas();
      }).catch(function(err) {
        console.error('[Excursões Pedagógicas] Erro ao excluir:', err);
        var msg = (err && err.message) ? err.message : 'Erro ao excluir excursão.';
        if (err && err.response && err.response.data && err.response.data.message) msg = err.response.data.message;
        if (typeof showToast === 'function') showToast(msg, 'error');
      });
    }
  }
  window.loadExcursoesPedagogicas = loadExcursoesPedagogicas;
  document.addEventListener('DOMContentLoaded', function() {
    initSidebarToggle();
    loadExcursoesPedagogicas();

    var filterIds = ['searchExcursoesPedagogicas', 'filterCodigo', 'filterCategoria', 'filterStatus', 'filterLocalidade', 'filterData', 'filterHorario', 'filterValorMin', 'filterValorMax'];
    filterIds.forEach(function(id) {
      var el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', applyFiltersAndRender);
        el.addEventListener('change', applyFiltersAndRender);
        el.addEventListener('keyup', function(e) { if (e.key === 'Enter') applyFiltersAndRender(); });
      }
    });

    var navLogout = document.getElementById('navLogout');
    if (navLogout && typeof window.logout === 'function') {
      navLogout.addEventListener('click', function(e) { e.preventDefault(); window.logout(); });
    }
  });
})();

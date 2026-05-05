/**
 * Página Gerenciar Excursões Pedagógicas - api/public/admin
 */
(function() {
  var excursoesData = [];
  var currentPage = 1;
  var debounceTimer;

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
  async function loadExcursoesPedagogicas(page) {
    if (page) currentPage = page;
    
    var grid = document.getElementById('excursoesGrid');
    var emptyState = document.getElementById('emptyState');
    var paginationContainer = document.getElementById('paginationContainer');
    
    if (grid) {
      grid.innerHTML = '<div class="spinner"></div>';
    }
    if (emptyState) {
      emptyState.style.display = 'none';
    }
    if (paginationContainer) {
      paginationContainer.innerHTML = '';
    }

    // Coleta filtros
    var filterCategoria = document.getElementById('filterCategoria') ? document.getElementById('filterCategoria').value : 'todos';
    var filterStatus = document.getElementById('filterStatus') ? document.getElementById('filterStatus').value : 'todos';

    var params = {
      page: currentPage,
      limit: 10,
      search: (document.getElementById('searchExcursoesPedagogicas') && document.getElementById('searchExcursoesPedagogicas').value || '').trim(),
      codigo: (document.getElementById('filterCodigo') && document.getElementById('filterCodigo').value || '').trim(),
      categoria: filterCategoria === 'todos' ? '' : filterCategoria,
      status: filterStatus === 'todos' ? '' : filterStatus,
      localidade: (document.getElementById('filterLocalidade') && document.getElementById('filterLocalidade').value || '').trim(),
      data: document.getElementById('filterData') ? document.getElementById('filterData').value : '',
      horario: (document.getElementById('filterHorario') && document.getElementById('filterHorario').value || '').trim(),
      valorMin: document.getElementById('filterValorMin') ? document.getElementById('filterValorMin').value : '',
      valorMax: document.getElementById('filterValorMax') ? document.getElementById('filterValorMax').value : ''
    };

    try {
      var response = typeof ExcursaoPedagogicaManager !== 'undefined'
        ? await ExcursaoPedagogicaManager.getAll(params)
        : { data: [], pagination: { total: 0, totalPages: 1, page: 1 } };
      
      excursoesData = Array.isArray(response.data) ? response.data : [];
      renderExcursoesPedagogicas(excursoesData, response.pagination);
      renderPagination(response.pagination);
    } catch (error) {
      console.error('[Excursões Pedagógicas] Erro:', error);
      if (grid) grid.innerHTML = '';
      if (emptyState) {
        emptyState.innerHTML = '<p style="color: var(--danger-color);">Erro ao carregar. Verifique se está logado e se a API está disponível.</p>';
        emptyState.style.display = 'block';
      }
    }
  }

  function handleFilterInput() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function() {
      loadExcursoesPedagogicas(1);
    }, 500);
  }
  function renderExcursoesPedagogicas(excursoes, pagination) {
    var grid = document.getElementById('excursoesGrid');
    var emptyState = document.getElementById('emptyState');
    var excursaoCount = document.getElementById('excursaoCount');
    if (!grid || !emptyState) return;
    
    if (excursaoCount) excursaoCount.textContent = pagination ? pagination.total : excursoes.length;
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

  function renderPagination(pagination) {
    var container = document.getElementById('paginationContainer');
    if (!container || !pagination || pagination.totalPages <= 1) {
      if (container) container.innerHTML = '';
      return;
    }

    var html = '';
    
    // Botão Anterior
    html += '<button class="pagination-btn" ' + (pagination.page <= 1 ? 'disabled' : '') + ' data-page="' + (pagination.page - 1) + '"><i class="fas fa-chevron-left"></i> Anterior</button>';
    
    // Páginas
    var startPage = Math.max(1, pagination.page - 2);
    var endPage = Math.min(pagination.totalPages, startPage + 4);
    if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);
    
    for (var i = startPage; i <= endPage; i++) {
      html += '<button class="pagination-btn ' + (i === pagination.page ? 'active' : '') + '" data-page="' + i + '">' + i + '</button>';
    }
    
    // Botão Próximo
    html += '<button class="pagination-btn" ' + (pagination.page >= pagination.totalPages ? 'disabled' : '') + ' data-page="' + (pagination.page + 1) + '">Próximo <i class="fas fa-chevron-right"></i></button>';
    
    container.innerHTML = html;
    
    // Event listeners para os botões
    container.querySelectorAll('.pagination-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var page = parseInt(this.getAttribute('data-page'));
        if (!isNaN(page)) {
          loadExcursoesPedagogicas(page);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
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
        el.addEventListener('input', handleFilterInput);
        el.addEventListener('change', handleFilterInput);
        el.addEventListener('keyup', function(e) { if (e.key === 'Enter') loadExcursoesPedagogicas(1); });
      }
    });

    var navLogout = document.getElementById('navLogout');
    if (navLogout && typeof window.logout === 'function') {
      navLogout.addEventListener('click', function(e) { e.preventDefault(); window.logout(); });
    }
  });
})();

/**
 * Página Gerenciar Excursões Pedagógicas - lógica externalizada para compatibilidade com CSP.
 */

(function() {
  function initSidebarToggle() {
    var toggle = document.getElementById('sidebarToggle');
    if (!toggle) return;
    if (window.innerWidth <= 768) {
      toggle.style.display = 'inline-block';
    } else {
      toggle.style.display = 'none';
    }
    window.addEventListener('resize', function() {
      if (window.innerWidth <= 768) {
        toggle.style.display = 'inline-block';
      } else {
        toggle.style.display = 'none';
      }
    });
  }

  function escapeHtml(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  async function loadExcursoesPedagogicas() {
    console.log('[Excursões Pedagógicas Admin] 🚀 INICIANDO CARREGAMENTO...');
    try {
      var excursoes = await ExcursaoPedagogicaManager.getAll(false);
      console.log('[Excursões Pedagógicas Admin] 📦 EXCURSÕES RETORNADAS:', {
        quantidade: excursoes.length,
        isArray: Array.isArray(excursoes),
        primeiras3: excursoes.slice(0, 3).map(function(e) { return { id: e.id, codigo: e.codigo, titulo: e.titulo }; })
      });
      renderExcursoesPedagogicas(excursoes);
    } catch (error) {
      console.error('[Excursões Pedagógicas Admin] ❌ ERRO AO CARREGAR:', error);
      if (error.message && error.message.indexOf('401') !== -1) {
        if (typeof showToast === 'function') showToast('Sessão expirada. Faça login novamente.', 'error');
        setTimeout(function() { window.location.href = 'login.html'; }, 2000);
        return;
      }
      if (typeof showToast === 'function') showToast('Erro ao carregar excursões pedagógicas: ' + error.message, 'error');
      var grid = document.getElementById('excursoesGrid');
      var emptyState = document.getElementById('emptyState');
      if (grid) grid.innerHTML = '';
      if (emptyState) {
        emptyState.innerHTML = '<i class="fas fa-exclamation-circle" style="font-size: 4rem; color: var(--danger-color); margin-bottom: 1rem;"></i>' +
          '<h3 style="color: var(--text-dark);">Erro ao carregar excursões pedagógicas</h3>' +
          '<p style="color: var(--text-light);">' + escapeHtml(error.message) + '</p>' +
          '<button class="btn btn-primary" id="btnRetryExcursoes" style="margin-top: 1rem;"><i class="fas fa-redo"></i> Tentar novamente</button>';
        emptyState.style.display = 'block';
        var btn = document.getElementById('btnRetryExcursoes');
        if (btn) btn.addEventListener('click', loadExcursoesPedagogicas);
      }
    }
  }

  function addHoverEffects() {
    document.querySelectorAll('.excursao-card').forEach(function(card) {
      card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-5px)';
        this.style.boxShadow = 'var(--shadow-lg)';
      });
      card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = 'none';
      });
    });
  }

  function renderExcursoesPedagogicas(excursoes) {
    var grid = document.getElementById('excursoesGrid');
    var emptyState = document.getElementById('emptyState');
    var excursaoCount = document.getElementById('excursaoCount');
    if (!grid || !emptyState || !excursaoCount) return;

    excursaoCount.textContent = excursoes.length;

    if (excursoes.length === 0) {
      grid.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';
    grid.innerHTML = excursoes.map(function(excursao) {
      var imgStyle = excursao.imagemCapa ? "url('" + excursao.imagemCapa.replace(/'/g, "\\'") + "')" : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      return '<div class="excursao-card" data-id="' + escapeHtml(excursao.id) + '" style="border: 2px solid var(--light-border); border-radius: var(--radius-lg); overflow: hidden;">' +
        '<div style="height: 200px; background: ' + imgStyle + ' center/cover; position: relative;">' +
        '<span class="badge ' + (excursao.status === 'ATIVO' ? 'badge-success' : 'badge-danger') + '" style="position: absolute; top: 1rem; right: 1rem;">' + capitalizeFirst((excursao.status || '').toLowerCase()) + '</span>' +
        '<span class="badge badge-primary" style="position: absolute; top: 1rem; left: 1rem;">' + escapeHtml(excursao.codigo) + '</span>' +
        '</div><div style="padding: 1.5rem;">' +
        '<h3 style="font-size: 1.25rem; margin: 0 0 0.5rem 0;">' + escapeHtml(excursao.titulo) + '</h3>' +
        '<p style="color: var(--text-light); font-size: 0.875rem; margin-bottom: 1rem; min-height: 40px;">' + escapeHtml(excursao.subtitulo ? excursao.subtitulo.substring(0, 80) + (excursao.subtitulo.length > 80 ? '...' : '') : 'Sem descrição') + '</p>' +
        '<div style="display: flex; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap;">' +
        '<span class="badge badge-info">' + capitalizeFirst(excursao.categoria || '') + '</span>' +
        (excursao.duracao ? '<span class="badge badge-secondary">' + escapeHtml(excursao.duracao) + '</span>' : '') +
        '</div><div style="display: flex; justify-content: space-between; align-items: center; padding-top: 1rem; border-top: 1px solid var(--light-border);">' +
        '<strong style="color: var(--primary-color); font-size: 1.25rem;">' + (ExcursaoPedagogicaManager.formatPrice ? ExcursaoPedagogicaManager.formatPrice(excursao.preco) : excursao.preco) + '</strong>' +
        '<div style="display: flex; gap: 0.5rem;">' +
        '<button class="btn btn-sm btn-secondary btn-edit-excursao" data-id="' + escapeHtml(excursao.id) + '" title="Editar"><i class="fas fa-edit"></i></button>' +
        '<button class="btn btn-sm btn-info btn-view-excursao" data-slug="' + escapeHtml(excursao.slug) + '" title="Visualizar"><i class="fas fa-eye"></i></button>' +
        '<button class="btn btn-sm ' + (excursao.status === 'ATIVO' ? 'btn-warning' : 'btn-success') + ' btn-toggle-status" data-id="' + escapeHtml(excursao.id) + '" title="' + (excursao.status === 'ATIVO' ? 'Desativar' : 'Ativar') + '"><i class="fas ' + (excursao.status === 'ATIVO' ? 'fa-pause' : 'fa-play') + '"></i></button>' +
        '<button class="btn btn-sm btn-danger btn-delete-excursao" data-id="' + escapeHtml(excursao.id) + '" data-titulo="' + escapeHtml(excursao.titulo) + '" title="Excluir"><i class="fas fa-trash"></i></button>' +
        '</div></div></div></div>';
    }).join('');

    grid.querySelectorAll('.btn-edit-excursao').forEach(function(btn) {
      btn.addEventListener('click', function() { window.location.href = 'excursao-pedagogica-editor.html?id=' + encodeURIComponent(this.getAttribute('data-id')); });
    });
    grid.querySelectorAll('.btn-view-excursao').forEach(function(btn) {
      btn.addEventListener('click', function() { window.open('../portfolio-single.html?slug=' + encodeURIComponent(this.getAttribute('data-slug')), '_blank'); });
    });
    grid.querySelectorAll('.btn-toggle-status').forEach(function(btn) {
      btn.addEventListener('click', function() { toggleStatus(this.getAttribute('data-id')); });
    });
    grid.querySelectorAll('.btn-delete-excursao').forEach(function(btn) {
      btn.addEventListener('click', function() { deleteExcursao(this.getAttribute('data-id'), this.getAttribute('data-titulo') || ''); });
    });

    addHoverEffects();
  }

  async function filterExcursoesPedagogicas() {
    var searchTerm = (document.getElementById('searchExcursoesPedagogicas') && document.getElementById('searchExcursoesPedagogicas').value || '').toLowerCase();
    var codigoFilter = (document.getElementById('filterCodigo') && document.getElementById('filterCodigo').value || '').toLowerCase();
    var categoriaFilter = document.getElementById('filterCategoria') ? document.getElementById('filterCategoria').value : 'todos';
    var statusFilter = document.getElementById('filterStatus') ? document.getElementById('filterStatus').value : 'todos';

    var excursoes = await ExcursaoPedagogicaManager.getAll(false);
    
    if (searchTerm) {
      excursoes = excursoes.filter(function(e) {
        return (e.titulo && e.titulo.toLowerCase().indexOf(searchTerm) !== -1) || 
               (e.subtitulo && e.subtitulo.toLowerCase().indexOf(searchTerm) !== -1) ||
               (e.codigo && e.codigo.toLowerCase().indexOf(searchTerm) !== -1);
      });
    }
    
    if (codigoFilter) {
      excursoes = excursoes.filter(function(e) {
        return e.codigo && e.codigo.toLowerCase().indexOf(codigoFilter) !== -1;
      });
    }
    
    if (categoriaFilter !== 'todos') {
      excursoes = excursoes.filter(function(e) { return e.categoria === categoriaFilter; });
    }
    
    if (statusFilter !== 'todos') {
      excursoes = excursoes.filter(function(e) { return e.status === (statusFilter.toUpperCase ? statusFilter.toUpperCase() : statusFilter); });
    }
    
    renderExcursoesPedagogicas(excursoes);
  }

  function editExcursao(id) {
    window.location.href = 'excursao-pedagogica-editor.html?id=' + encodeURIComponent(id);
  }

  function viewExcursao(slug) {
    window.open('../portfolio-single.html?slug=' + encodeURIComponent(slug), '_blank');
  }

  async function toggleStatus(excursaoId) {
    try {
      var excursao = await ExcursaoPedagogicaManager.getById(excursaoId);
      if (!excursao) {
        if (typeof showToast === 'function') showToast('Excursão pedagógica não encontrada.', 'error');
        return;
      }
      var newStatus = excursao.status === 'ATIVO' ? 'INATIVO' : 'ATIVO';
      var result = await ExcursaoPedagogicaManager.toggleStatus(excursaoId, newStatus);
      if (result) {
        if (typeof showToast === 'function') showToast('Excursão pedagógica ' + (newStatus === 'ATIVO' ? 'ativada' : 'desativada') + ' com sucesso!', 'success');
        loadExcursoesPedagogicas();
      } else {
        if (typeof showToast === 'function') showToast('Erro ao alterar status.', 'error');
      }
    } catch (error) {
      console.error('[Excursões Pedagógicas Admin] Erro ao alterar status:', error);
      if (typeof showToast === 'function') showToast('Erro ao alterar status.', 'error');
    }
  }

  function deleteExcursao(excursaoId, titulo) {
    if (typeof confirmDelete === 'function') {
      confirmDelete(titulo, function() {
        ExcursaoPedagogicaManager.delete(excursaoId).then(function(success) {
          if (success) {
            if (typeof showToast === 'function') showToast('Excursão pedagógica excluída com sucesso!', 'success');
            var card = document.querySelector('.excursao-card[data-id="' + excursaoId + '"]');
            if (card) {
              card.style.animation = 'slideOutRight 0.3s ease';
              setTimeout(loadExcursoesPedagogicas, 300);
            }
          } else {
            if (typeof showToast === 'function') showToast('Erro ao excluir excursão pedagógica.', 'error');
          }
        }).catch(function(err) {
          console.error('[Excursões Pedagógicas Admin] Erro ao excluir:', err);
          if (typeof showToast === 'function') showToast('Erro ao excluir excursão pedagógica.', 'error');
        });
      });
    }
  }

  window.loadExcursoesPedagogicas = loadExcursoesPedagogicas;
  window.filterExcursoesPedagogicas = filterExcursoesPedagogicas;
  window.editExcursao = editExcursao;
  window.viewExcursao = viewExcursao;
  window.toggleStatus = toggleStatus;
  window.deleteExcursao = deleteExcursao;

  document.addEventListener('DOMContentLoaded', function() {
    initSidebarToggle();
    loadExcursoesPedagogicas();

    var navLogout = document.getElementById('navLogout');
    if (navLogout && typeof window.logout === 'function') {
      navLogout.addEventListener('click', function(e) { e.preventDefault(); window.logout(); });
    }

    var searchExcursoes = document.getElementById('searchExcursoesPedagogicas');
    if (searchExcursoes) searchExcursoes.addEventListener('keyup', filterExcursoesPedagogicas);
    var filterCodigo = document.getElementById('filterCodigo');
    if (filterCodigo) filterCodigo.addEventListener('keyup', filterExcursoesPedagogicas);
    var filterCategoria = document.getElementById('filterCategoria');
    if (filterCategoria) filterCategoria.addEventListener('change', filterExcursoesPedagogicas);
    var filterStatus = document.getElementById('filterStatus');
    if (filterStatus) filterStatus.addEventListener('change', filterExcursoesPedagogicas);
  });
})();

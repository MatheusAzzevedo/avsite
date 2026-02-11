/**
 * Categorias de excursão (Viagens) - CRUD no admin.
 * Os nomes refletem na página Viagens do site (filtros).
 */

const API_CATEGORIAS = '/admin/categorias-excursao';

function showCategoriaToast(msg, type) {
  if (typeof window.showToast !== 'undefined') window.showToast(msg, type);
  else alert(msg);
}

async function loadCategorias() {
  const tbody = document.getElementById('categoriasBody');
  const loading = document.getElementById('loadingCategorias');
  const empty = document.getElementById('emptyCategorias');
  const table = document.getElementById('categoriasTable');

  try {
    const res = await apiRequest(API_CATEGORIAS);
    const list = Array.isArray(res?.data) ? res.data : [];
    loading.textContent = list.length ? '' : 'Nenhuma categoria cadastrada.';
    empty.style.display = list.length ? 'none' : 'block';
    table.style.display = list.length ? '' : 'none';

    tbody.innerHTML = list.map(function (c) {
      return (
        '<tr data-id="' + escapeAttr(c.id) + '">' +
        '<td>' + escapeHtml(String(c.ordem ?? 0)) + '</td>' +
        '<td><code>' + escapeHtml(c.slug) + '</code></td>' +
        '<td>' + escapeHtml(c.nome) + '</td>' +
        '<td>' +
        '<button type="button" class="btn btn-sm btn-edit-categoria" data-id="' + escapeAttr(c.id) + '" data-slug="' + escapeAttr(c.slug) + '" data-nome="' + escapeAttr(c.nome) + '" data-ordem="' + escapeAttr(c.ordem) + '"><i class="fas fa-edit"></i></button> ' +
        '<button type="button" class="btn btn-sm btn-danger btn-delete-categoria" data-id="' + escapeAttr(c.id) + '" data-nome="' + escapeAttr(c.nome) + '"><i class="fas fa-trash"></i></button>' +
        '</td></tr>'
      );
    }).join('');

    attachRowListeners();
  } catch (e) {
    console.error('[Categorias] Erro ao carregar:', e);
    loading.textContent = 'Erro ao carregar categorias.';
    empty.style.display = 'none';
    table.style.display = 'none';
  }
}

function escapeHtml(t) {
  if (t == null) return '';
  var div = document.createElement('div');
  div.textContent = t;
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

function attachRowListeners() {
  document.querySelectorAll('.btn-edit-categoria').forEach(function (btn) {
    btn.addEventListener('click', function () {
      openModal(
        btn.dataset.id,
        btn.dataset.slug,
        btn.dataset.nome,
        btn.dataset.ordem
      );
    });
  });
  document.querySelectorAll('.btn-delete-categoria').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var nomeCat = btn.dataset.nome || ''; if (!confirm('Excluir a categoria "' + nomeCat + '"? Excursões que a usam precisarão ser alteradas antes.')) return;
      deleteCategoria(btn.dataset.id);
    });
  });
}

function openModal(id, slug, nome, ordem) {
  console.log('[Categorias] openModal chamada:', { id, slug, nome, ordem });
  
  const modalTitle = document.getElementById('modalCategoriaTitle');
  const categoriaId = document.getElementById('categoriaId');
  const categoriaSlug = document.getElementById('categoriaSlug');
  const categoriaNome = document.getElementById('categoriaNome');
  const categoriaOrdem = document.getElementById('categoriaOrdem');
  const modal = document.getElementById('modalCategoria');
  
  if (!modalTitle || !categoriaId || !categoriaSlug || !categoriaNome || !categoriaOrdem || !modal) {
    console.error('[Categorias] ERRO: Elementos do modal não encontrados!', {
      modalTitle, categoriaId, categoriaSlug, categoriaNome, categoriaOrdem, modal
    });
    return;
  }
  
  modalTitle.textContent = id ? 'Editar categoria' : 'Nova categoria';
  categoriaId.value = id || '';
  categoriaSlug.value = slug || '';
  categoriaSlug.readOnly = !!id;
  categoriaNome.value = nome || '';
  categoriaOrdem.value = ordem !== undefined && ordem !== '' ? ordem : '0';
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  
  console.log('[Categorias] Modal aberto com sucesso');
}

function closeModal() {
  document.getElementById('modalCategoria').classList.add('hidden');
  document.body.style.overflow = '';
}

async function saveCategoria() {
  var id = document.getElementById('categoriaId').value.trim();
  var slug = document.getElementById('categoriaSlug').value.trim().toLowerCase();
  var nome = document.getElementById('categoriaNome').value.trim();
  var ordem = parseInt(document.getElementById('categoriaOrdem').value, 10) || 0;

  if (!slug || !nome) {
    showCategoriaToast('Preencha slug e nome.', 'error');
    return;
  }
  if (!/^[a-z0-9áéíóúâêôãõç\-]+$/.test(slug)) {
    showCategoriaToast('Slug: apenas letras minúsculas, números e hífen.', 'error');
    return;
  }

  var saveBtn = document.getElementById('modalCategoriaSave');
  saveBtn.disabled = true;
  saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';

  try {
    if (id) {
      await apiRequest(API_CATEGORIAS + '/' + id, {
        method: 'PUT',
        body: JSON.stringify({ nome: nome, ordem: ordem })
      });
      showCategoriaToast('Categoria atualizada.', 'success');
    } else {
      await apiRequest(API_CATEGORIAS, {
        method: 'POST',
        body: JSON.stringify({ slug: slug, nome: nome, ordem: ordem })
      });
      showCategoriaToast('Categoria criada.', 'success');
    }
    closeModal();
    loadCategorias();
  } catch (e) {
    showCategoriaToast(e.message || 'Erro ao salvar.', 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = '<i class="fas fa-check"></i> Salvar';
  }
}

async function deleteCategoria(id) {
  try {
    await apiRequest(API_CATEGORIAS + '/' + id, { method: 'DELETE' });
    showCategoriaToast('Categoria excluída.', 'success');
    loadCategorias();
  } catch (e) {
    showCategoriaToast(e.message || 'Erro ao excluir.', 'error');
  }
}

document.addEventListener('DOMContentLoaded', function () {
  console.log('[Categorias] Inicializando...');

  var btnNovaCategoria = document.getElementById('btnNovaCategoria');
  if (btnNovaCategoria) {
    btnNovaCategoria.addEventListener('click', function () {
      openModal(null, '', '', 0);
    });
  }

  loadCategorias();

  const modalClose = document.querySelector('#modalCategoria .modal-close');
  if (modalClose) {
    modalClose.addEventListener('click', closeModal);
  } else {
    console.error('[Categorias] ERRO: .modal-close não encontrado!');
  }
  
  const btnCancel = document.getElementById('modalCategoriaCancel');
  if (btnCancel) {
    btnCancel.addEventListener('click', closeModal);
  } else {
    console.error('[Categorias] ERRO: modalCategoriaCancel não encontrado!');
  }
  
  const btnSave = document.getElementById('modalCategoriaSave');
  if (btnSave) {
    btnSave.addEventListener('click', saveCategoria);
  } else {
    console.error('[Categorias] ERRO: modalCategoriaSave não encontrado!');
  }

  const modal = document.getElementById('modalCategoria');
  if (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === this) closeModal();
    });
  } else {
    console.error('[Categorias] ERRO: modalCategoria não encontrado!');
  }
});

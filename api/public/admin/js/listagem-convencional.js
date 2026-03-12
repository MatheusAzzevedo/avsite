/**
 * Explicação do Arquivo [listagem-convencional.js]
 *
 * Gerencia a página Listagem Convencional do admin.
 * Lista compras de viagens convencionais, exibe detalhes em modal e permite excluir.
 * Exporta dados para Excel (.xlsx).
 */

const API_BASE = '/api/admin/listagem-convencional';

let pedidosData = [];

/**
 * Explicação da função [loadPedidos]
 * Carrega lista de pedidos convencionais da API.
 */
async function loadPedidos() {
  const loading = document.getElementById('loadingState');
  const emptyState = document.getElementById('emptyState');
  const tableContainer = document.getElementById('tableContainer');

  loading.style.display = 'block';
  emptyState.style.display = 'none';
  tableContainer.style.display = 'none';

  try {
    const token = typeof AuthManager !== 'undefined' ? AuthManager.getToken() : localStorage.getItem('avorar_token');
    if (!token) {
      window.location.href = 'login.html';
      return;
    }

    const response = await fetch(API_BASE, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.status === 401) {
      window.location.href = 'login.html';
      return;
    }

    if (!response.ok) throw new Error('Erro ao carregar pedidos');

    const result = await response.json();
    pedidosData = result.data || [];

    loading.style.display = 'none';

    if (pedidosData.length === 0) {
      emptyState.style.display = 'block';
      return;
    }

    tableContainer.style.display = 'block';
    document.getElementById('filtersBar').style.display = 'block';
    renderTable();
  } catch (error) {
    console.error('[Listagem Convencional] Erro:', error);
    loading.style.display = 'none';
    emptyState.style.display = 'block';
    emptyState.innerHTML = '<i class="fas fa-exclamation-circle" style="font-size: 4rem; color: var(--danger-color);"></i><h3>Erro ao carregar</h3><p>' + (error.message || 'Tente novamente.') + '</p>';
  }
}

/**
 * Explicação da função [formatMoney]
 * Formata valor para padrão brasileiro R$ X.XXX,XX
 */
function formatMoney(val) {
  const n = Number(val);
  if (isNaN(n)) return 'R$ 0,00';
  return 'R$ ' + n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Explicação da função [formatDate]
 * Formata data para dd/mm/yyyy
 */
function formatDate(d) {
  if (!d) return '-';
  const date = new Date(d);
  return date.toLocaleDateString('pt-BR');
}

/**
 * Explicação da função [escapeHtml]
 * Escapa HTML para evitar XSS
 */
function escapeHtml(str) {
  if (str == null || str === '') return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Explicação da função [getFilteredPedidos]
 * Aplica filtros de data, excursão ativa e status de pagamento.
 */
function getFilteredPedidos() {
  const dataDe = document.getElementById('filtroDataDe').value;
  const dataAte = document.getElementById('filtroDataAte').value;
  const excursaoFiltro = document.getElementById('filtroExcursao').value;
  const pagamentoFiltro = document.getElementById('filtroPagamento').value;

  return pedidosData.filter(p => {
    const dataPedido = p.dataPedido ? new Date(p.dataPedido) : null;
    if (dataDe && dataPedido) {
      const d = new Date(dataDe);
      d.setHours(0, 0, 0, 0);
      if (dataPedido < d) return false;
    }
    if (dataAte && dataPedido) {
      const d = new Date(dataAte);
      d.setHours(23, 59, 59, 999);
      if (dataPedido > d) return false;
    }
    if (excursaoFiltro === 'ativo' && !p.excursaoAtivo) return false;
    if (excursaoFiltro === 'inativo' && p.excursaoAtivo) return false;
    if (pagamentoFiltro === 'pendente') {
      if (p.status !== 'PENDENTE' && p.status !== 'AGUARDANDO_PAGAMENTO') return false;
    }
    if (pagamentoFiltro === 'concluido') {
      if (p.status !== 'PAGO' && p.status !== 'CONFIRMADO') return false;
    }
    return true;
  });
}

/**
 * Explicação da função [renderTable]
 * Renderiza a tabela de pedidos no DOM (aplica filtros)
 */
function renderTable() {
  const filtered = getFilteredPedidos();
  const tbody = document.getElementById('tableBody');
  const emptyState = document.getElementById('emptyState');
  const tableContainer = document.getElementById('tableContainer');

  if (filtered.length === 0) {
    tbody.innerHTML = '';
    emptyState.style.display = 'block';
    emptyState.innerHTML = '<i class="fas fa-filter" style="font-size: 4rem; color: var(--text-light); opacity: 0.5;"></i><h3 style="color: var(--text-light); margin-top: 1rem;">Nenhum resultado com os filtros aplicados</h3><p style="color: var(--text-light);">Ajuste os filtros ou clique em Limpar para ver todos.</p>';
    tableContainer.style.display = 'none';
    return;
  }

  emptyState.style.display = 'none';
  tableContainer.style.display = 'block';
  tbody.innerHTML = filtered.map(p => {
    const statusClass = {
      PAGO: 'badge-success',
      CONFIRMADO: 'badge-success',
      PENDENTE: 'badge-warning',
      AGUARDANDO_PAGAMENTO: 'badge-info',
      CANCELADO: 'badge-danger',
      EXPIRADO: 'badge-secondary'
    }[p.status] || 'badge-secondary';
    return '<tr>' +
      '<td>' + escapeHtml(p.excursaoTitulo) + '</td>' +
      '<td>' + escapeHtml((p.cliente && p.cliente.nome) || '-') + '</td>' +
      '<td>' + p.totalPassageiros + '</td>' +
      '<td>' + formatMoney(p.valorTotal) + '</td>' +
      '<td><span class="badge ' + statusClass + '">' + escapeHtml(p.statusLabel) + '</span></td>' +
      '<td>' + formatDate(p.dataPedido) + '</td>' +
      '<td><div class="action-buttons-cell">' +
        '<button type="button" class="btn btn-sm btn-primary btn-view" data-id="' + escapeHtml(p.id) + '" title="Visualizar"><i class="fas fa-eye"></i></button>' +
        '<button type="button" class="btn btn-sm btn-danger btn-delete" data-id="' + escapeHtml(p.id) + '" data-titulo="' + escapeHtml(p.excursaoTitulo) + '" title="Excluir"><i class="fas fa-trash"></i></button>' +
      '</div></td>' +
    '</tr>';
  }).join('');

  // Bind events
  tbody.querySelectorAll('.btn-view').forEach(btn => {
    btn.addEventListener('click', () => openDetalhes(btn.getAttribute('data-id')));
  });
  tbody.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => deletePedido(btn.getAttribute('data-id'), btn.getAttribute('data-titulo') || ''));
  });
}

/**
 * Explicação da função [openDetalhes]
 * Abre modal com detalhes do pedido
 */
async function openDetalhes(pedidoId) {
  try {
    const token = typeof AuthManager !== 'undefined' ? AuthManager.getToken() : localStorage.getItem('avorar_token');
    const response = await fetch(API_BASE + '/' + encodeURIComponent(pedidoId), {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Erro ao carregar detalhes');
    const result = await response.json();
    const d = result.data;

    const passageirosHtml = (d.passageiros || []).map(p => {
      let enderecoStr = '';
      if (p.endereco && typeof p.endereco === 'object') {
        const parts = [p.endereco.endereco, p.endereco.numero, p.endereco.complemento, p.endereco.bairro, p.endereco.cidade, p.endereco.estado, p.endereco.cep, p.endereco.pais].filter(Boolean);
        enderecoStr = parts.join(', ');
      }
      return '<div class="passageiro-card">' +
        '<h5><i class="fas fa-user"></i> ' + escapeHtml(p.nome || '-') + '</h5>' +
        '<div class="detail-row"><span class="detail-label">CPF:</span><span>' + escapeHtml(p.cpf || '-') + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">Telefone:</span><span>' + escapeHtml(p.telefone || '-') + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">E-mail:</span><span>' + escapeHtml(p.email || '-') + '</span></div>' +
        (enderecoStr ? '<div class="detail-row"><span class="detail-label">Endereço:</span><span>' + escapeHtml(enderecoStr) + '</span></div>' : '') +
      '</div>';
    }).join('');

    document.getElementById('modalTitle').textContent = 'Compra: ' + (d.excursao && d.excursao.titulo ? d.excursao.titulo : 'N/D');
    document.getElementById('modalBody').innerHTML =
      '<div class="detail-section">' +
        '<h4>Dados do Pedido</h4>' +
        '<div class="detail-row"><span class="detail-label">Viagem:</span><span>' + escapeHtml(d.excursao && d.excursao.titulo ? d.excursao.titulo : '-') + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">Quantidade:</span><span>' + d.quantidade + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">Valor unitário:</span><span>' + formatMoney(d.valorUnitario) + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">Valor total:</span><span>' + formatMoney(d.valorTotal) + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">Status:</span><span>' + escapeHtml(d.statusLabel || d.status) + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">Data pedido:</span><span>' + formatDate(d.createdAt) + '</span></div>' +
      '</div>' +
      '<div class="detail-section">' +
        '<h4>Cliente</h4>' +
        '<div class="detail-row"><span class="detail-label">Nome:</span><span>' + escapeHtml(d.cliente && d.cliente.nome ? d.cliente.nome : '-') + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">E-mail:</span><span>' + escapeHtml(d.cliente && d.cliente.email ? d.cliente.email : '-') + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">Telefone:</span><span>' + escapeHtml(d.cliente && d.cliente.telefone ? d.cliente.telefone : '-') + '</span></div>' +
      '</div>' +
      '<div class="detail-section">' +
        '<h4>Passageiros (' + (d.passageiros ? d.passageiros.length : 0) + ')</h4>' +
        passageirosHtml +
      '</div>';

    document.getElementById('modalDetalhes').style.display = 'flex';
  } catch (error) {
    console.error('[Listagem Convencional] Erro ao abrir detalhes:', error);
    if (typeof showToast === 'function') showToast('Erro ao carregar detalhes', 'error');
    else alert('Erro ao carregar detalhes.');
  }
}

/**
 * Explicação da função [closeModal]
 * Fecha o modal de detalhes
 */
function closeModal() {
  document.getElementById('modalDetalhes').style.display = 'none';
}

/**
 * Explicação da função [deletePedido]
 * Exclui um pedido após confirmação
 */
function deletePedido(pedidoId, titulo) {
  if (!confirm('Excluir o pedido "' + (titulo || 'N/D') + '"? Esta ação não pode ser desfeita.')) {
    return;
  }
  const doDelete = async () => {
    try {
      const token = typeof AuthManager !== 'undefined' ? AuthManager.getToken() : localStorage.getItem('avorar_token');
      const response = await fetch(API_BASE + '/' + encodeURIComponent(pedidoId), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || 'Erro ao excluir');
      }

      if (typeof showToast === 'function') showToast('Pedido excluído com sucesso', 'success');
      else alert('Pedido excluído com sucesso.');
      loadPedidos();
    } catch (error) {
      console.error('[Listagem Convencional] Erro ao excluir:', error);
      if (typeof showToast === 'function') showToast(error.message || 'Erro ao excluir', 'error');
      else alert(error.message || 'Erro ao excluir.');
    }
  };
  doDelete();
}

/**
 * Explicação da função [exportarExcel]
 * Faz download do arquivo Excel com todos os pedidos convencionais
 */
async function exportarExcel() {
  try {
    const token = typeof AuthManager !== 'undefined' ? AuthManager.getToken() : localStorage.getItem('avorar_token');
    const response = await fetch(API_BASE + '/exportar', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Erro ao exportar');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'listagem_convencional_' + new Date().toISOString().split('T')[0] + '.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    if (typeof showToast === 'function') showToast('Exportação concluída', 'success');
  } catch (error) {
    console.error('[Listagem Convencional] Erro ao exportar:', error);
    if (typeof showToast === 'function') showToast('Erro ao exportar', 'error');
    else alert('Erro ao exportar.');
  }
}

/**
 * Explicação da função [limparFiltros]
 * Reseta todos os filtros e re-renderiza a tabela.
 */
function limparFiltros() {
  document.getElementById('filtroDataDe').value = '';
  document.getElementById('filtroDataAte').value = '';
  document.getElementById('filtroExcursao').value = '';
  document.getElementById('filtroPagamento').value = '';
  renderTable();
}

// Inicialização
document.addEventListener('DOMContentLoaded', function () {
  loadPedidos();

  document.getElementById('btnExportar').addEventListener('click', exportarExcel);
  document.getElementById('btnFecharModal').addEventListener('click', closeModal);
  document.getElementById('modalDetalhes').addEventListener('click', function (e) {
    if (e.target === this) closeModal();
  });
  document.getElementById('btnLimparFiltros').addEventListener('click', limparFiltros);
  ['filtroDataDe', 'filtroDataAte', 'filtroExcursao', 'filtroPagamento'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', renderTable);
  });
});

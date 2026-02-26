/**
 * Explicação do Arquivo [listas.js]
 * 
 * Gerencia a interface de listas de alunos por excursão pedagógica.
 * Permite visualizar excursões, seus alunos e exportar para Excel.
 * 
 * Funcionalidades:
 * - Listar excursões pedagógicas com estatísticas de alunos
 * - Visualizar lista de alunos de uma excursão específica
 * - Filtrar alunos por status do pedido
 * - Exportar lista de alunos em Excel
 */

// Estado da aplicação
let currentExcursaoId = null;
let excursoesData = [];
let alunosData = [];

/**
 * Explicação da função [loadExcursoes]
 * Carrega lista de excursões pedagógicas com contagem de alunos
 */
async function loadExcursoes() {
    try {
        const filterStatus = document.getElementById('filterStatus').value;
        const params = new URLSearchParams();
        if (filterStatus) params.append('status', filterStatus);

        console.log('[Listas] Carregando excursões pedagógicas...');

        const token = (typeof AuthManager !== 'undefined' ? AuthManager.getToken() : localStorage.getItem('avorar_token'));
        if (!token) {
            console.error('[Listas] Token não encontrado');
            window.location.href = 'login.html';
            return;
        }

        const response = await fetch(`/api/admin/listas/excursoes?${params.toString()}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                console.error('[Listas] Não autorizado');
                window.location.href = 'login.html';
                return;
            }
            throw new Error(`Erro ao carregar excursões: ${response.status}`);
        }

        const result = await response.json();
        excursoesData = result.data;

        console.log('[Listas] Excursões carregadas:', excursoesData.length);
        renderExcursoes();
    } catch (error) {
        console.error('[Listas] Erro ao carregar excursões:', error);
        showError('Erro ao carregar excursões. Tente novamente.');
    }
}

/**
 * Explicação da função [renderExcursoes]
 * Renderiza lista de excursões no DOM
 */
function renderExcursoes() {
    const container = document.getElementById('excursoesList');

    if (excursoesData.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <h3>Nenhum registro</h3>
                <p>Não há excursões pedagógicas com compras ainda.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = excursoesData.map(excursao => {
        const statusClass = excursao.status === 'ATIVO' ? 'badge-success' : 'badge-warning';
        
        // Monta badges de status de pedidos
        const statusBadges = Object.entries(excursao.statusPedidos || {})
            .filter(([_, count]) => count > 0)
            .map(([status, count]) => {
                const badgeClass = getStatusBadgeClass(status);
                return `<span class="badge ${badgeClass}">${formatStatusPedido(status)}: ${count}</span>`;
            })
            .join('');

        return `
            <div class="excursao-card">
                <div class="excursao-header">
                    <div class="excursao-info">
                        <h3>${escapeHtml(excursao.titulo)}</h3>
                        ${excursao.subtitulo ? `<p>${escapeHtml(excursao.subtitulo)}</p>` : ''}
                        <p><strong>Código:</strong> ${escapeHtml(excursao.codigo)}</p>
                        ${excursao.local ? `<p><i class="fas fa-map-marker-alt"></i> ${escapeHtml(excursao.local)}</p>` : ''}
                        ${excursao.horario ? `<p><i class="fas fa-clock"></i> ${escapeHtml(excursao.horario)}</p>` : ''}
                    </div>
                    <div>
                        <span class="badge ${statusClass}">${excursao.status}</span>
                    </div>
                </div>

                <div class="excursao-stats">
                    <div class="stat-item">
                        <div class="stat-value">${excursao.totalAlunos}</div>
                        <div class="stat-label">Total de Alunos</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${excursao.totalPedidos}</div>
                        <div class="stat-label">Total de Pedidos</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${excursao.alunosPorStatus?.PAGO || 0}</div>
                        <div class="stat-label">Alunos (Pago)</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${excursao.alunosPorStatus?.CONFIRMADO || 0}</div>
                        <div class="stat-label">Alunos (Confirmado)</div>
                    </div>
                </div>

                ${statusBadges ? `
                    <div class="status-badges">
                        ${statusBadges}
                    </div>
                ` : ''}

                <div style="display: flex; gap: 0.5rem; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--light-border);">
                    <button type="button" class="btn btn-primary btn-ver-alunos" data-excursao-id="${escapeHtml(excursao.id)}" style="flex: 1;">
                        <i class="fas fa-users"></i> Ver Alunos
                    </button>
                    <button type="button" class="btn btn-danger btn-deletar-excursao" data-excursao-id="${escapeHtml(excursao.id)}" data-excursao-titulo="${escapeHtml(excursao.titulo)}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Explicação da função [abrirListaAlunos]
 * Abre view de lista de alunos de uma excursão específica
 */
async function abrirListaAlunos(excursaoId) {
    console.log('[Listas] Abrindo lista de alunos para excursão:', excursaoId);
    
    currentExcursaoId = excursaoId;
    
    // Verifica se os elementos existem
    const excursoesView = document.getElementById('excursoesView');
    const alunosView = document.getElementById('alunosView');
    const pageTitle = document.getElementById('pageTitle');
    
    if (!excursoesView || !alunosView) {
        console.error('[Listas] Elementos de view não encontrados!');
        return;
    }
    
    // Esconde view de excursões e mostra view de alunos
    excursoesView.style.display = 'none';
    alunosView.style.display = 'block';
    
    if (pageTitle) {
        pageTitle.textContent = 'Lista de Alunos';
    }

    // Reseta filtro
    const filterStatus = document.getElementById('filterStatusPedido');
    if (filterStatus) {
        filterStatus.value = '';
    }

    console.log('[Listas] View de alunos exibida, carregando dados...');
    await loadAlunos();
}

/**
 * Explicação da função [loadAlunos]
 * Carrega lista de alunos da excursão selecionada
 */
async function loadAlunos() {
    if (!currentExcursaoId) {
        console.error('[Listas] Nenhuma excursão selecionada');
        return;
    }

    try {
        const filterStatusPedido = document.getElementById('filterStatusPedido').value;
        const params = new URLSearchParams();
        if (filterStatusPedido) params.append('statusPedido', filterStatusPedido);

        console.log('[Listas] Carregando alunos da excursão:', currentExcursaoId);

        const token = typeof AuthManager !== 'undefined' ? AuthManager.getToken() : localStorage.getItem('avorar_token');
        if (!token) {
            console.error('[Listas] Token não encontrado');
            window.location.href = 'login.html';
            return;
        }

        const response = await fetch(`/api/admin/listas/excursao/${currentExcursaoId}/alunos?${params.toString()}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                console.error('[Listas] Não autorizado');
                window.location.href = 'login.html';
                return;
            }
            throw new Error(`Erro ao carregar alunos: ${response.status}`);
        }

        const result = await response.json();
        alunosData = result.data.alunos;

        console.log('[Listas] Alunos carregados:', alunosData.length);

        // Atualiza cabeçalho
        document.getElementById('excursaoTitulo').textContent = result.data.excursao.titulo;
        document.getElementById('excursaoInfo').textContent = 
            `${result.data.totalAlunos} aluno(s) • ${result.data.totalPedidos} pedido(s) • Código: ${result.data.excursao.codigo}`;

        renderAlunos();
    } catch (error) {
        console.error('[Listas] Erro ao carregar alunos:', error);
        showError('Erro ao carregar alunos. Tente novamente.');
    }
}

/**
 * Explicação da função [renderAlunos]
 * Renderiza lista de alunos na tabela
 */
function renderAlunos() {
    const tbody = document.getElementById('alunosTableBody');

    if (alunosData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 3rem; color: var(--text-light);">
                    <i class="fas fa-inbox" style="font-size: 3rem; opacity: 0.5; display: block; margin-bottom: 1rem;"></i>
                    <strong>Nenhum registro</strong>
                    <p style="margin-top: 0.5rem;">Não há alunos para esta excursão com os filtros selecionados.</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = alunosData.map(aluno => {
        const statusClass = getStatusBadgeClass(aluno.statusPedido);
        const dataPedido = aluno.dataPedido ? formatDateBR(aluno.dataPedido) : '-';

        return `
            <tr>
                <td><strong>${escapeHtml(aluno.nomeAluno)}</strong></td>
                <td>${aluno.turma ? escapeHtml(aluno.turma) : '-'}</td>
                <td>${aluno.serieAluno ? escapeHtml(aluno.serieAluno) : '-'}</td>
                <td>${aluno.cpfAluno ? escapeHtml(aluno.cpfAluno) : '-'}</td>
                <td>${aluno.telefoneResponsavel ? escapeHtml(aluno.telefoneResponsavel) : '-'}</td>
                <td>
                    <span class="badge ${statusClass}">${formatStatusPedido(aluno.statusPedido)}</span>
                    ${aluno.statusPedido === 'AGUARDANDO_PAGAMENTO' ? '<br><small style="color: var(--text-light); font-size: 0.75rem;">1ª verificação em 3 min, depois a cada 4h. Use o botão Atualizar na página de listas para forçar.</small>' : ''}
                </td>
                <td>${dataPedido}</td>
                <td>
                    <button type="button" class="btn btn-sm btn-primary btn-enviar-email" data-pedido-id="${aluno.pedidoId}" data-aluno-nome="${escapeHtml(aluno.nomeAluno)}" title="Enviar e-mail de confirmação">
                        <i class="fas fa-envelope"></i> Enviar E-mail
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    // Anexar event listeners aos botões de envio
    attachEmailButtonListeners();
}

/**
 * Explicação da função [atualizarPagamentosTodas]
 * Consulta o Asaas para TODOS os pedidos de excursões pedagógicas em aguardando
 * pagamento e atualiza o status. Permite ao admin forçar a verificação imediata
 * de todas as listas sem aguardar o polling de 4 horas.
 */
async function atualizarPagamentosTodas() {
    const btn = document.getElementById('btnAtualizarPagamentosTodas');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Atualizando...';
    }

    try {
        const token = typeof AuthManager !== 'undefined' ? AuthManager.getToken() : localStorage.getItem('avorar_token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        console.log('[Listas] Atualizando pagamentos de todas as listas...');

        const response = await fetch('/api/admin/listas/atualizar-pagamentos-todas', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = 'login.html';
                return;
            }
            throw new Error('Erro ao atualizar pagamentos');
        }

        const result = await response.json();
        const { atualizados, total } = result.data || {};

        if (atualizados > 0) {
            showSuccess(`${atualizados} pedido(s) atualizado(s) para Pago em todas as listas.`);
        } else if (total === 0) {
            showSuccess('Nenhum pedido aguardando pagamento para verificar.');
        } else {
            showSuccess('Nenhum pagamento novo confirmado no Asaas.');
        }

        await loadExcursoes();
        if (currentExcursaoId) {
            await loadAlunos();
        }
    } catch (error) {
        console.error('[Listas] Erro ao atualizar pagamentos:', error);
        showError('Erro ao atualizar pagamentos. Tente novamente.');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-sync-alt"></i> Atualizar';
        }
    }
}

/**
 * Explicação da função [voltarParaExcursoes]
 * Volta para view de lista de excursões
 */
function voltarParaExcursoes(event) {
    if (event) event.preventDefault();
    
    currentExcursaoId = null;
    alunosData = [];

    document.getElementById('alunosView').style.display = 'none';
    document.getElementById('excursoesView').style.display = 'block';
    document.getElementById('pageTitle').textContent = 'Listas de Alunos';
}

/**
 * Explicação da função [exportarExtracaoCompleta]
 * Exporta TODAS as informações preenchidas no ato da compra: dados do aluno,
 * informações médicas, dados do pedido, cliente e responsável financeiro.
 */
async function exportarExtracaoCompleta() {
    if (!currentExcursaoId) {
        console.error('[Listas] Nenhuma excursão selecionada');
        return;
    }

    try {
        const filterStatusPedido = document.getElementById('filterStatusPedido').value;
        const params = new URLSearchParams();
        if (filterStatusPedido) params.append('statusPedido', filterStatusPedido);

        console.log('[Listas] Exportando extração completa da excursão:', currentExcursaoId);

        const btn = document.getElementById('btnExtracaoCompleta');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando...';

        const token = typeof AuthManager !== 'undefined' ? AuthManager.getToken() : localStorage.getItem('avorar_token');
        if (!token) {
            console.error('[Listas] Token não encontrado');
            window.location.href = 'login.html';
            return;
        }

        const response = await fetch(`/api/admin/listas/excursao/${currentExcursaoId}/exportar-completa?${params.toString()}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                console.error('[Listas] Não autorizado');
                window.location.href = 'login.html';
                return;
            }
            throw new Error(`Erro ao exportar Excel: ${response.status}`);
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = 'extracao_completa.xlsx';
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
            if (filenameMatch) filename = filenameMatch[1];
        }

        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        console.log('[Listas] Extração completa exportada com sucesso');
        showSuccess('Extração completa exportada com sucesso!');

    } catch (error) {
        console.error('[Listas] Erro ao exportar extração completa:', error);
        showError('Erro ao exportar extração completa. Tente novamente.');
    } finally {
        const btn = document.getElementById('btnExtracaoCompleta');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-file-medical-alt"></i> Extração Completa';
    }
}

/**
 * Explicação da função [exportarExcel]
 * Exporta lista de alunos para Excel
 */
async function exportarExcel() {
    if (!currentExcursaoId) {
        console.error('[Listas] Nenhuma excursão selecionada');
        return;
    }

    try {
        const filterStatusPedido = document.getElementById('filterStatusPedido').value;
        const params = new URLSearchParams();
        if (filterStatusPedido) params.append('statusPedido', filterStatusPedido);

        console.log('[Listas] Exportando Excel da excursão:', currentExcursaoId);

        const btn = document.getElementById('btnExportar');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando...';

        const token = typeof AuthManager !== 'undefined' ? AuthManager.getToken() : localStorage.getItem('avorar_token');
        if (!token) {
            console.error('[Listas] Token não encontrado');
            window.location.href = 'login.html';
            return;
        }

        const response = await fetch(`/api/admin/listas/excursao/${currentExcursaoId}/exportar?${params.toString()}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                console.error('[Listas] Não autorizado');
                window.location.href = 'login.html';
                return;
            }
            throw new Error(`Erro ao exportar Excel: ${response.status}`);
        }

        // Faz download do arquivo
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // Extrai nome do arquivo do header Content-Disposition
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = 'lista_alunos.xlsx';
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
            if (filenameMatch) filename = filenameMatch[1];
        }
        
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        console.log('[Listas] Excel exportado com sucesso');
        showSuccess('Excel exportado com sucesso!');

    } catch (error) {
        console.error('[Listas] Erro ao exportar Excel:', error);
        showError('Erro ao exportar Excel. Tente novamente.');
    } finally {
        const btn = document.getElementById('btnExportar');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-file-excel"></i> Exportar Excel';
    }
}

/**
 * Explicação da função [getStatusBadgeClass]
 * Retorna classe CSS do badge de acordo com o status
 */
function getStatusBadgeClass(status) {
    const classes = {
        'PAGO': 'badge-success',
        'CONFIRMADO': 'badge-success',
        'PENDENTE': 'badge-warning',
        'AGUARDANDO_PAGAMENTO': 'badge-info',
        'CANCELADO': 'badge-danger',
        'EXPIRADO': 'badge-secondary'
    };
    return classes[status] || 'badge-secondary';
}

/**
 * Explicação da função [formatStatusPedido]
 * Formata nome do status para exibição
 */
function formatStatusPedido(status) {
    const labels = {
        'PENDENTE': 'Pendente',
        'AGUARDANDO_PAGAMENTO': 'Aguardando Pagamento',
        'PAGO': 'Pago',
        'CONFIRMADO': 'Confirmado',
        'CANCELADO': 'Cancelado',
        'EXPIRADO': 'Expirado'
    };
    return labels[status] || status;
}

/**
 * Explicação da função [escapeHtml]
 * Escapa caracteres HTML para prevenir XSS
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Explicação da função [showError]
 * Exibe mensagem de erro ao usuário
 */
function showError(message) {
    alert(message); // TODO: Implementar toast/notification melhor
}

/**
 * Explicação da função [showSuccess]
 * Exibe mensagem de sucesso ao usuário
 */
function showSuccess(message) {
    alert(message); // TODO: Implementar toast/notification melhor
}

/**
 * Explicação da função [deletarExcursao]
 * Deleta uma excursão pedagógica após confirmação
 */
async function deletarExcursao(excursaoId, titulo) {
    if (!confirm(`Tem certeza que deseja deletar a excursão "${titulo}"?\n\nIsso também removerá todos os pedidos e alunos associados!`)) {
        return;
    }

    try {
        console.log('[Listas] Deletando excursão:', excursaoId);

        const token = typeof AuthManager !== 'undefined' ? AuthManager.getToken() : localStorage.getItem('avorar_token');
        if (!token) {
            console.error('[Listas] Token não encontrado');
            window.location.href = 'login.html';
            return;
        }

        const response = await fetch(`/api/excursoes-pedagogicas/${excursaoId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                console.error('[Listas] Não autorizado');
                window.location.href = 'login.html';
                return;
            }
            throw new Error(`Erro ao deletar excursão: ${response.status}`);
        }

        console.log('[Listas] Excursão deletada com sucesso');
        showSuccess('Excursão deletada com sucesso!');
        
        // Recarrega lista
        await loadExcursoes();
        
    } catch (error) {
        console.error('[Listas] Erro ao deletar excursão:', error);
        showError('Erro ao deletar excursão. Tente novamente.');
    }
}

/**
 * Explicação da função [attachEmailButtonListeners]
 * Anexa event listeners aos botões de envio de e-mail na tabela de alunos
 */
function attachEmailButtonListeners() {
    const btnsEnviar = document.querySelectorAll('.btn-enviar-email');
    btnsEnviar.forEach(btn => {
        btn.addEventListener('click', async function() {
            const pedidoId = this.getAttribute('data-pedido-id');
            const alunoNome = this.getAttribute('data-aluno-nome');
            
            if (!pedidoId) {
                showError('ID do pedido não encontrado');
                return;
            }

            if (confirm(`Deseja enviar o e-mail de confirmação para o pedido de ${alunoNome}?`)) {
                await enviarEmailManual(pedidoId, this);
            }
        });
    });
}

/**
 * Explicação da função [enviarEmailManual]
 * Envia manualmente o e-mail de confirmação de inscrição para um pedido específico.
 * Usa o mesmo template que é enviado automaticamente após pagamento confirmado.
 */
async function enviarEmailManual(pedidoId, btnElement) {
    const textoOriginal = btnElement.innerHTML;
    btnElement.disabled = true;
    btnElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

    try {
        const token = typeof AuthManager !== 'undefined' ? AuthManager.getToken() : localStorage.getItem('avorar_token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        const response = await fetch(`/api/admin/pedidos/${pedidoId}/enviar-email`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || result.error || 'Erro ao enviar e-mail');
        }

        if (result.success) {
            showSuccess(result.message || 'E-mail enviado com sucesso!');
        } else {
            throw new Error(result.message || 'Falha ao enviar e-mail');
        }
    } catch (error) {
        console.error('[Listas] Erro ao enviar e-mail:', error);
        showError(error.message || 'Erro ao enviar e-mail. Tente novamente.');
    } finally {
        btnElement.disabled = false;
        btnElement.innerHTML = textoOriginal;
    }
}

/**
 * Explicação da função [showSuccess]
 * Exibe mensagem de sucesso (toast verde)
 */
function showSuccess(message) {
    if (typeof window.showToast === 'function') {
        window.showToast(message, 'success');
    } else {
        alert(message);
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    console.log('[Listas] Inicializando página de listas...');

    // Event delegation para botões dos cards (CSP não permite onclick inline)
    const excursoesList = document.getElementById('excursoesList');
    if (excursoesList) {
        excursoesList.addEventListener('click', function (e) {
            const btnVer = e.target.closest('.btn-ver-alunos');
            const btnDeletar = e.target.closest('.btn-deletar-excursao');
            if (btnVer) {
                e.preventDefault();
                const id = btnVer.getAttribute('data-excursao-id');
                if (id) abrirListaAlunos(id);
            } else if (btnDeletar) {
                e.preventDefault();
                const id = btnDeletar.getAttribute('data-excursao-id');
                const titulo = btnDeletar.getAttribute('data-excursao-titulo') || '';
                if (id) deletarExcursao(id, titulo);
            }
        });
    }

    // Filtros e botões (sem inline handlers por CSP)
    const filterStatus = document.getElementById('filterStatus');
    if (filterStatus) filterStatus.addEventListener('change', loadExcursoes);

    const btnVoltar = document.getElementById('btnVoltarExcursoes');
    if (btnVoltar) btnVoltar.addEventListener('click', function (e) { e.preventDefault(); voltarParaExcursoes(e); });

    const btnExportar = document.getElementById('btnExportar');
    if (btnExportar) btnExportar.addEventListener('click', exportarExcel);

    const btnExtracaoCompleta = document.getElementById('btnExtracaoCompleta');
    if (btnExtracaoCompleta) btnExtracaoCompleta.addEventListener('click', exportarExtracaoCompleta);

    const btnAtualizarPagamentosTodas = document.getElementById('btnAtualizarPagamentosTodas');
    if (btnAtualizarPagamentosTodas) btnAtualizarPagamentosTodas.addEventListener('click', atualizarPagamentosTodas);

    const filterStatusPedido = document.getElementById('filterStatusPedido');
    if (filterStatusPedido) filterStatusPedido.addEventListener('change', loadAlunos);

    loadExcursoes();

    // Mostrar botão de toggle em mobile
    if (window.innerWidth <= 768) {
        document.getElementById('sidebarToggle').style.display = 'inline-block';
    }

    window.addEventListener('resize', function() {
        if (window.innerWidth <= 768) {
            document.getElementById('sidebarToggle').style.display = 'inline-block';
        } else {
            document.getElementById('sidebarToggle').style.display = 'none';
        }
    });
});

/**
 * Explicação do Arquivo [listas.js]
 * 
 * Gerencia a interface de listas de alunos por excursão pedagógica.
 * Permite visualizar excursões, seus alunos e exportar para Excel.
 * 
 * Funcionalidades:
 * - Listar excursões pedagógicas com estatísticas de alunos
 * - Pesquisa e filtros: nome, código, localidade, status, data, horário, data de registro
 * - Visualizar lista de alunos de uma excursão específica
 * - Filtrar alunos por status do pedido
 * - Exportar lista de alunos em Excel
 */

// Estado da aplicação
let currentExcursaoId = null;
let currentExcursaoCodigo = '';
let excursoesData = [];
let alunosData = [];

const apiUrl = (window.location.hostname === 'localhost' ? 'http://localhost:3001/api' : window.location.origin + '/api');

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

        const response = await fetch(`${apiUrl}/admin/listas/excursoes?${params.toString()}`, {
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
 * Explicação da função [getFilteredExcursoes]
 * Aplica filtros client-side (pesquisa, data, horário, data de registro) sobre excursoesData.
 * O filtro de status é aplicado no servidor via loadExcursoes.
 */
function getFilteredExcursoes() {
    const searchText = (document.getElementById('searchInput')?.value || '').trim().toLowerCase();
    const filterData = document.getElementById('filterData')?.value || '';
    const filterHorario = (document.getElementById('filterHorario')?.value || '').trim().toLowerCase();
    const filterDataRegistro = document.getElementById('filterDataRegistro')?.value || '';

    return excursoesData.filter(excursao => {
        if (searchText) {
            const titulo = (excursao.titulo || '').toLowerCase();
            const subtitulo = (excursao.subtitulo || '').toLowerCase();
            const codigo = (excursao.codigo || '').toLowerCase();
            const local = (excursao.local || '').toLowerCase();
            const matchSearch = titulo.includes(searchText) || subtitulo.includes(searchText) ||
                codigo.includes(searchText) || local.includes(searchText);
            if (!matchSearch) return false;
        }

        if (filterData && excursao.dataDestino) {
            const dataDestStr = excursao.dataDestino instanceof Date
                ? excursao.dataDestino.toISOString().split('T')[0]
                : String(excursao.dataDestino).split('T')[0];
            if (dataDestStr !== filterData) return false;
        } else if (filterData && !excursao.dataDestino) {
            return false;
        }

        if (filterHorario && excursao.horario) {
            if (!String(excursao.horario).toLowerCase().includes(filterHorario)) return false;
        } else if (filterHorario && !excursao.horario) {
            return false;
        }

        if (filterDataRegistro && excursao.createdAt) {
            const createdAtStr = excursao.createdAt instanceof Date
                ? excursao.createdAt.toISOString().split('T')[0]
                : String(excursao.createdAt).split('T')[0];
            if (createdAtStr !== filterDataRegistro) return false;
        } else if (filterDataRegistro && !excursao.createdAt) {
            return false;
        }

        return true;
    });
}

/**
 * Explicação da função [limparFiltros]
 * Limpa todos os campos de busca e filtros client-side, mantendo apenas o status.
 */
function limparFiltros() {
    const searchInput = document.getElementById('searchInput');
    const filterData = document.getElementById('filterData');
    const filterHorario = document.getElementById('filterHorario');
    const filterDataRegistro = document.getElementById('filterDataRegistro');
    if (searchInput) searchInput.value = '';
    if (filterData) filterData.value = '';
    if (filterHorario) filterHorario.value = '';
    if (filterDataRegistro) filterDataRegistro.value = '';
    renderExcursoes();
    console.log('[Listas] Filtros de pesquisa e data limpos');
}

/**
 * Explicação da função [renderExcursoes]
 * Renderiza lista de excursões no DOM
 */
function renderExcursoes() {
    const container = document.getElementById('excursoesList');
    const filtered = getFilteredExcursoes();

    if (filtered.length === 0) {
        const hasFilters = document.getElementById('searchInput')?.value?.trim() ||
            document.getElementById('filterData')?.value ||
            document.getElementById('filterHorario')?.value?.trim() ||
            document.getElementById('filterDataRegistro')?.value;
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-${hasFilters ? 'search' : 'inbox'}"></i>
                <h3>${hasFilters ? 'Nenhum resultado' : 'Nenhum registro'}</h3>
                <p>${hasFilters ? 'Nenhuma excursão encontrada com os filtros aplicados. Tente ajustar os critérios.' : 'Não há excursões pedagógicas com compras ainda.'}</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map(excursao => {
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
                        <div class="stat-value">${excursao.alunosInscritos || 0}</div>
                        <div class="stat-label">Alunos Inscritos (PIX + Cartão de Crédito)</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${excursao.totalPedidosAtivos || 0}</div>
                        <div class="stat-label">Total de Pedidos</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${excursao.alunosPix || 0}</div>
                        <div class="stat-label">Pagamentos PIX</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${excursao.alunosCartao || 0}</div>
                        <div class="stat-label">Pagamentos Cartão de Crédito</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${excursao.vagas ? `${excursao.totalAlunosAtivos || 0}/${excursao.vagas}` : 'Não'}</div>
                        <div class="stat-label">Limite de Vagas</div>
                    </div>
                </div>

                ${statusBadges ? `
                    <div class="status-badges">
                        ${statusBadges}
                    </div>
                ` : ''}

                <div class="excursao-card-actions">
                    <button type="button" class="btn btn-primary btn-sm btn-ver-alunos" data-excursao-id="${escapeHtml(excursao.id)}">
                        <i class="fas fa-users"></i> Ver Alunos
                    </button>
                    <button type="button" class="btn btn-success btn-sm btn-exportar-excel-card" data-excursao-id="${escapeHtml(excursao.id)}" data-excursao-codigo="${escapeHtml(excursao.codigo)}" title="Exportar Excel (apenas pagamento confirmado)">
                        <i class="fas fa-file-excel"></i> Exportar Excel
                    </button>
                    <button type="button" class="btn btn-primary btn-sm btn-extracao-completa-card" data-excursao-id="${escapeHtml(excursao.id)}" data-excursao-codigo="${escapeHtml(excursao.codigo)}" title="Extração completa (apenas pagamento confirmado)">
                        <i class="fas fa-file-medical-alt"></i> Extração Completa
                    </button>
                    <button type="button" class="btn btn-danger btn-sm btn-exportar-cancelados-card" data-excursao-id="${escapeHtml(excursao.id)}" data-excursao-codigo="${escapeHtml(excursao.codigo)}" title="Exportar pedidos cancelados">
                        <i class="fas fa-file-excel"></i> Cancelados
                    </button>
                    <button type="button" class="btn btn-info btn-sm btn-exportar-escola-card" data-excursao-id="${escapeHtml(excursao.id)}" data-excursao-titulo="${escapeHtml(excursao.titulo)}" title="Lista para Escola" style="background-color: #6f42c1; border-color: #6f42c1; color: white;">
                        <i class="fas fa-school"></i> Escola
                    </button>
                    <button type="button" class="btn btn-danger btn-sm btn-deletar-excursao" data-excursao-id="${escapeHtml(excursao.id)}" data-excursao-titulo="${escapeHtml(excursao.titulo)}">
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

        const response = await fetch(`${apiUrl}/admin/listas/excursao/${currentExcursaoId}/alunos?${params.toString()}`, {
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

        // Atualiza cabeçalho e código para nome do arquivo de exportação
        currentExcursaoCodigo = result.data.excursao.codigo || 'lista';
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

    tbody.innerHTML = alunosData.map((aluno, index) => {
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
                    <div class="table-actions">
                        <button type="button" class="btn btn-sm btn-outline-primary btn-enviar-email" data-pedido-id="${aluno.pedidoId}" data-aluno-nome="${escapeHtml(aluno.nomeAluno)}" title="Enviar e-mail de confirmação">
                            <i class="fas fa-envelope"></i>
                        </button>
                        <button type="button" class="btn btn-sm btn-secondary btn-detalhes-aluno" data-aluno-index="${index}" title="Ver detalhes completos do aluno">
                            <i class="fas fa-user"></i>
                        </button>
                        <button type="button" class="btn btn-sm btn-danger btn-deletar-aluno" data-aluno-id="${aluno.id}" data-aluno-nome="${escapeHtml(aluno.nomeAluno)}" title="Excluir aluno da lista">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    // Anexar event listeners aos botões
    attachEmailButtonListeners();
    attachDetalhesButtonListeners();
    attachDeletarButtonListeners();
}

/**
 * Explicação da função [attachDetalhesButtonListeners]
 * Conecta os botões "Detalhes" de cada aluno ao modal de informações completas.
 */
function attachDetalhesButtonListeners() {
    console.log('[Listas] Anexando listeners de detalhes de aluno...');
    const btnsDetalhes = document.querySelectorAll('.btn-detalhes-aluno');
    btnsDetalhes.forEach(btn => {
        btn.addEventListener('click', function () {
            const indexStr = this.getAttribute('data-aluno-index');
            const index = typeof indexStr === 'string' ? parseInt(indexStr, 10) : NaN;
            if (Number.isNaN(index) || !alunosData[index]) {
                showError('Não foi possível localizar os dados completos deste aluno.');
                console.error('[Listas] Índice de aluno inválido ao abrir detalhes:', indexStr);
                return;
            }
            abrirDetalhesAluno(index);
        });
    });
}

/**
 * Explicação da função [attachDeletarButtonListeners]
 * Conecta os botões de exclusão de aluno.
 */
function attachDeletarButtonListeners() {
    const btnsDeletar = document.querySelectorAll('.btn-deletar-aluno');
    btnsDeletar.forEach(btn => {
        btn.addEventListener('click', function () {
            const alunoId = this.getAttribute('data-aluno-id');
            const nomeAluno = this.getAttribute('data-aluno-nome');
            if (alunoId) {
                deletarAluno(alunoId, nomeAluno);
            }
        });
    });
}

/**
 * Explicação da função [deletarAluno]
 * Realiza a exclusão de um aluno da lista após confirmação.
 */
async function deletarAluno(alunoId, nomeAluno) {
    if (!confirm(`Tem certeza que deseja remover o aluno "${nomeAluno}" desta lista?\n\nEsta ação não pode ser desfeita!`)) {
        return;
    }

    try {
        console.log('[Listas] Deletando aluno:', alunoId);

        const token = typeof AuthManager !== 'undefined' ? AuthManager.getToken() : localStorage.getItem('avorar_token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        const response = await fetch(`${apiUrl}/admin/listas/aluno/${alunoId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const result = await response.json().catch(() => ({}));
            throw new Error(result.message || `Erro ao deletar aluno: ${response.status}`);
        }

        console.log('[Listas] Aluno deletado com sucesso');
        showSuccess('Aluno removido com sucesso!');

        // Recarrega a lista de alunos e a lista de excursões (para atualizar contagem)
        await loadAlunos();
        await loadExcursoes();

    } catch (error) {
        console.error('[Listas] Erro ao deletar aluno:', error);
        showError(error.message || 'Erro ao deletar aluno. Tente novamente.');
    }
}

/**
 * Explicação da função [abrirDetalhesAluno]
 * Monta e exibe o modal com todas as informações registradas do aluno selecionado.
 */
function abrirDetalhesAluno(alunoIndex) {
    const aluno = alunosData[alunoIndex];
    if (!aluno) {
        showError('Dados do aluno não encontrados.');
        console.error('[Listas] Dados do aluno não encontrados para índice:', alunoIndex);
        return;
    }

    console.log('[Listas] Abrindo detalhes do aluno:', {
        index: alunoIndex,
        nome: aluno.nomeAluno,
        pedidoId: aluno.pedidoId
    });

    const tituloEl = document.getElementById('modalAlunoDetalhesTitulo');
    const bodyEl = document.getElementById('modalAlunoDetalhesBody');
    if (!tituloEl || !bodyEl) {
        console.error('[Listas] Elementos do modal de detalhes de aluno não encontrados.');
        showError('Não foi possível abrir os detalhes do aluno.');
        return;
    }

    const safe = (value) => (value ? escapeHtml(String(value)) : '-');
    const safeDate = (value) => (value ? formatDateBR(value) : '-');

    tituloEl.textContent = aluno.nomeAluno ? `Detalhes de ${aluno.nomeAluno}` : 'Detalhes do Aluno';

    const cliente = aluno.cliente || {};

    bodyEl.innerHTML = `
        <div class="detail-section">
            <h4>Dados do Aluno</h4>
            <div class="detail-row"><span class="detail-label">Nome:</span><span>${safe(aluno.nomeAluno)}</span></div>
            <div class="detail-row"><span class="detail-label">Idade:</span><span>${safe(aluno.idadeAluno)}</span></div>
            <div class="detail-row"><span class="detail-label">Data de Nascimento:</span><span>${safeDate(aluno.dataNascimento)}</span></div>
            <div class="detail-row"><span class="detail-label">Escola:</span><span>${safe(aluno.escolaAluno)}</span></div>
            <div class="detail-row"><span class="detail-label">Série:</span><span>${safe(aluno.serieAluno)}</span></div>
            <div class="detail-row"><span class="detail-label">Turma:</span><span>${safe(aluno.turma)}</span></div>
            <div class="detail-row"><span class="detail-label">Unidade do Colégio:</span><span>${safe(aluno.unidadeColegio)}</span></div>
            <div class="detail-row"><span class="detail-label">CPF:</span><span>${safe(aluno.cpfAluno)}</span></div>
            <div class="detail-row"><span class="detail-label">RG:</span><span>${safe(aluno.rgAluno)}</span></div>
        </div>

        <div class="detail-section">
            <h4>Responsável</h4>
            <div class="detail-row"><span class="detail-label">Nome:</span><span>${safe(aluno.responsavel)}</span></div>
            <div class="detail-row"><span class="detail-label">Telefone:</span><span>${safe(aluno.telefoneResponsavel)}</span></div>
            <div class="detail-row"><span class="detail-label">E-mail:</span><span>${safe(aluno.emailResponsavel)}</span></div>
            <div class="detail-row"><span class="detail-label">Observações:</span><span>${safe(aluno.observacoes)}</span></div>
        </div>

        <div class="detail-section">
            <h4>Informações Médicas</h4>
            <div class="detail-row"><span class="detail-label">Alergias/Cuidados:</span><span>${safe(aluno.alergiasCuidados)}</span></div>
            <div class="detail-row"><span class="detail-label">Plano de Saúde:</span><span>${safe(aluno.planoSaude)}</span></div>
            <div class="detail-row"><span class="detail-label">Medicamentos para Febre:</span><span>${safe(aluno.medicamentosFebre)}</span></div>
            <div class="detail-row"><span class="detail-label">Medicamentos para Alergia:</span><span>${safe(aluno.medicamentosAlergia)}</span></div>
        </div>

        <div class="detail-section">
            <h4>Dados do Pedido</h4>
            <div class="detail-row"><span class="detail-label">ID do Pedido:</span><span>${safe(aluno.pedidoId)}</span></div>
            <div class="detail-row"><span class="detail-label">Status do Pedido:</span><span>${safe(formatStatusPedido(aluno.statusPedido))}</span></div>
            <div class="detail-row"><span class="detail-label">Data do Pedido:</span><span>${safeDate(aluno.dataPedido)}</span></div>
            <div class="detail-row"><span class="detail-label">Data de Pagamento:</span><span>${safeDate(aluno.dataPagamento)}</span></div>
            <div class="detail-row"><span class="detail-label">Data de Confirmação:</span><span>${safeDate(aluno.dataConfirmacao)}</span></div>
            <div class="detail-row"><span class="detail-label">Valor Unitário:</span><span>${aluno.valorUnitario != null ? escapeHtml(String(aluno.valorUnitario.toFixed ? aluno.valorUnitario.toFixed(2) : aluno.valorUnitario)) : '-'}</span></div>
        </div>

        <div class="detail-section">
            <h4>Cliente (Comprador)</h4>
            <div class="detail-row"><span class="detail-label">Nome:</span><span>${safe(cliente.nome)}</span></div>
            <div class="detail-row"><span class="detail-label">E-mail:</span><span>${safe(cliente.email)}</span></div>
            <div class="detail-row"><span class="detail-label">Telefone:</span><span>${safe(cliente.telefone)}</span></div>
        </div>
    `;

    if (typeof openModal === 'function') {
        openModal('modalAlunoDetalhes');
    } else {
        const overlay = document.getElementById('modalAlunoDetalhes');
        if (overlay) {
            overlay.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    }
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
    currentExcursaoCodigo = '';
    alunosData = [];

    document.getElementById('alunosView').style.display = 'none';
    document.getElementById('excursoesView').style.display = 'block';
    document.getElementById('pageTitle').textContent = 'Listas de Alunos';
}

/**
 * Explicação da função [exportarExtracaoCompleta]
 * Exporta TODAS as informações preenchidas no ato da compra: dados do aluno,
 * informações médicas, dados do pedido, cliente e responsável financeiro.
 * Aceita excursaoId/codigo opcionais para uso nos cards da página inicial.
 */
async function exportarExtracaoCompleta(opts = {}) {
    const excursaoId = opts.excursaoId ?? currentExcursaoId;
    const codigo = opts.codigo ?? currentExcursaoCodigo;
    const btn = opts.button ?? document.getElementById('btnExtracaoCompleta');

    if (!excursaoId) {
        console.error('[Listas] Nenhuma excursão selecionada');
        return;
    }

    try {
        console.log('[Listas] Exportando extração completa da excursão (apenas pagamento confirmado):', excursaoId);

        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando...';
        }

        const token = typeof AuthManager !== 'undefined' ? AuthManager.getToken() : localStorage.getItem('avorar_token');
        if (!token) {
            console.error('[Listas] Token não encontrado');
            window.location.href = 'login.html';
            return;
        }

        const response = await fetch(`${apiUrl}/admin/listas/excursao/${excursaoId}/exportar-completa`, {
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

        const hoje = new Date().toISOString().split('T')[0];
        const filename = `extracao_completa_${codigo}_${hoje}.xlsx`;

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
        const resetBtn = opts.button ?? document.getElementById('btnExtracaoCompleta');
        if (resetBtn) {
            resetBtn.disabled = false;
            resetBtn.innerHTML = '<i class="fas fa-file-medical-alt"></i> Extração Completa';
        }
    }
}

/**
 * Explicação da função [exportarExcel]
 * Exporta lista de alunos para Excel.
 * Aceita excursaoId/codigo opcionais para uso nos cards da página inicial.
 */
async function exportarExcel(opts = {}) {
    const excursaoId = opts.excursaoId ?? currentExcursaoId;
    const codigo = opts.codigo ?? currentExcursaoCodigo;
    const btn = opts.button ?? document.getElementById('btnExportar');

    if (!excursaoId) {
        console.error('[Listas] Nenhuma excursão selecionada');
        return;
    }

    try {
        console.log('[Listas] Exportando Excel da excursão (apenas pagamento confirmado):', excursaoId);

        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando...';
        }

        const token = typeof AuthManager !== 'undefined' ? AuthManager.getToken() : localStorage.getItem('avorar_token');
        if (!token) {
            console.error('[Listas] Token não encontrado');
            window.location.href = 'login.html';
            return;
        }

        const response = await fetch(`/api/admin/listas/excursao/${excursaoId}/exportar`, {
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

        // Faz download do arquivo (nome gerado no cliente para evitar .xlsx_ de proxies)
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        const hoje = new Date().toISOString().split('T')[0];
        const filename = `lista_${codigo}_${hoje}.xlsx`;

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
        const resetBtn = opts.button ?? document.getElementById('btnExportar');
        if (resetBtn) {
            resetBtn.disabled = false;
            resetBtn.innerHTML = '<i class="fas fa-file-excel"></i> Exportar Excel';
        }
    }
}

/**
 * Explicação da função [exportarCancelados]
 * Exporta apenas pedidos com status CANCELADO para Excel.
 * Aceita excursaoId/codigo opcionais para uso nos cards da página inicial.
 */
async function exportarCancelados(opts = {}) {
    const excursaoId = opts.excursaoId ?? currentExcursaoId;
    const codigo = opts.codigo ?? currentExcursaoCodigo;
    const btn = opts.button ?? document.getElementById('btnExportarCancelados');

    if (!excursaoId) {
        console.error('[Listas] Nenhuma excursão selecionada');
        return;
    }

    try {
        console.log('[Listas] Exportando Excel de pedidos cancelados:', excursaoId);

        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando...';
        }

        const token = typeof AuthManager !== 'undefined' ? AuthManager.getToken() : localStorage.getItem('avorar_token');
        if (!token) {
            console.error('[Listas] Token não encontrado');
            window.location.href = 'login.html';
            return;
        }

        const response = await fetch(`${apiUrl}/admin/listas/excursao/${excursaoId}/exportar-cancelados`, {
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
            const errorResult = await response.json().catch(() => ({}));
            throw new Error(errorResult.message || `Erro ao exportar Excel: ${response.status}`);
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        const hoje = new Date().toISOString().split('T')[0];
        const filename = `cancelados_${codigo}_${hoje}.xlsx`;

        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        console.log('[Listas] Excel de cancelados exportado com sucesso');
        showSuccess('Excel de cancelados exportado com sucesso!');

    } catch (error) {
        console.error('[Listas] Erro ao exportar cancelados:', error);
        showError(error.message || 'Erro ao exportar cancelados. Tente novamente.');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-file-excel"></i> Exportar Cancelados';
        }
    }
}

/**
 * Explicação da função [getStatusBadgeClass]
 * Retorna classe CSS do badge de acordo com o status
 */

/**
 * Explicação da função [exportarEscola]
 * Exporta Excel no formato específico para a escola
 */
async function exportarEscola(opts = {}) {
    const excursaoId = opts.excursaoId || currentExcursaoId;
    const btn = opts.button || (opts.excursaoId ? null : document.getElementById('btnExportarEscola'));

    if (!excursaoId) {
        showError('ID da excursão não encontrado para exportar');
        return;
    }

    const originalHTML = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando...';
    }

    try {
        console.log('[Listas] Exportando Excel para Escola da excursão:', excursaoId);

        const token = typeof AuthManager !== 'undefined' ? AuthManager.getToken() : localStorage.getItem('avorar_token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        const response = await fetch(`${apiUrl}/admin/listas/excursao/${excursaoId}/exportar-escola`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || 'Erro ao exportar Excel');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const titulo = opts.titulo || 'Escola';
        a.download = `Lista_Escola_${titulo.replace(/\s+/g, '_')}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        console.log('[Listas] Excel exportado com sucesso');

    } catch (error) {
        console.error('[Listas] Erro ao exportar Excel:', error);
        showError(error.message || 'Erro ao exportar Excel. Tente novamente.');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalHTML;
        }
    }
}
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
        btn.addEventListener('click', async function () {
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

/**
 * Explicação da função [abrirModalAdicionarAluno]
 * Limpa o formulário de cadastro, define o status inicial do pedido e exibe o modal de inclusão de aluno.
 */
function abrirModalAdicionarAluno() {
    console.log('[Listas] Abrindo modal Adicionar Aluno');
    const form = document.getElementById('formAdicionarAluno');
    if (form) form.reset();

    // Reset status do pedido para o padrão CONFIRMADO
    const selectStatus = document.getElementById('pedidoStatus');
    if (selectStatus) selectStatus.value = 'CONFIRMADO';

    if (typeof openModal === 'function') {
        openModal('modalAdicionarAluno');
    } else {
        const overlay = document.getElementById('modalAdicionarAluno');
        if (overlay) {
            overlay.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    }
}

/**
 * Explicação da função [fecharModalAdicionarAluno]
 * Oculta o modal de inclusão de aluno e restaura o overflow da página.
 */
function fecharModalAdicionarAluno() {
    console.log('[Listas] Fechando modal Adicionar Aluno');
    if (typeof closeModal === 'function') {
        closeModal('modalAdicionarAluno');
    } else {
        const overlay = document.getElementById('modalAdicionarAluno');
        if (overlay) {
            overlay.classList.add('hidden');
            document.body.style.overflow = '';
        }
    }
}

/**
 * Explicação da função [salvarNovoAluno]
 * Captura os dados do formulário de cadastro, estrutura o payload contendo informações do aluno, responsável financeiro e configurações de pedido, realiza a requisição POST para o backend e atualiza as tabelas em caso de sucesso.
 */
async function salvarNovoAluno(event) {
    if (event) event.preventDefault();

    if (!currentExcursaoId) {
        showError('Nenhuma excursão selecionada para adicionar o aluno.');
        return;
    }

    const btnSalvar = document.getElementById('btnConfirmarAdicionarAluno');
    const originalText = btnSalvar ? btnSalvar.innerHTML : 'Salvar Aluno';

    if (btnSalvar) {
        btnSalvar.disabled = true;
        btnSalvar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
    }

    try {
        const token = typeof AuthManager !== 'undefined' ? AuthManager.getToken() : localStorage.getItem('avorar_token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        // Helper to get val
        const val = (id) => {
            const el = document.getElementById(id);
            return el ? el.value.trim() : '';
        };

        const valOrUndefined = (id) => {
            const v = val(id);
            return v || undefined;
        };

        const valNumOrUndefined = (id) => {
            const v = val(id);
            if (!v) return undefined;
            const n = parseInt(v, 10);
            return isNaN(n) ? undefined : n;
        };

        const payload = {
            aluno: {
                nomeAluno: val('alunoNome'),
                idadeAluno: valNumOrUndefined('alunoIdade'),
                dataNascimento: valOrUndefined('alunoDataNascimento'),
                escolaAluno: valOrUndefined('alunoEscola'),
                serieAluno: valOrUndefined('alunoSerie'),
                turma: valOrUndefined('alunoTurma'),
                unidadeColegio: valOrUndefined('alunoUnidade'),
                cpfAluno: valOrUndefined('alunoCpf'),
                rgAluno: valOrUndefined('alunoRg'),
                alergiasCuidados: valOrUndefined('alunoAlergias'),
                planoSaude: valOrUndefined('alunoPlanoSaude'),
                medicamentosFebre: valOrUndefined('alunoMedicamentosFebre'),
                medicamentosAlergia: valOrUndefined('alunoMedicamentosAlergia'),
                observacoes: valOrUndefined('alunoObservacoes')
            },
            responsavel: {
                nome: val('respNome'),
                sobrenome: valOrUndefined('respSobrenome'),
                email: val('respEmail'),
                telefone: val('respTelefone'),
                cpf: val('respCpf'),
                cep: val('respCep'),
                endereco: val('respEndereco'),
                numero: val('respNumero'),
                cidade: val('respCidade'),
                estado: val('respEstado'),
                complemento: valOrUndefined('respComplemento'),
                bairro: valOrUndefined('respBairro')
            },
            statusPedido: val('pedidoStatus')
        };

        console.log('[Listas] Enviando dados para salvar aluno manually:', payload);

        const response = await fetch(`${apiUrl}/admin/listas/excursao/${currentExcursaoId}/aluno`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || result.error || 'Erro ao adicionar aluno');
        }

        console.log('[Listas] Aluno adicionado com sucesso:', result);
        showSuccess('Aluno adicionado com sucesso!');
        
        fecharModalAdicionarAluno();
        
        // Recarregar os dados
        await loadAlunos();
        await loadExcursoes();

    } catch (error) {
        console.error('[Listas] Erro ao adicionar aluno:', error);
        showError(error.message || 'Erro ao adicionar aluno. Verifique os dados e tente novamente.');
    } finally {
        if (btnSalvar) {
            btnSalvar.disabled = false;
            btnSalvar.innerHTML = originalText;
        }
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
            const btnExportar = e.target.closest('.btn-exportar-excel-card');
            const btnExtracao = e.target.closest('.btn-extracao-completa-card');
            if (btnVer) {
                e.preventDefault();
                const id = btnVer.getAttribute('data-excursao-id');
                if (id) abrirListaAlunos(id);
            } else if (btnDeletar) {
                e.preventDefault();
                const id = btnDeletar.getAttribute('data-excursao-id');
                const titulo = btnDeletar.getAttribute('data-excursao-titulo') || '';
                if (id) deletarExcursao(id, titulo);
            } else if (btnExportar) {
                e.preventDefault();
                const id = btnExportar.getAttribute('data-excursao-id');
                const codigo = btnExportar.getAttribute('data-excursao-codigo') || '';
                if (id) exportarExcel({ excursaoId: id, codigo, button: btnExportar });
            } else if (btnExtracao) {
                e.preventDefault();
                const id = btnExtracao.getAttribute('data-excursao-id');
                const codigo = btnExtracao.getAttribute('data-excursao-codigo') || '';
                if (id) exportarExtracaoCompleta({ excursaoId: id, codigo, button: btnExtracao });
            } else if (e.target.closest('.btn-exportar-cancelados-card')) {
                const btnCancelados = e.target.closest('.btn-exportar-cancelados-card');
                e.preventDefault();
                const id = btnCancelados.getAttribute('data-excursao-id');
                const codigo = btnCancelados.getAttribute('data-excursao-codigo') || '';
                if (id) exportarCancelados({ excursaoId: id, codigo, button: btnCancelados });
            } else if (e.target.closest('.btn-exportar-escola-card')) {
                const btnEscola = e.target.closest('.btn-exportar-escola-card');
                e.preventDefault();
                const id = btnEscola.getAttribute('data-excursao-id');
                const titulo = btnEscola.getAttribute('data-excursao-titulo') || '';
                if (id) exportarEscola({ excursaoId: id, titulo, button: btnEscola });
            }
        });
    }

    // Filtros e botões (sem inline handlers por CSP)
    const filterStatus = document.getElementById('filterStatus');
    if (filterStatus) filterStatus.addEventListener('change', loadExcursoes);

    const searchInput = document.getElementById('searchInput');
    const filterData = document.getElementById('filterData');
    const filterHorario = document.getElementById('filterHorario');
    const filterDataRegistro = document.getElementById('filterDataRegistro');
    const btnLimparFiltros = document.getElementById('btnLimparFiltros');

    if (searchInput) searchInput.addEventListener('input', () => { renderExcursoes(); });
    if (searchInput) searchInput.addEventListener('keyup', (e) => { if (e.key === 'Enter') renderExcursoes(); });
    if (filterData) filterData.addEventListener('change', () => { renderExcursoes(); });
    if (filterHorario) filterHorario.addEventListener('input', () => { renderExcursoes(); });
    if (filterHorario) filterHorario.addEventListener('keyup', (e) => { if (e.key === 'Enter') renderExcursoes(); });
    if (filterDataRegistro) filterDataRegistro.addEventListener('change', () => { renderExcursoes(); });
    if (btnLimparFiltros) btnLimparFiltros.addEventListener('click', limparFiltros);

    const btnVoltar = document.getElementById('btnVoltarExcursoes');
    if (btnVoltar) btnVoltar.addEventListener('click', function (e) { e.preventDefault(); voltarParaExcursoes(e); });

    const btnExportar = document.getElementById('btnExportar');
    if (btnExportar) btnExportar.addEventListener('click', exportarExcel);

    const btnExtracaoCompleta = document.getElementById('btnExtracaoCompleta');
    if (btnExtracaoCompleta) btnExtracaoCompleta.addEventListener('click', exportarExtracaoCompleta);

    const btnExportarCancelados = document.getElementById('btnExportarCancelados');
    if (btnExportarCancelados) btnExportarCancelados.addEventListener('click', () => exportarCancelados());

    const btnExportarEscola = document.getElementById('btnExportarEscola');
    if (btnExportarEscola) btnExportarEscola.addEventListener('click', () => exportarEscola());

    const btnAtualizarPagamentosTodas = document.getElementById('btnAtualizarPagamentosTodas');
    if (btnAtualizarPagamentosTodas) btnAtualizarPagamentosTodas.addEventListener('click', atualizarPagamentosTodas);

    const filterStatusPedido = document.getElementById('filterStatusPedido');
    if (filterStatusPedido) filterStatusPedido.addEventListener('change', loadAlunos);

    const btnFecharModalAluno = document.getElementById('btnFecharModalAluno');
    if (btnFecharModalAluno) {
        btnFecharModalAluno.addEventListener('click', () => {
            if (typeof closeModal === 'function') {
                closeModal('modalAlunoDetalhes');
            } else {
                const overlay = document.getElementById('modalAlunoDetalhes');
                if (overlay) {
                    overlay.classList.add('hidden');
                    document.body.style.overflow = '';
                }
            }
        });
    }

    const btnFecharModalAlunoFooter = document.getElementById('btnFecharModalAlunoFooter');
    if (btnFecharModalAlunoFooter) {
        btnFecharModalAlunoFooter.addEventListener('click', () => {
            if (typeof closeModal === 'function') {
                closeModal('modalAlunoDetalhes');
            } else {
                const overlay = document.getElementById('modalAlunoDetalhes');
                if (overlay) {
                    overlay.classList.add('hidden');
                    document.body.style.overflow = '';
                }
            }
        });
    }

    // Modal Adicionar Aluno Listeners
    const btnAdicionarAluno = document.getElementById('btnAdicionarAluno');
    if (btnAdicionarAluno) {
        btnAdicionarAluno.addEventListener('click', abrirModalAdicionarAluno);
    }

    const btnFecharModalAdicionarAluno = document.getElementById('btnFecharModalAdicionarAluno');
    if (btnFecharModalAdicionarAluno) {
        btnFecharModalAdicionarAluno.addEventListener('click', fecharModalAdicionarAluno);
    }

    const btnCancelarAdicionarAluno = document.getElementById('btnCancelarAdicionarAluno');
    if (btnCancelarAdicionarAluno) {
        btnCancelarAdicionarAluno.addEventListener('click', fecharModalAdicionarAluno);
    }

    const formAdicionarAluno = document.getElementById('formAdicionarAluno');
    if (formAdicionarAluno) {
        formAdicionarAluno.addEventListener('submit', salvarNovoAluno);
    }

    loadExcursoes().then(() => {
        const params = new URLSearchParams(window.location.search);
        const excursaoId = params.get('excursaoId');
        if (excursaoId) {
            console.log('[Listas] Abrindo lista de alunos via URL (excursaoId):', excursaoId);
            abrirListaAlunos(excursaoId);
        }
    });

    // Mostrar botão de toggle em mobile
    if (window.innerWidth <= 768) {
        document.getElementById('sidebarToggle').style.display = 'inline-block';
    }

    window.addEventListener('resize', function () {
        if (window.innerWidth <= 768) {
            document.getElementById('sidebarToggle').style.display = 'inline-block';
        } else {
            document.getElementById('sidebarToggle').style.display = 'none';
        }
    });
});

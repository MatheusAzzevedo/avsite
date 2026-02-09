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
                    <button class="btn btn-primary" onclick="event.stopPropagation(); abrirListaAlunos('${excursao.id}')" style="flex: 1;">
                        <i class="fas fa-users"></i> Ver Alunos
                    </button>
                    <button class="btn btn-danger" onclick="event.stopPropagation(); deletarExcursao('${excursao.id}', '${escapeHtml(excursao.titulo).replace(/'/g, "\\'")}')">
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
    currentExcursaoId = excursaoId;
    
    // Esconde view de excursões e mostra view de alunos
    document.getElementById('excursoesView').style.display = 'none';
    document.getElementById('alunosView').style.display = 'block';
    document.getElementById('pageTitle').textContent = 'Lista de Alunos';

    // Reseta filtro
    document.getElementById('filterStatusPedido').value = '';

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
                <td colspan="7" style="text-align: center; padding: 3rem; color: var(--text-light);">
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
                <td><span class="badge ${statusClass}">${formatStatusPedido(aluno.statusPedido)}</span></td>
                <td>${dataPedido}</td>
            </tr>
        `;
    }).join('');
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

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    console.log('[Listas] Inicializando página de listas...');
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

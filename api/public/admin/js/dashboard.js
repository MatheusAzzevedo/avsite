/**
 * Explicação do Arquivo [dashboard.js]
 * Lógica do dashboard administrativo: estatísticas, excursões ativas,
 * atividades recentes e botão de teste de e-mail. Externalizado para
 * compatibilidade com CSP (Content Security Policy).
 */

/**
 * Explicação da função [escapeHtml]
 * Escapa caracteres HTML para prevenir XSS.
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Exibe mensagem de feedback (sucesso ou erro) abaixo do botão de teste de e-mail.
 */
function mostrarMsgTesteEmail(texto, sucesso) {
    const el = document.getElementById('msgTesteEmail');
    if (!el) return;
    if (!texto) {
        el.style.display = 'none';
        return;
    }
    el.innerHTML = (sucesso ? '<i class="fas fa-check-circle"></i> ' : '<i class="fas fa-exclamation-circle"></i> ') + texto;
    el.style.display = 'block';
    el.style.background = sucesso ? '#dcfce7' : '#fee2e2';
    el.style.color = sucesso ? '#166534' : '#991b1b';
    el.style.border = '1px solid ' + (sucesso ? '#86efac' : '#fecaca');
    clearTimeout(el._hideTimer);
    el._hideTimer = setTimeout(function () { el.style.display = 'none'; }, 6000);
}

/**
 * Envia e-mail de confirmação de inscrição (template + dados mock) para
 * azetus.io@gmail.com e dantydias@yahoo.com.br. Apenas teste, sem outros fluxos.
 */
async function enviarEmailTeste() {
    const btn = document.getElementById('btnTesteEmail');
    if (!btn) return;
    const textoOriginal = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
    mostrarMsgTesteEmail('', true);
    const msgEl = document.getElementById('msgTesteEmail');
    if (msgEl) msgEl.style.display = 'none';
    const apiUrl = (window.location.hostname === 'localhost' ? 'http://localhost:3001/api' : window.location.origin + '/api') + '/admin/email/teste-confirmacao';
    const token = localStorage.getItem('avorar_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    try {
        const res = await fetch(apiUrl, { method: 'POST', headers: headers });
        let data = {};
        try { data = await res.json(); } catch (e) {}
        if (res.ok && data.success) {
            mostrarMsgTesteEmail('E-mails de teste enviados com sucesso para azetus.io@gmail.com e dantydias@yahoo.com.br. Verifique as caixas de entrada.', true);
        } else {
            const erros = (data.data && data.data.resultados)
                ? data.data.resultados.filter(function (r) { return !r.success; }).map(function (r) { return r.email + ': ' + (r.error || 'erro'); }).join('; ')
                : (data.message || data.error || 'Falha ao enviar. Verifique se está logado como admin.');
            mostrarMsgTesteEmail(erros, false);
        }
    } catch (err) {
        mostrarMsgTesteEmail((err && err.message) ? err.message : 'Erro de conexão. Verifique se está logado como admin.', false);
    } finally {
        btn.disabled = false;
        btn.innerHTML = textoOriginal;
    }
}

/**
 * Explicação da função [loadStats]
 * Carrega as estatísticas dos cards principais via API.
 */
async function loadStats() {
    try {
        const stats = await DashboardStats.getStats();
        document.getElementById('stat-pedagogicos').textContent = stats.pedagogicosAtivos ?? 0;
        document.getElementById('stat-convencionais').textContent = stats.convencionaisAtivos ?? 0;
        document.getElementById('stat-reservas').textContent = stats.reservas ?? 0;
    } catch (error) {
        console.error('[Dashboard] Erro ao carregar estatísticas:', error);
    }
}

/**
 * Explicação da função [loadTopExcursoes]
 * Carrega as 2 últimas excursões cadastradas que estão ativas (pedagógicas + convencionais).
 */
async function loadTopExcursoes() {
    try {
        const excursoes = await DashboardStats.getExcursoesAtivas();
        const container = document.getElementById('topExcursoes');
        const tbody = document.getElementById('recentActivity');

        if (excursoes.length === 0) {
            container.innerHTML = '<p style="color: var(--text-light); text-align: center;">Nenhuma excursão ativa</p>';
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-light);">Nenhuma atividade recente</td></tr>';
            return;
        }

        const formatPrice = (preco) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(preco);

        container.innerHTML = excursoes.map(e => `
            <div style="border: 2px solid var(--light-border); border-radius: var(--radius-lg); padding: 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div>
                        <h4 style="font-size: 1rem; margin: 0 0 0.25rem 0;">${escapeHtml(e.titulo)}</h4>
                        <p style="color: var(--text-light); font-size: 0.875rem; margin: 0;">
                            ${e.tipo === 'PEDAGOGICA' ? 'Pedagógica' : 'Convencional'} · ${e.identificador || ''}
                        </p>
                    </div>
                    <strong style="color: var(--primary-color);">${formatPrice(e.preco)}</strong>
                </div>
                <a href="${e.tipo === 'PEDAGOGICA' ? 'excursao-pedagogica-editor.html?id=' + e.id : 'excursao-editor.html?id=' + e.id}" 
                   class="btn btn-sm btn-secondary" style="margin-top: 0.5rem; text-decoration: none;">
                    Editar
                </a>
            </div>
        `).join('');

        tbody.innerHTML = excursoes.map(e => {
            const date = formatDateBR(e.createdAt);
            return `
                <tr>
                    <td>${date}</td>
                    <td><span class="badge ${e.tipo === 'PEDAGOGICA' ? 'badge-info' : 'badge-warning'}">${e.tipo === 'PEDAGOGICA' ? 'Pedagógica' : 'Convencional'}</span></td>
                    <td>${escapeHtml(e.titulo)}</td>
                    <td><span class="badge badge-success">Ativo</span></td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('[Dashboard] Erro ao carregar excursões:', error);
    }
}

/**
 * Explicação da função [loadDashboard]
 * Carrega todas as estatísticas e dados do dashboard via API.
 */
async function loadDashboard() {
    console.log('[Dashboard] Carregando dados da API...');
    await loadStats();
    await loadTopExcursoes();
}

/**
 * Inicializa o dashboard: toggle mobile, botão de e-mail, carregamento de dados.
 */
function initDashboard() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        if (window.innerWidth <= 768) {
            sidebarToggle.style.display = 'inline-block';
        }
        window.addEventListener('resize', function () {
            sidebarToggle.style.display = window.innerWidth <= 768 ? 'inline-block' : 'none';
        });
    }

    const btnTesteEmail = document.getElementById('btnTesteEmail');
    if (btnTesteEmail) {
        btnTesteEmail.addEventListener('click', enviarEmailTeste);
    }

    loadDashboard();
}

document.addEventListener('DOMContentLoaded', initDashboard);

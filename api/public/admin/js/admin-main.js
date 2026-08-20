// ============================================
// SISTEMA ADMINISTRATIVO - JAVASCRIPT PRINCIPAL
// Funções utilitárias e gerenciamento geral
// ============================================

// Gerenciamento de Sidebar Mobile
function initSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const toggleBtn = document.getElementById('sidebarToggle');
    
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }

    // Fechar sidebar ao clicar fora em mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            if (!sidebar.contains(e.target) && !toggleBtn?.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        }
    });
}

// Gerenciamento de Modais
class Modal {
    constructor(modalId) {
        this.modal = document.getElementById(modalId);
        this.overlay = this.modal?.closest('.modal-overlay');
        this.init();
    }

    init() {
        if (!this.modal) return;

        const closeBtn = this.modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        if (this.overlay) {
            this.overlay.addEventListener('click', (e) => {
                if (e.target === this.overlay) {
                    this.close();
                }
            });
        }
    }

    open() {
        if (this.overlay) {
            this.overlay.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    }

    close() {
        if (this.overlay) {
            this.overlay.classList.add('hidden');
            document.body.style.overflow = '';
        }
    }
}

// Função para abrir modal
function openModal(modalId) {
    const modalOverlay = document.getElementById(modalId);
    if (modalOverlay) {
        modalOverlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

// Função para fechar modal
function closeModal(modalId) {
    const modalOverlay = document.getElementById(modalId);
    if (modalOverlay) {
        modalOverlay.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

// Preview de Imagem
function previewImage(input, previewId) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const preview = document.getElementById(previewId);
            if (preview) {
                preview.src = e.target.result;
                preview.style.display = 'block';
            }
        };
        
        reader.readAsDataURL(input.files[0]);
    }
}

// Validação de Formulário
function validateForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return false;

    const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
    let isValid = true;

    inputs.forEach(input => {
        if (!input.value.trim()) {
            input.style.borderColor = 'var(--danger-color)';
            isValid = false;
        } else {
            input.style.borderColor = 'var(--light-border)';
        }
    });

    return isValid;
}

// Notificações Toast
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    const styles = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        color: white;
        font-weight: 600;
        z-index: 9999;
        animation: slideInRight 0.3s ease;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    `;
    
    toast.style.cssText = styles;
    
    switch(type) {
        case 'success':
            toast.style.backgroundColor = '#10b981';
            break;
        case 'error':
            toast.style.backgroundColor = '#ef4444';
            break;
        case 'warning':
            toast.style.backgroundColor = '#f59e0b';
            break;
        default:
            toast.style.backgroundColor = '#06b6d4';
    }
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Adicionar animações CSS para toast
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Confirmação de Exclusão
function confirmDelete(itemName, callback) {
    if (confirm(`Tem certeza que deseja excluir "${itemName}"? Esta ação não pode ser desfeita.`)) {
        callback();
    }
}

// Busca em Tabela
function searchTable(searchInputId, tableId) {
    const input = document.getElementById(searchInputId);
    const table = document.getElementById(tableId);
    
    if (!input || !table) return;
    
    input.addEventListener('keyup', function() {
        const filter = this.value.toLowerCase();
        const rows = table.getElementsByTagName('tbody')[0].getElementsByTagName('tr');
        
        Array.from(rows).forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(filter) ? '' : 'none';
        });
    });
}

// Filtro por Select
function filterTable(selectId, tableId, columnIndex) {
    const select = document.getElementById(selectId);
    const table = document.getElementById(tableId);
    
    if (!select || !table) return;
    
    select.addEventListener('change', function() {
        const filter = this.value.toLowerCase();
        const rows = table.getElementsByTagName('tbody')[0].getElementsByTagName('tr');
        
        Array.from(rows).forEach(row => {
            if (filter === 'todos' || filter === '') {
                row.style.display = '';
            } else {
                const cell = row.getElementsByTagName('td')[columnIndex];
                const text = cell ? cell.textContent.toLowerCase() : '';
                row.style.display = text.includes(filter) ? '' : 'none';
            }
        });
    });
}

// Formatar Data
function formatDate(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

// Logout (usando AuthManager da API)
function logout() {
    if (confirm('Deseja realmente sair do sistema?')) {
        // Se AuthManager estiver disponível, usa ele
        if (typeof AuthManager !== 'undefined') {
            AuthManager.logout();
        } else {
            // Fallback
            localStorage.clear();
            window.location.href = 'login.html';
        }
    }
}

// Marcar link ativo na navegação
function setActiveNav() {
    const currentPage = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage) {
            link.classList.add('active');
        }
    });
}

// Carregar dados do usuário
function loadUserData() {
    // Simulação de dados do usuário
    const user = {
        name: 'Administrador',
        email: 'admin@avorar.com',
        initials: 'AD'
    };
    
    const userAvatar = document.querySelector('.user-avatar');
    if (userAvatar) {
        userAvatar.textContent = user.initials;
    }
    
    return user;
}

// Editor de Texto Rico Simples
class RichTextEditor {
    constructor(elementId) {
        this.editor = document.getElementById(elementId);
        this.init();
    }

    init() {
        if (!this.editor) return;
        
        this.editor.contentEditable = true;
        this.editor.style.minHeight = '400px';
        this.editor.style.padding = '1.5rem';
        this.editor.style.outline = 'none';
    }

    execCommand(command, value = null) {
        document.execCommand(command, false, value);
        this.editor.focus();
    }

    getContent() {
        return this.editor.innerHTML;
    }

    setContent(html) {
        this.editor.innerHTML = html;
    }

    clear() {
        this.editor.innerHTML = '';
    }
}

// LocalStorage Helper
// Removido: Storage é definido em api-client.js (importado globalmente)
// Não redeclarar para evitar conflito "Identifier 'Storage' has already been declared"

// Verificar autenticação (usando AuthManager da API)
function checkAuth() {
    // Se AuthManager estiver disponível, usa ele
    if (typeof AuthManager !== 'undefined') {
        return AuthManager.checkAuth();
    }
    
    // Fallback para localStorage
    const isAuthenticated = Storage.get('isAuthenticated');
    const currentPage = window.location.pathname.split('/').pop();
    
    if (!isAuthenticated && currentPage !== 'login.html') {
        window.location.href = 'login.html';
    }
}

// Inicialização geral
document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticação
    checkAuth();
    
    // Inicializar sidebar
    initSidebar();
    
    // Marcar navegação ativa
    setActiveNav();
    
    // Carregar dados do usuário
    loadUserData();

    // Conectar link de logout do menu lateral (quando existir)
    const navLogout = document.getElementById('navLogout');
    if (navLogout) {
        navLogout.addEventListener('click', function(event) {
            event.preventDefault();
            logout();
        });
    }
});


// ============================================================
// Upload de arquivos (Cloudflare R2)
// ============================================================

/**
 * Explicação do objeto [UploadArquivo]
 *
 * Envia arquivos para a API, que os processa e grava no Cloudflare R2,
 * devolvendo a URL pública. Substitui o padrão antigo de converter a imagem
 * para Base64 com FileReader e gravá-la dentro do próprio registro.
 *
 * Por que existe: cinco telas do admin repetiam a mesma lógica de arquivo.
 * Centralizar evita que cada uma trate erro e validação de um jeito — e é o
 * tratamento de erro que faz diferença aqui, porque uma falha silenciosa de
 * upload leva o usuário a comprimir a imagem por fora até "funcionar",
 * degradando-a.
 *
 * Usa XMLHttpRequest em vez de fetch por um motivo específico: só ele reporta
 * progresso de envio, e fotos originais podem passar de 20 MB.
 */
const UploadArquivo = {
    /** Deve espelhar MAX_FILE_SIZE no servidor. */
    TAMANHO_MAXIMO: 25 * 1024 * 1024,

    TIPOS_IMAGEM: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],

    TIPOS_DOCUMENTO: [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ],

    /**
     * Explicação da função [validar]
     * Confere tipo e tamanho antes de gastar a subida.
     * @returns {string|null} mensagem de erro, ou null se estiver tudo certo
     */
    validar(file, tiposAceitos) {
        if (!file) return 'Nenhum arquivo selecionado.';

        if (tiposAceitos && !tiposAceitos.includes(file.type)) {
            return 'Formato não aceito. Envie JPG, PNG, WEBP ou GIF.';
        }

        if (file.size > this.TAMANHO_MAXIMO) {
            const mb = (file.size / 1024 / 1024).toFixed(1);
            const limite = (this.TAMANHO_MAXIMO / 1024 / 1024).toFixed(0);
            return `Arquivo de ${mb} MB excede o limite de ${limite} MB.`;
        }

        return null;
    },

    /**
     * Explicação da função [enviar]
     * Envia um arquivo e devolve os dados salvos.
     *
     * @param {File} file
     * @param {Object} [opcoes]
     * @param {string} [opcoes.endpoint] '/uploads' (padrão) ou '/uploads/document'
     * @param {Function} [opcoes.aoProgredir] recebe a porcentagem (0-100)
     * @returns {Promise<{url: string, id: string, size: number, originalName: string}>}
     */
    enviar(file, opcoes = {}) {
        const endpoint = opcoes.endpoint || '/uploads';
        const tipos = endpoint.includes('document') ? this.TIPOS_DOCUMENTO : this.TIPOS_IMAGEM;

        const erro = this.validar(file, tipos);
        if (erro) return Promise.reject(new Error(erro));

        return new Promise((resolve, reject) => {
            const form = new FormData();
            form.append('file', file);

            const xhr = new XMLHttpRequest();
            xhr.open('POST', `${API_CONFIG.BASE_URL}${endpoint}`);

            const token = localStorage.getItem('avorar_token');
            if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

            if (typeof opcoes.aoProgredir === 'function') {
                xhr.upload.addEventListener('progress', (evt) => {
                    if (evt.lengthComputable) {
                        opcoes.aoProgredir(Math.round((evt.loaded / evt.total) * 100));
                    }
                });
            }

            xhr.addEventListener('load', () => {
                let corpo = null;
                try { corpo = JSON.parse(xhr.responseText); } catch (e) { /* resposta não-JSON */ }

                if (xhr.status >= 200 && xhr.status < 300 && corpo && corpo.data) {
                    console.log('[Upload] Enviado:', corpo.data.url);
                    return resolve(corpo.data);
                }

                // A API já devolve mensagem clara em 413 (tamanho) e 400 (formato);
                // repassá-la é melhor do que inventar um texto genérico aqui.
                if (xhr.status === 401) {
                    return reject(new Error('Sua sessão expirou. Entre novamente para continuar.'));
                }
                reject(new Error((corpo && (corpo.error || corpo.message)) || `Falha no envio (HTTP ${xhr.status}).`));
            });

            xhr.addEventListener('error', () => reject(new Error('Não foi possível conectar ao servidor. Verifique a conexão.')));
            xhr.addEventListener('abort', () => reject(new Error('Envio cancelado.')));

            xhr.send(form);
        });
    },

    /** Atalho para documentos (PDF, DOCX, XLS, XLSX). */
    enviarDocumento(file, opcoes = {}) {
        return this.enviar(file, Object.assign({}, opcoes, { endpoint: '/uploads/document' }));
    },

    /**
     * Explicação da função [enviarVarias]
     * Envia vários arquivos em sequência, relatando o andamento do conjunto.
     *
     * A sequência é proposital: subir 10 fotos de 20 MB em paralelo satura a
     * conexão e faz todas demorarem mais. Um erro em um arquivo não derruba os
     * demais — ele volta no resultado marcado com a mensagem.
     *
     * @returns {Promise<Array<{ok: boolean, arquivo: string, dados?: Object, erro?: string}>>}
     */
    async enviarVarias(files, opcoes = {}) {
        const lista = Array.from(files);
        const resultados = [];

        for (let i = 0; i < lista.length; i++) {
            const file = lista[i];
            if (typeof opcoes.aoIniciarArquivo === 'function') {
                opcoes.aoIniciarArquivo(i + 1, lista.length, file.name);
            }
            try {
                const dados = await this.enviar(file, opcoes);
                resultados.push({ ok: true, arquivo: file.name, dados });
            } catch (e) {
                console.error('[Upload] Falhou:', file.name, e.message);
                resultados.push({ ok: false, arquivo: file.name, erro: e.message });
            }
        }

        return resultados;
    },

    /**
     * Explicação da função [preencherCampo]
     * Substitui o padrão antigo de FileReader nas telas do admin.
     *
     * Antes: lia o arquivo como Base64 e jogava a string no input escondido e
     * no `src` da previa — o registro carregava a imagem inteira.
     * Agora: envia para o R2 e grava apenas a URL, mantendo os mesmos
     * elementos de tela, para que a troca em cada tela seja mínima.
     *
     * @param {File} file
     * @param {Object} campos
     * @param {string} campos.dataInputId input escondido que guarda a URL
     * @param {string} campos.previewId <img> de previa
     * @param {string} [campos.containerId] elemento a exibir quando houver imagem
     * @returns {Promise<string|null>} a URL, ou null se falhar
     */
    async preencherCampo(file, campos) {
        const inputDados = document.getElementById(campos.dataInputId);
        const previa = document.getElementById(campos.previewId);
        // Sem container informado, o próprio elemento de prévia é exibido/ocultado —
        // é assim que a tela de Equipe funciona. Telas com um wrapper separado
        // (como o editor de excursão) passam `containerId` explicitamente.
        const container = document.getElementById(campos.containerId || campos.previewId);

        // Mostra a imagem local imediatamente: o envio pode levar segundos e a
        // tela não deve ficar parada sem resposta.
        const urlLocal = URL.createObjectURL(file);
        if (previa) previa.src = urlLocal;
        if (container) container.style.display = 'block';

        try {
            const dados = await this.enviar(file, {
                aoProgredir: (pct) => {
                    if (previa) previa.style.opacity = String(0.4 + (pct / 100) * 0.6);
                }
            });

            if (previa) {
                previa.src = dados.url;
                previa.style.opacity = '1';
            }
            if (inputDados) inputDados.value = dados.url;

            URL.revokeObjectURL(urlLocal);
            return dados.url;
        } catch (e) {
            // Limpa a previa para não dar a impressão de que a imagem foi salva.
            if (previa) { previa.src = ''; previa.style.opacity = '1'; }
            if (container) container.style.display = 'none';
            if (inputDados) inputDados.value = '';
            URL.revokeObjectURL(urlLocal);

            if (typeof showToast === 'function') showToast(e.message, 'error');
            else alert(e.message);

            return null;
        }
    }
};

// Exportar funções para uso global
window.Modal = Modal;
window.openModal = openModal;
window.closeModal = closeModal;
window.previewImage = previewImage;
window.validateForm = validateForm;
window.showToast = showToast;
window.confirmDelete = confirmDelete;
window.searchTable = searchTable;
window.filterTable = filterTable;
window.formatDate = formatDate;
window.logout = logout;
window.RichTextEditor = RichTextEditor;
window.UploadArquivo = UploadArquivo;
// window.Storage = Storage; // Removido: Storage vem de api-client.js

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
const Storage = {
    set: (key, value) => {
        localStorage.setItem(key, JSON.stringify(value));
    },
    
    get: (key) => {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    },
    
    remove: (key) => {
        localStorage.removeItem(key);
    },
    
    clear: () => {
        localStorage.clear();
    }
};

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
});

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
window.Storage = Storage;

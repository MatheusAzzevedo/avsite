/**
 * Explicação do Arquivo [api-client.js]
 * 
 * Cliente JavaScript para consumir a API Avorar.
 * Substitui o data-manager.js (que usava localStorage)
 * por chamadas HTTP reais à API.
 * 
 * Este arquivo fornece:
 * - Configuração da URL da API
 * - Gerenciamento de autenticação (tokens JWT)
 * - Métodos CRUD para Excursões, Posts e Configurações
 * - Tratamento de erros padronizado
 */

// ===========================================
// CONFIGURAÇÃO
// ===========================================

/**
 * URL base da API
 * Em desenvolvimento: http://localhost:3001/api
 * Em produção: mesma origem (site e API no mesmo deploy, ex: avoarturismo.up.railway.app)
 */
const API_CONFIG = {
  BASE_URL: window.location.hostname === 'localhost'
    ? 'http://localhost:3001/api'
    : (window.location.origin + '/api'),
  
  // Headers padrão
  getHeaders: () => {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    const token = localStorage.getItem('avorar_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }
};

// ===========================================
// UTILITÁRIOS
// ===========================================

/**
 * Explicação da função [apiRequest]
 * Função genérica para fazer requisições à API.
 * Trata erros e retorna dados formatados.
 * 
 * @param {string} endpoint - Endpoint da API (ex: '/excursoes')
 * @param {object} options - Opções do fetch
 * @returns {Promise<object>} Dados da resposta
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    headers: API_CONFIG.getHeaders()
  };
  
  const finalOptions = { ...defaultOptions, ...options };
  
  // Se o body for FormData, remove Content-Type para o browser definir
  if (options.body instanceof FormData) {
    delete finalOptions.headers['Content-Type'];
  }
  
  try {
    console.log(`[API] ${options.method || 'GET'} ${endpoint}`);
    
    const response = await fetch(url, finalOptions);
    const data = await response.json();
    
    if (!response.ok) {
      // Token expirado ou inválido
      if (response.status === 401) {
        console.warn('[API] Token inválido ou expirado');
        AuthManager.logout();
        throw new Error(data.error || 'Sessão expirada. Faça login novamente.');
      }
      
      throw new Error(data.error || data.message || 'Erro na requisição');
    }
    
    return data;
  } catch (error) {
    console.error(`[API] Erro em ${endpoint}:`, error.message);
    throw error;
  }
}

/**
 * Explicação da função [formatDateBR]
 * Converte uma data para formato brasileiro (DD/MM/YYYY)
 */
function formatDateBR(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Explicação da função [formatDateISO]
 * Converte uma data para formato ISO (YYYY-MM-DD)
 */
function formatDateISO(date) {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

/**
 * Explicação da função [slugify]
 * Converte um texto em slug para URLs
 */
function slugify(text) {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

// ===========================================
// GERENCIADOR DE AUTENTICAÇÃO
// ===========================================

/**
 * Explicação do objeto [AuthManager]
 * Gerencia autenticação: login, logout, verificação de token.
 */
const AuthManager = {
  TOKEN_KEY: 'avorar_token',
  USER_KEY: 'avorar_user',

  /**
   * Realiza login
   * @param {string} email 
   * @param {string} password 
   * @returns {Promise<object>} Dados do usuário
   */
  async login(email, password) {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    if (response.success && response.data) {
      localStorage.setItem(this.TOKEN_KEY, response.data.token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(response.data.user));
      localStorage.setItem('isAuthenticated', 'true');
      console.log('[Auth] Login realizado com sucesso');
    }
    
    return response;
  },

  /**
   * Realiza logout
   */
  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem('isAuthenticated');
    console.log('[Auth] Logout realizado');
    
    // Se estiver em página admin, redireciona para login
    if (window.location.pathname.includes('/admin/')) {
      window.location.href = 'login.html';
    }
  },

  /**
   * Verifica se está autenticado
   * @returns {boolean}
   */
  isAuthenticated() {
    return !!localStorage.getItem(this.TOKEN_KEY);
  },

  /**
   * Retorna dados do usuário logado
   * @returns {object|null}
   */
  getUser() {
    const user = localStorage.getItem(this.USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  /**
   * Retorna o token
   * @returns {string|null}
   */
  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  },

  /**
   * Verifica autenticação e redireciona se necessário
   */
  checkAuth() {
    const currentPage = window.location.pathname.split('/').pop();
    
    if (!this.isAuthenticated() && currentPage !== 'login.html') {
      window.location.href = 'login.html';
      return false;
    }
    
    return true;
  },

  /**
   * Verifica se token ainda é válido
   */
  async verifyToken() {
    try {
      const response = await apiRequest('/auth/verify', {
        method: 'POST'
      });
      return response.success;
    } catch {
      return false;
    }
  }
};

// ===========================================
// GERENCIADOR DE EXCURSÕES
// ===========================================

/**
 * Explicação do objeto [ExcursaoManager]
 * Gerencia operações CRUD de excursões via API.
 */
const ExcursaoManager = {
  /**
   * Lista todas as excursões
   * @param {boolean} onlyActive - Se true, retorna apenas ativas
   * @returns {Promise<Array>}
   */
  async getAll(onlyActive = false) {
    const endpoint = onlyActive 
      ? '/public/excursoes'  // Rota pública para site
      : '/excursoes';        // Rota admin
    
    const response = await apiRequest(endpoint);
    return response.data || [];
  },

  /**
   * Busca excursão por ID
   * @param {string} id 
   * @returns {Promise<object|null>}
   */
  async getById(id) {
    try {
      const response = await apiRequest(`/excursoes/${id}`);
      return response.data || null;
    } catch (error) {
      console.error('[ExcursaoManager] Erro ao buscar:', error);
      return null;
    }
  },

  /**
   * Busca excursão por slug (pública)
   * @param {string} slug 
   * @returns {Promise<object|null>}
   */
  async getBySlug(slug) {
    try {
      const response = await apiRequest(`/public/excursoes/${slug}`);
      return response.data || null;
    } catch (error) {
      console.error('[ExcursaoManager] Erro ao buscar por slug:', error);
      return null;
    }
  },

  /**
   * Cria nova excursão
   * @param {object} excursaoData 
   * @returns {Promise<object|null>}
   */
  async create(excursaoData) {
    try {
      const response = await apiRequest('/excursoes', {
        method: 'POST',
        body: JSON.stringify(excursaoData)
      });
      console.log('[ExcursaoManager] Excursão criada:', response.data?.id);
      return response.data;
    } catch (error) {
      console.error('[ExcursaoManager] Erro ao criar:', error);
      throw error;
    }
  },

  /**
   * Atualiza excursão existente
   * @param {string} id 
   * @param {object} excursaoData 
   * @returns {Promise<object|null>}
   */
  async update(id, excursaoData) {
    try {
      const response = await apiRequest(`/excursoes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(excursaoData)
      });
      console.log('[ExcursaoManager] Excursão atualizada:', id);
      return response.data;
    } catch (error) {
      console.error('[ExcursaoManager] Erro ao atualizar:', error);
      throw error;
    }
  },

  /**
   * Exclui excursão
   * @param {string} id 
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    try {
      await apiRequest(`/excursoes/${id}`, {
        method: 'DELETE'
      });
      console.log('[ExcursaoManager] Excursão excluída:', id);
      return true;
    } catch (error) {
      console.error('[ExcursaoManager] Erro ao excluir:', error);
      return false;
    }
  },

  /**
   * Altera status da excursão
   * @param {string} id 
   * @param {string} status - 'ATIVO' ou 'INATIVO'
   * @returns {Promise<object|null>}
   */
  async toggleStatus(id, status) {
    try {
      const response = await apiRequest(`/excursoes/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      return response.data;
    } catch (error) {
      console.error('[ExcursaoManager] Erro ao alterar status:', error);
      return null;
    }
  },

  /**
   * Filtra excursões por categoria
   * @param {string} categoria 
   * @returns {Promise<Array>}
   */
  async filterByCategory(categoria) {
    try {
      const response = await apiRequest(`/public/excursoes?categoria=${categoria}`);
      return response.data || [];
    } catch (error) {
      console.error('[ExcursaoManager] Erro ao filtrar:', error);
      return [];
    }
  },

  /**
   * Formata preço em Real
   * @param {number} preco 
   * @returns {string}
   */
  formatPrice(preco) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(preco);
  }
};

// ===========================================
// GERENCIADOR DE POSTS/BLOG
// ===========================================

/**
 * Explicação do objeto [BlogManager]
 * Gerencia operações CRUD de posts via API.
 */
const BlogManager = {
  /**
   * Lista todos os posts
   * @param {boolean} onlyPublished - Se true, retorna apenas publicados
   * @returns {Promise<Array>}
   */
  async getAll(onlyPublished = false) {
    try {
      const endpoint = onlyPublished 
        ? '/public/posts'
        : '/posts';
      
      const response = await apiRequest(endpoint);
      return response.data || [];
    } catch (error) {
      console.error('[BlogManager] Erro ao listar:', error);
      return [];
    }
  },

  /**
   * Busca post por ID
   * @param {string} id 
   * @returns {Promise<object|null>}
   */
  async getById(id) {
    try {
      const response = await apiRequest(`/posts/${id}`);
      return response.data || null;
    } catch (error) {
      console.error('[BlogManager] Erro ao buscar:', error);
      return null;
    }
  },

  /**
   * Busca post por slug (pública)
   * @param {string} slug 
   * @returns {Promise<object|null>}
   */
  async getBySlug(slug) {
    try {
      const response = await apiRequest(`/public/posts/${slug}`);
      return response.data || null;
    } catch (error) {
      console.error('[BlogManager] Erro ao buscar por slug:', error);
      return null;
    }
  },

  /**
   * Cria novo post
   * @param {object} postData 
   * @returns {Promise<object|null>}
   */
  async create(postData) {
    try {
      const response = await apiRequest('/posts', {
        method: 'POST',
        body: JSON.stringify(postData)
      });
      console.log('[BlogManager] Post criado:', response.data?.id);
      return response.data;
    } catch (error) {
      console.error('[BlogManager] Erro ao criar:', error);
      throw error;
    }
  },

  /**
   * Atualiza post existente
   * @param {string} id 
   * @param {object} postData 
   * @returns {Promise<object|null>}
   */
  async update(id, postData) {
    try {
      const response = await apiRequest(`/posts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(postData)
      });
      console.log('[BlogManager] Post atualizado:', id);
      return response.data;
    } catch (error) {
      console.error('[BlogManager] Erro ao atualizar:', error);
      throw error;
    }
  },

  /**
   * Exclui post
   * @param {string} id 
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    try {
      await apiRequest(`/posts/${id}`, {
        method: 'DELETE'
      });
      console.log('[BlogManager] Post excluído:', id);
      return true;
    } catch (error) {
      console.error('[BlogManager] Erro ao excluir:', error);
      return false;
    }
  },

  /**
   * Posts recentes
   * @param {number} limit 
   * @returns {Promise<Array>}
   */
  async getRecent(limit = 5) {
    try {
      const response = await apiRequest(`/public/posts/recent/${limit}`);
      return response.data || [];
    } catch (error) {
      console.error('[BlogManager] Erro ao buscar recentes:', error);
      return [];
    }
  }
};

// ===========================================
// GERENCIADOR DE UPLOADS
// ===========================================

/**
 * Explicação do objeto [UploadManager]
 * Gerencia upload de imagens via API.
 */
const UploadManager = {
  /**
   * Faz upload de uma imagem
   * @param {File} file 
   * @returns {Promise<object>} Dados do upload
   */
  async upload(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiRequest('/uploads', {
      method: 'POST',
      body: formData
    });
    
    console.log('[UploadManager] Upload realizado:', response.data?.filename);
    return response.data;
  },

  /**
   * Faz upload de múltiplas imagens
   * @param {FileList|Array<File>} files 
   * @returns {Promise<Array>}
   */
  async uploadMultiple(files) {
    const formData = new FormData();
    
    for (const file of files) {
      formData.append('files', file);
    }
    
    const response = await apiRequest('/uploads/multiple', {
      method: 'POST',
      body: formData
    });
    
    console.log('[UploadManager] Uploads realizados:', response.data?.length);
    return response.data || [];
  },

  /**
   * Exclui uma imagem
   * @param {string} id 
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    try {
      await apiRequest(`/uploads/${id}`, {
        method: 'DELETE'
      });
      return true;
    } catch (error) {
      console.error('[UploadManager] Erro ao excluir:', error);
      return false;
    }
  }
};

// ===========================================
// GERENCIADOR DE CONFIGURAÇÕES DE PAGAMENTO
// ===========================================

/**
 * Explicação do objeto [PaymentConfigManager]
 * Gerencia configurações de pagamento via API.
 */
const PaymentConfigManager = {
  GATEWAYS: {
    ASAAS: 'asaas',
    MERCADO_PAGO: 'mercadopago',
    STRIPE: 'stripe'
  },

  /**
   * Lista todas as configurações
   * @returns {Promise<Array>}
   */
  async getAll() {
    try {
      const response = await apiRequest('/payment-config');
      return response.data || [];
    } catch (error) {
      console.error('[PaymentConfig] Erro ao listar:', error);
      return [];
    }
  },

  /**
   * Busca configuração de um gateway
   * @param {string} gateway 
   * @returns {Promise<object|null>}
   */
  async getGatewayConfig(gateway) {
    try {
      const response = await apiRequest(`/payment-config/${gateway}`);
      return response.data || null;
    } catch (error) {
      console.error('[PaymentConfig] Erro ao buscar:', error);
      return null;
    }
  },

  /**
   * Atualiza configuração de um gateway
   * @param {string} gateway 
   * @param {object} config 
   * @returns {Promise<object|null>}
   */
  async updateGatewayConfig(gateway, config) {
    try {
      const response = await apiRequest(`/payment-config/${gateway}`, {
        method: 'POST',
        body: JSON.stringify(config)
      });
      return response.data;
    } catch (error) {
      console.error('[PaymentConfig] Erro ao atualizar:', error);
      throw error;
    }
  },

  /**
   * Ativa um gateway
   * @param {string} gateway 
   * @returns {Promise<object|null>}
   */
  async setActiveGateway(gateway) {
    try {
      const response = await apiRequest(`/payment-config/${gateway}/activate`, {
        method: 'PATCH'
      });
      return response.data;
    } catch (error) {
      console.error('[PaymentConfig] Erro ao ativar:', error);
      throw error;
    }
  }
};

// ===========================================
// ESTATÍSTICAS DO DASHBOARD
// ===========================================

/**
 * Explicação do objeto [DashboardStats]
 * Busca estatísticas para o dashboard.
 */
const DashboardStats = {
  /**
   * Retorna estatísticas gerais
   * @returns {Promise<object>}
   */
  async getStats() {
    try {
      // Busca dados das duas rotas
      const [excursoes, posts] = await Promise.all([
        ExcursaoManager.getAll(false),
        BlogManager.getAll(false)
      ]);

      return {
        totalPosts: posts.length,
        postsPublicados: posts.filter(p => p.status === 'PUBLICADO').length,
        postsRascunho: posts.filter(p => p.status === 'RASCUNHO').length,
        totalExcursoes: excursoes.length,
        excursoesAtivas: excursoes.filter(e => e.status === 'ATIVO').length,
        excursoesInativas: excursoes.filter(e => e.status === 'INATIVO').length,
        reservas: Math.floor(Math.random() * 50) + 100,
        visitantes: (Math.random() * 3 + 1).toFixed(1) + 'k'
      };
    } catch (error) {
      console.error('[DashboardStats] Erro:', error);
      return {
        totalPosts: 0,
        postsPublicados: 0,
        postsRascunho: 0,
        totalExcursoes: 0,
        excursoesAtivas: 0,
        excursoesInativas: 0,
        reservas: 0,
        visitantes: '0'
      };
    }
  }
};

// ===========================================
// COMPATIBILIDADE COM CÓDIGO LEGADO
// ===========================================

// Storage helper (mantido para compatibilidade)
const Storage = {
  set: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
  get: (key) => {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  },
  remove: (key) => localStorage.removeItem(key),
  clear: () => localStorage.clear()
};

// ===========================================
// INICIALIZAÇÃO
// ===========================================

/**
 * Inicializa os gerenciadores
 */
function initDataManagers() {
  console.log('[API Client] Inicializado');
  console.log('[API Client] URL:', API_CONFIG.BASE_URL);
  console.log('[API Client] Autenticado:', AuthManager.isAuthenticated());
}

// Inicializa quando DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDataManagers);
} else {
  initDataManagers();
}

// ===========================================
// EXPORTAÇÃO GLOBAL
// ===========================================

window.API_CONFIG = API_CONFIG;
window.apiRequest = apiRequest;
window.AuthManager = AuthManager;
window.ExcursaoManager = ExcursaoManager;
window.BlogManager = BlogManager;
window.UploadManager = UploadManager;
window.PaymentConfigManager = PaymentConfigManager;
window.DashboardStats = DashboardStats;
window.Storage = Storage;
window.formatDateBR = formatDateBR;
window.formatDateISO = formatDateISO;
window.slugify = slugify;

/**
 * Gerenciador de Autenticação de Cliente
 * Gerencia tokens JWT, login, logout e verificação de autenticação
 */

class ClienteAuthManager {
    constructor() {
        this.TOKEN_KEY = 'cliente_auth_token';
        this.CLIENTE_KEY = 'cliente_data';
        this.API_BASE_URL = window.location.hostname === 'localhost' 
            ? 'http://localhost:3001/api'
            : (window.location.origin + '/api');
    }

    /**
     * Salva token e dados do cliente no localStorage
     */
    saveAuth(token, clienteData) {
        localStorage.setItem(this.TOKEN_KEY, token);
        localStorage.setItem(this.CLIENTE_KEY, JSON.stringify(clienteData));
        console.log('[Auth] Cliente autenticado:', clienteData.email);
    }

    /**
     * Retorna o token JWT armazenado
     */
    getToken() {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    /**
     * Retorna os dados do cliente armazenados
     */
    getCliente() {
        const data = localStorage.getItem(this.CLIENTE_KEY);
        return data ? JSON.parse(data) : null;
    }

    /**
     * Verifica se cliente está autenticado
     */
    isAuthenticated() {
        return !!this.getToken();
    }

    /**
     * Remove token e dados do cliente (logout)
     */
    logout() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.CLIENTE_KEY);
        console.log('[Auth] Cliente deslogado');
    }

    /**
     * Verifica se o token é válido chamando a API
     */
    async verifyToken() {
        const token = this.getToken();
        if (!token) {
            return false;
        }

        try {
            const response = await fetch(`${this.API_BASE_URL}/cliente/auth/verify`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                // Atualiza dados do cliente
                this.saveAuth(token, data.data.cliente);
                return true;
            } else {
                // Token inválido ou expirado
                this.logout();
                return false;
            }
        } catch (error) {
            console.error('[Auth] Erro ao verificar token:', error);
            return false;
        }
    }

    /**
     * Faz login com email e senha
     */
    async login(email, password) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/cliente/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao fazer login');
            }

            // Salva autenticação
            this.saveAuth(data.data.token, data.data.cliente);

            return { success: true, data: data.data };
        } catch (error) {
            console.error('[Auth] Erro no login:', error);
            return { 
                success: false, 
                error: error.message || 'Erro ao fazer login'
            };
        }
    }

    /**
     * Registra novo cliente
     */
    async register(dados) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/cliente/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dados)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao criar conta');
            }

            return { success: true, data: data.data };
        } catch (error) {
            console.error('[Auth] Erro no registro:', error);
            return { 
                success: false, 
                error: error.message || 'Erro ao criar conta'
            };
        }
    }

    /**
     * Inicia fluxo de login com Google
     */
    loginWithGoogle() {
        // Redireciona para endpoint de OAuth do Google
        window.location.href = `${this.API_BASE_URL}/cliente/auth/google`;
    }

    /**
     * Processa token do OAuth (captura da URL após redirect)
     */
    async processOAuthCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const error = urlParams.get('error');

        if (error) {
            console.error('[Auth] Erro no OAuth:', error);
            return { 
                success: false, 
                error: this.getOAuthErrorMessage(error)
            };
        }

        if (token) {
            try {
                // Verifica token e busca dados do cliente
                const response = await fetch(`${this.API_BASE_URL}/cliente/auth/me`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Token inválido');
                }

                const data = await response.json();
                this.saveAuth(token, data.data);

                // Limpa URL
                window.history.replaceState({}, document.title, window.location.pathname);

                return { success: true, data: data.data };
            } catch (error) {
                console.error('[Auth] Erro ao processar OAuth:', error);
                return { 
                    success: false, 
                    error: 'Erro ao processar autenticação'
                };
            }
        }

        return { success: false };
    }

    /**
     * Traduz erros de OAuth para mensagens amigáveis
     */
    getOAuthErrorMessage(error) {
        const messages = {
            'google_auth_denied': 'Você negou a autorização. Tente novamente.',
            'google_auth_failed': 'Erro ao autenticar com Google. Tente novamente.'
        };
        return messages[error] || 'Erro na autenticação com Google';
    }

    /**
     * Protege página que requer autenticação
     * Redireciona para login se não estiver autenticado
     */
    async requireAuth() {
        if (!this.isAuthenticated()) {
            console.warn('[Auth] Cliente não autenticado, redirecionando...');
            window.location.href = '/cliente/login.html';
            return false;
        }

        // Verifica se token ainda é válido
        const isValid = await this.verifyToken();
        if (!isValid) {
            console.warn('[Auth] Token inválido, redirecionando...');
            window.location.href = '/cliente/login.html';
            return false;
        }

        return true;
    }

    /**
     * Faz requisição autenticada à API
     */
    async fetchAuth(url, options = {}) {
        const token = this.getToken();
        if (!token) {
            throw new Error('Cliente não autenticado');
        }

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers
        };

        const response = await fetch(`${this.API_BASE_URL}${url}`, {
            ...options,
            headers
        });

        // Se 401, token expirou
        if (response.status === 401) {
            this.logout();
            window.location.href = '/cliente/login.html';
            throw new Error('Sessão expirada');
        }

        return response;
    }
}

// Instância global
window.clienteAuth = new ClienteAuthManager();

// Bind global do botão Sair (todas as páginas do cliente)
document.addEventListener('DOMContentLoaded', function () {
    const logoutBtn = document.getElementById('logoutBtn') || document.querySelector('.btn-logout');
    if (logoutBtn && window.clienteAuth) {
        logoutBtn.addEventListener('click', function () {
            window.clienteAuth.logout();
            window.location.href = '/cliente/login.html';
        });
    }
});

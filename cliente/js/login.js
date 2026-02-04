/**
 * JavaScript da página de login do cliente
 */

// Elementos do DOM
const loginForm = document.getElementById('loginForm');
const loginBtn = document.getElementById('loginBtn');
const googleLoginBtn = document.getElementById('googleLoginBtn');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const successMessage = document.getElementById('successMessage');
const successText = document.getElementById('successText');

// Funções de UI
function showError(message) {
    errorText.textContent = message;
    errorMessage.classList.add('show');
    successMessage.classList.remove('show');
}

function showSuccess(message) {
    successText.textContent = message;
    successMessage.classList.add('show');
    errorMessage.classList.remove('show');
}

function hideMessages() {
    errorMessage.classList.remove('show');
    successMessage.classList.remove('show');
}

function setLoading(isLoading) {
    if (isLoading) {
        loginBtn.classList.add('loading');
        loginBtn.disabled = true;
        googleLoginBtn.disabled = true;
    } else {
        loginBtn.classList.remove('loading');
        loginBtn.disabled = false;
        googleLoginBtn.disabled = false;
    }
}

// Verificar se já está autenticado
if (clienteAuth.isAuthenticated()) {
    console.log('[Login] Cliente já autenticado, redirecionando...');
    window.location.href = '/cliente/dashboard.html';
}

// Processar OAuth callback (se vier da URL)
(async () => {
    const result = await clienteAuth.processOAuthCallback();
    if (result.success) {
        showSuccess('Login realizado com sucesso!');
        setTimeout(() => {
            window.location.href = '/cliente/dashboard.html';
        }, 1000);
    } else if (result.error) {
        showError(result.error);
    }
})();

// Handler do form de login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideMessages();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    // Validação básica
    if (!email || !password) {
        showError('Preencha todos os campos');
        return;
    }

    setLoading(true);

    try {
        console.log('[Login] Tentando login com email:', email);
        const result = await clienteAuth.login(email, password);

        if (result.success) {
            console.log('[Login] Login bem-sucedido');
            showSuccess('Login realizado com sucesso!');
            
            // Aguarda um pouco para mostrar mensagem
            setTimeout(() => {
                window.location.href = '/cliente/dashboard.html';
            }, 1000);
        } else {
            console.error('[Login] Falha no login:', result.error);
            showError(result.error);
            setLoading(false);
        }
    } catch (error) {
        console.error('[Login] Erro no login:', error);
        showError('Erro ao fazer login. Tente novamente.');
        setLoading(false);
    }
});

// Handler do botão Google
googleLoginBtn.addEventListener('click', () => {
    console.log('[Login] Iniciando login com Google');
    hideMessages();
    clienteAuth.loginWithGoogle();
});

// Mensagens de erro da URL
const urlParams = new URLSearchParams(window.location.search);
const urlError = urlParams.get('error');
if (urlError) {
    showError(clienteAuth.getOAuthErrorMessage(urlError));
    // Limpa URL
    window.history.replaceState({}, document.title, window.location.pathname);
}

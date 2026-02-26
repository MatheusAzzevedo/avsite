/**
 * Explicação do Arquivo [login.js]
 *
 * Script de login do painel admin. Contém a lógica de autenticação,
 * preenchimento de credenciais salvas e redirecionamento.
 * Externalizado para compatibilidade com Content-Security-Policy (CSP)
 * do Helmet - evita bloqueio de scripts inline.
 */

/**
 * Explicação da função [handleLogin]
 * Processa o formulário de login e autentica via API.
 *
 * @param {Event} event - Evento de submit do formulário
 */
async function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const loginBtn = document.getElementById('loginBtn');
  const errorDiv = document.getElementById('errorMessage');
  const errorText = document.getElementById('errorText');

  errorDiv.classList.remove('show');
  loginBtn.classList.add('loading');
  loginBtn.disabled = true;

  try {
    console.log('[Login] Tentando login:', email);
    const response = await AuthManager.login(email, password);

    if (response.success) {
      console.log('[Login] Sucesso! Redirecionando...');
      window.location.href = 'dashboard.html';
    } else {
      throw new Error(response.error || 'Erro ao fazer login');
    }
  } catch (error) {
    console.error('[Login] Erro:', error);
    errorText.textContent = error.message || 'Email ou senha incorretos';
    errorDiv.classList.add('show');
  } finally {
    loginBtn.classList.remove('loading');
    loginBtn.disabled = false;
  }
}

/**
 * Explicação da função [preencheCredenciaisURL]
 * Preenche email e senha a partir de parâmetros de URL (query string).
 * Útil para links de teste. Não persiste em localStorage.
 */
function preencheCredenciaisURL() {
  const params = new URLSearchParams(window.location.search);
  const email = params.get('email');
  const password = params.get('password');

  if (email) {
    document.getElementById('email').value = email;
  }
  if (password) {
    document.getElementById('password').value = password;
  }
}

/**
 * Explicação da função [showAdminForm]
 * Ao clicar em "Admin Site Avoar": exibe o formulário de login, oculta o botão,
 * e troca o background para o mosaico do login do cliente.
 */
function showAdminForm() {
  const adminFormSection = document.getElementById('adminFormSection');
  const adminSiteBtnWrap = document.getElementById('adminSiteBtnWrap');
  const loginBgCliente = document.getElementById('loginBgCliente');

  if (adminFormSection) adminFormSection.classList.add('visible');
  if (adminSiteBtnWrap) adminSiteBtnWrap.classList.add('hidden');
  if (loginBgCliente) loginBgCliente.classList.add('visible');
  document.body.classList.add('bg-cliente');
}

document.addEventListener('DOMContentLoaded', function () {
  // Botão "Admin Site Avoar": ao clicar, mostra formulário e troca background
  const adminSiteBtn = document.getElementById('adminSiteBtn');
  if (adminSiteBtn) {
    adminSiteBtn.addEventListener('click', showAdminForm);
  }

  // Redireciona se já autenticado
  if (AuthManager.isAuthenticated()) {
    AuthManager.verifyToken().then((valid) => {
      if (valid) {
        window.location.href = 'dashboard.html';
      } else {
        AuthManager.logout();
      }
    });
  }

  // Preenche credenciais salvas (Lembrar-me)
  const savedEmail = localStorage.getItem('avorar_saved_email');
  if (savedEmail) {
    document.getElementById('email').value = savedEmail;
    document.getElementById('remember').checked = true;
  }

  // Preenche credenciais da URL (ex: ?email=admin@avorar.com&password=admin123)
  preencheCredenciaisURL();

  // Handler de submit do formulário
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);

    // Salva email quando "Lembrar-me" está marcado
    loginForm.addEventListener('submit', function () {
      const remember = document.getElementById('remember').checked;
      const email = document.getElementById('email').value;

      if (remember) {
        localStorage.setItem('avorar_saved_email', email);
      } else {
        localStorage.removeItem('avorar_saved_email');
      }
    });
  }

  // Previne ação padrão do link "Esqueceu a senha" (sem inline onclick)
  const forgotLink = document.querySelector('.forgot-password a');
  if (forgotLink) {
    forgotLink.addEventListener('click', function (e) {
      e.preventDefault();
    });
  }
});

/**
 * JavaScript da página de reset de senha do cliente
 */
const resetForm = document.getElementById('resetForm');
const resetWrapper = document.getElementById('resetWrapper');
const invalidToken = document.getElementById('invalidToken');
const submitBtn = document.getElementById('submitBtn');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const successMessage = document.getElementById('successMessage');
const successText = document.getElementById('successText');

// Captura token da URL
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('resetToken') || urlParams.get('token');


// Verifica se existe token
if (!token) {
    resetWrapper.style.display = 'none';
    invalidToken.style.display = 'flex';
}

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

function setLoading(isLoading) {
    if (isLoading) {
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
    } else {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
    }
}

resetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMessage.classList.remove('show');
    successMessage.classList.remove('show');

    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validações básicas
    if (password.length < 8) {
        showError('A senha deve ter no mínimo 8 caracteres.');
        return;
    }

    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!hasUpper || !hasLower || !hasNumber) {
        showError('A senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número.');
        return;
    }

    if (password !== confirmPassword) {
        showError('As senhas não coincidem.');
        return;
    }

    setLoading(true);

    try {
        const result = await window.clienteAuth.resetPassword(token, password);

        if (result.success) {
            showSuccess('Senha alterada com sucesso! Redirecionando para o login...');
            resetForm.reset();

            // Redireciona após 2 segundos
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } else {
            showError(result.error || 'Erro ao redefinir senha. O link pode ter expirado.');
        }
    } catch (error) {
        console.error('[Reset] Erro:', error);
        showError('Erro de conexão. Tente novamente.');
    } finally {
        setLoading(false);
    }
});

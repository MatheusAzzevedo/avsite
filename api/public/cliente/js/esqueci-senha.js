/**
 * JavaScript da página de esqueci a senha do cliente
 */

const forgotForm = document.getElementById('forgotForm');
const submitBtn = document.getElementById('submitBtn');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const successMessage = document.getElementById('successMessage');
const successText = document.getElementById('successText');

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

forgotForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMessage.classList.remove('show');
    successMessage.classList.remove('show');

    const email = document.getElementById('email').value.trim();

    if (!email) {
        showError('Por favor, informe seu e-mail.');
        return;
    }

    setLoading(true);

    try {
        const result = await window.clienteAuth.forgotPassword(email);

        if (result.success) {
            showSuccess(result.message || 'Instruções enviadas para o seu e-mail!');
            forgotForm.reset();
        } else {
            showError(result.error || 'Erro ao processar solicitação.');
        }
    } catch (error) {
        console.error('[Forgot] Erro:', error);
        showError('Erro de conexão. Tente novamente.');
    } finally {
        setLoading(false);
    }
});

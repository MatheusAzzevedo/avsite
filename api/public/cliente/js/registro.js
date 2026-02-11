/**
 * JavaScript da página de registro
 */

const registerForm = document.getElementById('registerForm');
const registerBtn = document.getElementById('registerBtn');
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

function hideMessages() {
    errorMessage.classList.remove('show');
    successMessage.classList.remove('show');
}

function setLoading(isLoading) {
    registerBtn.classList.toggle('loading', isLoading);
    registerBtn.disabled = isLoading;
}

// Se já autenticado, redireciona
if (clienteAuth.isAuthenticated()) {
    window.location.href = '/cliente/dashboard.html';
}

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideMessages();

    const dados = {
        nome: document.getElementById('nome').value.trim(),
        email: document.getElementById('email').value.trim(),
        telefone: document.getElementById('telefone').value.trim() || undefined,
        password: document.getElementById('password').value
    };

    if (!dados.nome || !dados.email || !dados.password) {
        showError('Preencha todos os campos obrigatórios');
        return;
    }

    setLoading(true);

    try {
        const result = await clienteAuth.register(dados);

        if (result.success) {
            showSuccess('Conta criada com sucesso! Redirecionando...');
            setTimeout(() => {
                window.location.href = '/cliente/login.html';
            }, 2000);
        } else {
            showError(result.error);
            setLoading(false);
        }
    } catch (error) {
        console.error('[Registro] Erro:', error);
        showError('Erro ao criar conta. Tente novamente.');
        setLoading(false);
    }
});

/**
 * JavaScript da página de registro
 */

const registerForm = document.getElementById('registerForm');
const registerBtn = document.getElementById('registerBtn');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const successMessage = document.getElementById('successMessage');
const successText = document.getElementById('successText');

/** Formata telefone como (XX) XXXXX-XXXX (máx. 11 dígitos). */
function formatPhoneBr(value) {
    const d = String(value).replace(/\D/g, '').slice(0, 11);
    if (d.length <= 2) return d.length ? '(' + d : '';
    if (d.length <= 7) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
    return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7, 11);
}

/** Aplica máscara de telefone no input: formatação automática durante a digitação. */
function applyPhoneMask(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener('input', function () {
        const digits = inputEl.value.replace(/\D/g, '').slice(0, 11);
        const formatted = formatPhoneBr(digits);
        inputEl.value = formatted;
        inputEl.setSelectionRange(formatted.length, formatted.length);
    });
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
    window.location.href = '/cliente/inicio.html';
}

// Aplica máscara de telefone
applyPhoneMask(document.getElementById('telefone'));

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideMessages();

    const dados = {
        nome: document.getElementById('nome').value.trim(),
        email: document.getElementById('email').value.trim(),
        telefone: document.getElementById('telefone').value.trim(),
        password: document.getElementById('password').value
    };

    if (!dados.nome || !dados.email || !dados.telefone || !dados.password) {
        showError('Preencha todos os campos obrigatórios');
        return;
    }

    const phoneDigits = dados.telefone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
        showError('Telefone inválido. Informe DDD + número com 8 ou 9 dígitos.');
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

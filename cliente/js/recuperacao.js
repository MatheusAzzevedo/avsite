/**
 * Gerenciador de Recuperação de Senha
 */

const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3001/api'
    : '/api';

document.addEventListener('DOMContentLoaded', () => {
    // Formulário de Esqueci Senha
    const forgotForm = document.getElementById('forgotForm');
    if (forgotForm) {
        forgotForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const submitBtn = document.getElementById('submitBtn');
            const errorMsg = document.getElementById('errorMessage');
            const successMsg = document.getElementById('successMessage');
            
            // Reset mensagens
            errorMsg.classList.remove('show');
            successMsg.classList.remove('show');
            
            // Loading state
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;

            try {
                const response = await fetch(`${API_BASE_URL}/cliente/auth/forgot-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });

                const data = await response.json();

                if (response.ok) {
                    successMsg.classList.add('show');
                    document.getElementById('successText').textContent = data.message;
                    forgotForm.reset();
                } else {
                    throw new Error(data.error || 'Erro ao solicitar recuperação.');
                }
            } catch (error) {
                errorMsg.classList.add('show');
                document.getElementById('errorText').textContent = error.message;
            } finally {
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
            }
        });
    }

    // Formulário de Reset Senha
    const resetForm = document.getElementById('resetForm');
    if (resetForm) {
        // Pega token da URL
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');

        if (!token) {
            const errorMsg = document.getElementById('errorMessage');
            errorMsg.classList.add('show');
            document.getElementById('errorText').textContent = 'Token de recuperação ausente ou inválido.';
            document.getElementById('submitBtn').disabled = true;
        }

        resetForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const submitBtn = document.getElementById('submitBtn');
            const errorMsg = document.getElementById('errorMessage');
            const successMsg = document.getElementById('successMessage');
            
            // Valida senhas iguais
            if (password !== confirmPassword) {
                errorMsg.classList.add('show');
                document.getElementById('errorText').textContent = 'As senhas não coincidem.';
                return;
            }

            // Reset mensagens
            errorMsg.classList.remove('show');
            successMsg.classList.remove('show');
            
            // Loading state
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;

            try {
                const response = await fetch(`${API_BASE_URL}/cliente/auth/reset-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token, password })
                });

                const data = await response.json();

                if (response.ok) {
                    successMsg.classList.add('show');
                    document.getElementById('successText').textContent = data.message + ' Redirecionando para login...';
                    
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 3000);
                } else {
                    throw new Error(data.error || 'Erro ao alterar senha.');
                }
            } catch (error) {
                errorMsg.classList.add('show');
                document.getElementById('errorText').textContent = error.message;
            } finally {
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
            }
        });
    }
});

/**
 * Página Configurações do cliente - perfil e alteração de senha.
 * Menu mobile (hamburger/sidebar) e logout externalizados para compatibilidade com CSP.
 */
(function() {
    function initMobileMenu() {
        var sidebar = document.getElementById('sidebar');
        var overlay = document.getElementById('sidebarOverlay');
        var hamburgerBtn = document.getElementById('hamburgerBtn');
        var closeBtn = document.getElementById('closeSidebarBtn');

        function openSidebar(e) {
            if (e && e.type === 'touchend') e.preventDefault();
            if (sidebar && overlay) {
                sidebar.classList.add('open');
                overlay.classList.add('open');
                overlay.style.display = 'block';
                document.body.style.overflow = 'hidden';
            }
        }

        function closeSidebar(e) {
            if (e && e.type === 'touchend') e.preventDefault();
            if (sidebar && overlay) {
                sidebar.classList.remove('open');
                overlay.classList.remove('open');
                overlay.style.display = '';
                document.body.style.overflow = '';
            }
        }

        if (hamburgerBtn) {
            hamburgerBtn.addEventListener('click', openSidebar);
            hamburgerBtn.addEventListener('touchend', function(e) { e.preventDefault(); openSidebar(e); }, { passive: false });
        }
        if (closeBtn) {
            closeBtn.addEventListener('click', closeSidebar);
            closeBtn.addEventListener('touchend', closeSidebar, { passive: false });
        }
        if (overlay) {
            overlay.addEventListener('click', closeSidebar);
            overlay.addEventListener('touchend', closeSidebar, { passive: false });
        }
        document.querySelectorAll('.sidebar-link').forEach(function(link) {
            link.addEventListener('click', closeSidebar);
        });
    }

    function bindLogout() {
        document.querySelectorAll('.btn-logout').forEach(function(btn) {
            btn.addEventListener('click', function() {
                if (window.clienteAuth) window.clienteAuth.logout();
                window.location.href = '/cliente/login.html';
            });
        });
    }

    async function init() {
        if (!window.clienteAuth) return;
        await window.clienteAuth.requireAuth();

        try {
            var response = await window.clienteAuth.fetchAuth('/cliente/auth/me');
            var data = await response.json();

            if (data.success) {
                document.getElementById('nome').value = data.data.nome;
                document.getElementById('email').value = data.data.email;
                document.getElementById('telefone').value = data.data.telefone || '';

                var authProvider = data.data.authProvider || 'LOCAL';
                if (authProvider === 'GOOGLE') {
                    document.getElementById('senhaForm').style.display = 'none';
                    document.getElementById('oauthNotice').style.display = 'block';
                } else {
                    document.getElementById('senhaForm').style.display = 'block';
                    document.getElementById('oauthNotice').style.display = 'none';
                }
            }
        } catch (error) {
            console.error('Erro:', error);
            document.getElementById('senhaForm').style.display = 'block';
            document.getElementById('oauthNotice').style.display = 'none';
        }

        var telefoneInput = document.getElementById('telefone');
        if (telefoneInput) {
            telefoneInput.addEventListener('input', function() {
                var v = this.value.replace(/\D/g, '');
                if (v.length > 11) v = v.slice(0, 11);
                if (v.length > 6) {
                    this.value = '(' + v.slice(0, 2) + ') ' + v.slice(2, 7) + '-' + v.slice(7);
                } else if (v.length > 2) {
                    this.value = '(' + v.slice(0, 2) + ') ' + v.slice(2);
                } else if (v.length > 0) {
                    this.value = '(' + v;
                }
            });
        }

        document.getElementById('profileForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            var dados = {
                nome: document.getElementById('nome').value.trim(),
                email: document.getElementById('email').value.trim().toLowerCase(),
                telefone: document.getElementById('telefone').value.trim() || undefined
            };
            try {
                var response = await window.clienteAuth.fetchAuth('/cliente/auth/profile', {
                    method: 'PUT',
                    body: JSON.stringify(dados)
                });
                var data = await response.json();
                if (response.ok) {
                    var successDiv = document.getElementById('successMessage');
                    successDiv.textContent = '✓ Dados atualizados com sucesso!';
                    successDiv.classList.add('show');
                    setTimeout(function() { successDiv.classList.remove('show'); }, 4000);
                    var cliente = window.clienteAuth.getCliente();
                    window.clienteAuth.saveAuth(window.clienteAuth.getToken(), Object.assign({}, cliente, data.data));
                } else {
                    alert(data.error || 'Erro ao atualizar dados');
                }
            } catch (error) {
                console.error('Erro:', error);
                alert('Erro ao atualizar dados');
            }
        });

        document.getElementById('senhaForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            var senhaAtual = document.getElementById('senhaAtual').value;
            var novaSenha = document.getElementById('novaSenha').value;
            var confirmarSenha = document.getElementById('confirmarSenha').value;
            var successDiv = document.getElementById('senhaSuccessMessage');
            var errorDiv = document.getElementById('senhaErrorMessage');
            successDiv.classList.remove('show');
            errorDiv.style.display = 'none';

            if (novaSenha !== confirmarSenha) {
                errorDiv.textContent = 'A nova senha e a confirmação não coincidem.';
                errorDiv.style.display = 'block';
                return;
            }
            if (novaSenha.length < 8) {
                errorDiv.textContent = 'A nova senha deve ter no mínimo 8 caracteres.';
                errorDiv.style.display = 'block';
                return;
            }
            var hasUpper = /[A-Z]/.test(novaSenha);
            var hasLower = /[a-z]/.test(novaSenha);
            var hasNumber = /\d/.test(novaSenha);
            if (!hasUpper || !hasLower || !hasNumber) {
                errorDiv.textContent = 'A nova senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número.';
                errorDiv.style.display = 'block';
                return;
            }
            try {
                var response = await window.clienteAuth.fetchAuth('/cliente/auth/change-password', {
                    method: 'PUT',
                    body: JSON.stringify({
                        currentPassword: senhaAtual,
                        newPassword: novaSenha
                    })
                });
                var data = await response.json();
                if (response.ok && data.success) {
                    successDiv.textContent = '✓ Senha alterada com sucesso!';
                    successDiv.classList.add('show');
                    setTimeout(function() { successDiv.classList.remove('show'); }, 4000);
                    document.getElementById('senhaForm').reset();
                } else {
                    errorDiv.textContent = data.error || 'Erro ao alterar senha.';
                    errorDiv.style.display = 'block';
                }
            } catch (error) {
                console.error('Erro:', error);
                errorDiv.textContent = 'Erro ao alterar senha. Tente novamente.';
                errorDiv.style.display = 'block';
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            initMobileMenu();
            bindLogout();
            init();
        });
    } else {
        initMobileMenu();
        bindLogout();
        init();
    }
})();

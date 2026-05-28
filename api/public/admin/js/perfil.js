document.addEventListener('DOMContentLoaded', async () => {
    const perfilForm = document.getElementById('perfilForm');
    const senhaForm = document.getElementById('senhaForm');
    const avatarPreview = document.getElementById('avatarPreview');
    const avatarInitials = document.getElementById('avatarInitials');
    const avatarUrlInput = document.getElementById('avatarUrl');
    const avatarUploadInput = document.getElementById('avatarUpload');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const topAvatar = document.getElementById('topAvatar');

    let currentUser = null;

    // Carregar dados
    async function carregarDados() {
        try {
            const response = await window.apiRequest('/auth/me');
            const user = response.data;
            currentUser = user;
            nameInput.value = user.name;
            emailInput.value = user.email;
            if (user.avatarUrl) {
                avatarUrlInput.value = user.avatarUrl;
            }
            atualizarPreview();
        } catch (error) {
            console.error('Erro ao carregar perfil:', error);
            alert('Não foi possível carregar os dados do perfil.');
        }
    }

    function atualizarPreview() {
        const url = avatarUrlInput.value;
        const name = nameInput.value || 'AD';
        
        if (url) {
            avatarPreview.src = url;
            avatarPreview.style.display = 'block';
            avatarInitials.style.display = 'none';
        } else {
            avatarInitials.textContent = name.substring(0, 2).toUpperCase();
            avatarInitials.style.display = 'block';
            avatarPreview.style.display = 'none';
        }
        
        // Atualiza avatar do topo também se estiver vazio
        if(url && topAvatar) {
            topAvatar.innerHTML = `<img src="${url}" alt="Avatar" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
        }
    }

    avatarUrlInput.addEventListener('input', atualizarPreview);
    nameInput.addEventListener('input', atualizarPreview);

    // Upload de imagem
    avatarUploadInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const token = localStorage.getItem('avorar_token');
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch(window.API_CONFIG.BASE_URL + '/uploads', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            const result = await res.json();

            if (result.success) {
                // Tenta pegar a URL do upload
                avatarUrlInput.value = result.data.url || result.data.filename;
                atualizarPreview();
            } else {
                alert('Erro no upload: ' + (result.error || 'Erro desconhecido'));
            }
        } catch (error) {
            console.error(error);
            alert('Erro ao realizar upload.');
        }
    });

    perfilForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btnSalvar');
        btn.disabled = true;
        btn.textContent = 'Salvando...';

        try {
            const response = await window.apiRequest('/auth/me', {
                method: 'PUT',
                body: JSON.stringify({
                    name: nameInput.value,
                    avatarUrl: avatarUrlInput.value
                })
            });
            
            alert('Perfil atualizado com sucesso!');
            // Atualiza topo
            document.getElementById('userName').textContent = response.data.name;
        } catch (error) {
            alert('Erro ao salvar: ' + error.message);
        } finally {
            btn.disabled = false;
            btn.textContent = 'Salvar Alterações';
        }
    });

    senhaForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btnSenha');
        btn.disabled = true;
        btn.textContent = 'Atualizando...';

        try {
            await window.apiRequest('/auth/change-password', {
                method: 'PUT',
                body: JSON.stringify({
                    currentPassword: document.getElementById('currentPassword').value,
                    newPassword: document.getElementById('newPassword').value
                })
            });
            alert('Senha atualizada com sucesso!');
            senhaForm.reset();
        } catch (error) {
            alert('Erro ao atualizar senha: ' + error.message);
        } finally {
            btn.disabled = false;
            btn.textContent = 'Atualizar Senha';
        }
    });

    carregarDados();
});

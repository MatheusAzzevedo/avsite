document.addEventListener('DOMContentLoaded', () => {
    // Verifica autenticação
    if (typeof AuthManager !== 'undefined') {
        AuthManager.checkAuth();
        const user = AuthManager.getUser();
        if (user && document.getElementById('userName')) {
            document.getElementById('userName').textContent = user.name || 'Administrador';
        }
    }

    // Referências DOM
    const autoresBody = document.getElementById('autoresBody');
    const emptyAutores = document.getElementById('emptyAutores');
    const autoresTable = document.getElementById('autoresTable');
    
    const btnNovoAutor = document.getElementById('btnNovoAutor');
    const modalAutor = document.getElementById('modalAutor');
    const modalTitle = document.getElementById('modalTitle');
    const modalClose = document.querySelector('.modal-close');
    const modalCancel = document.getElementById('modalCancel');
    const modalSave = document.getElementById('modalSave');
    
    const formAutor = document.getElementById('formAutor');
    const autorIdInput = document.getElementById('autorId');
    const nomeInput = document.getElementById('nome');
    const profissaoInput = document.getElementById('profissao');
    const descricaoInput = document.getElementById('descricao');
    const fileFoto = document.getElementById('fileFoto');
    const fotoUrlInput = document.getElementById('fotoUrl');
    const imgPreview = document.getElementById('imgPreview');

    // Carrega a lista de autores inicial
    loadAutores();

    // Eventos
    btnNovoAutor.addEventListener('click', () => openModal(null));
    modalClose.addEventListener('click', closeModal);
    modalCancel.addEventListener('click', closeModal);
    modalSave.addEventListener('click', saveAutor);

    // Fechar modal ao clicar fora
    modalAutor.addEventListener('click', (e) => {
        if (e.target === modalAutor) closeModal();
    });

    /**
     * Explicação da função [upload da foto do autor]
     *
     * A foto vai para o Cloudflare R2 e o campo guarda a URL. Antes era
     * convertida para Base64 e gravada na coluna `foto` (@db.Text), o que
     * fazia cada listagem de post carregar a imagem inteira do autor junto.
     *
     * Tipo e tamanho ficam a cargo de `UploadArquivo`, que espelha o limite do
     * servidor — o teto de 5 MB que existia aqui era mais apertado que o do
     * backend e levava o usuário a comprimir a imagem por fora antes de enviar.
     */
    fileFoto.addEventListener('change', async function() {
        const file = this.files[0];
        if (!file) return;

        fileFoto.disabled = true;

        const url = await UploadArquivo.preencherCampo(file, {
            dataInputId: 'fotoUrl',
            previewId: 'imgPreview'
        });

        fileFoto.disabled = false;

        // Limpa a seleção quando falha, para permitir tentar de novo com o
        // mesmo arquivo — sem isso o evento `change` não dispara na segunda vez.
        if (!url) fileFoto.value = '';
    });

    // Logout
    const navLogout = document.getElementById('navLogout');
    if (navLogout) {
        navLogout.addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof AuthManager !== 'undefined') {
                AuthManager.logout();
            }
        });
    }

    // Funções Auxiliares

    async function loadAutores() {
        try {
            const response = await apiRequest('/admin/autores');
            const data = response.data || [];
            
            autoresBody.innerHTML = '';
            
            if (data.length === 0) {
                autoresTable.style.display = 'none';
                emptyAutores.style.display = 'block';
                return;
            }

            autoresTable.style.display = 'table';
            emptyAutores.style.display = 'none';

            data.forEach(autor => {
                const tr = document.createElement('tr');
                
                const avatarSrc = autor.foto || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(autor.nome) + '&background=random';
                
                tr.innerHTML = `
                    <td><img src="${avatarSrc}" alt="Avatar" class="avatar-table"></td>
                    <td><strong>${autor.nome}</strong></td>
                    <td>${autor.profissao || '-'}</td>
                    <td>
                        <div style="display: flex; gap: 0.5rem;">
                            <button class="btn btn-sm btn-primary btn-edit" data-id="${autor.id}" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger btn-delete" data-id="${autor.id}" title="Excluir">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                `;
                autoresBody.appendChild(tr);
            });

            // Adiciona eventos aos botões recém-criados
            document.querySelectorAll('.btn-edit').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    editAutor(id);
                });
            });
            
            document.querySelectorAll('.btn-delete').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    deleteAutor(id);
                });
            });

        } catch (error) {
            console.error('Erro ao carregar autores:', error);
            alert('Erro ao carregar a lista de autores.');
        }
    }

    function openModal(autor = null) {
        formAutor.reset();
        imgPreview.style.display = 'none';
        imgPreview.src = '';
        fotoUrlInput.value = '';

        if (autor) {
            modalTitle.textContent = 'Editar Autor';
            autorIdInput.value = autor.id;
            nomeInput.value = autor.nome;
            profissaoInput.value = autor.profissao || '';
            descricaoInput.value = autor.descricao || '';
            
            if (autor.foto) {
                fotoUrlInput.value = autor.foto;
                imgPreview.src = autor.foto;
                imgPreview.style.display = 'block';
            }
        } else {
            modalTitle.textContent = 'Novo Autor';
            autorIdInput.value = '';
        }

        modalAutor.classList.remove('hidden');
    }

    function closeModal() {
        modalAutor.classList.add('hidden');
    }

    async function editAutor(id) {
        try {
            const response = await apiRequest('/admin/autores');
            const data = response.data || [];
            const autor = data.find(a => a.id === id);
            if (autor) {
                openModal(autor);
            }
        } catch (error) {
            console.error('Erro ao buscar autor para edição:', error);
        }
    }

    async function saveAutor() {
        if (!formAutor.checkValidity()) {
            formAutor.reportValidity();
            return;
        }

        const id = autorIdInput.value;
        const payload = {
            nome: nomeInput.value,
            profissao: profissaoInput.value,
            descricao: descricaoInput.value,
            foto: fotoUrlInput.value
        };

        try {
            const method = id ? 'PUT' : 'POST';
            const endpoint = id ? `/admin/autores/${id}` : '/admin/autores';
            
            const response = await apiRequest(endpoint, {
                method,
                body: JSON.stringify(payload)
            });

            if (response.success) {
                closeModal();
                loadAutores();
                if (typeof showToast !== 'undefined') {
                    showToast(`Autor ${id ? 'atualizado' : 'cadastrado'} com sucesso!`);
                }
            }
        } catch (error) {
            console.error('Erro ao salvar autor:', error);
            alert('Erro ao salvar os dados do autor.');
        }
    }

    async function deleteAutor(id) {
        if (confirm('Tem certeza que deseja excluir este autor?')) {
            try {
                const response = await apiRequest(`/admin/autores/${id}`, {
                    method: 'DELETE'
                });

                if (response.success) {
                    loadAutores();
                    if (typeof showToast !== 'undefined') {
                        showToast('Autor excluído com sucesso!');
                    }
                }
            } catch (error) {
                console.error('Erro ao excluir autor:', error);
                alert('Erro ao excluir o autor.');
            }
        }
    }
});

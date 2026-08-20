/**
 * Explicação do Arquivo [equipe.js]
 * 
 * Lógica para a tela de gerenciamento de equipe no painel admin.
 * Usa o api-client.js para fazer as requisições.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Verifica autenticação
    if (typeof AuthManager !== 'undefined') {
        AuthManager.checkAuth();
        const user = AuthManager.getUser();
        if (user && document.getElementById('userName')) {
            document.getElementById('userName').textContent = user.name || 'Administrador';
        }
    }

    // Elementos da página
    const equipeBody = document.getElementById('equipeBody');
    const loadingEquipe = document.getElementById('loadingEquipe');
    const emptyEquipe = document.getElementById('emptyEquipe');
    const btnNovoMembro = document.getElementById('btnNovoMembro');
    
    // Elementos do Modal
    const modalMembro = document.getElementById('modalMembro');
    const modalTitle = document.getElementById('modalTitle');
    const formMembro = document.getElementById('formMembro');
    const modalCancel = document.getElementById('modalCancel');
    const modalSave = document.getElementById('modalSave');
    const modalClose = document.querySelector('.modal-close');
    
    // Campos do formulário
    const membroIdInput = document.getElementById('membroId');
    const nomeInput = document.getElementById('nome');
    const dataNascimentoInput = document.getElementById('dataNascimento');
    const funcaoInput = document.getElementById('funcao');
    const ativoInput = document.getElementById('ativo');
    const fileFotoInput = document.getElementById('fileFoto');
    const fotoPerfilUrlInput = document.getElementById('fotoPerfilUrl');
    const imgPreview = document.getElementById('imgPreview');

    // Carrega a equipe inicial
    loadEquipe();

    // Eventos
    btnNovoMembro.addEventListener('click', () => openModal());
    modalCancel.addEventListener('click', closeModal);
    modalClose.addEventListener('click', closeModal);
    modalSave.addEventListener('click', saveMembro);
    
    // Fechar modal ao clicar fora
    modalMembro.addEventListener('click', (e) => {
        if (e.target === modalMembro) closeModal();
    });

    /**
     * Explicação da função [upload de foto do membro]
     *
     * A foto é enviada ao Cloudflare R2 e o campo passa a guardar a URL.
     * Antes ela era convertida para Base64 e gravada dentro do próprio
     * registro, o que fazia a página "Sobre Nós" carregar megabytes de texto
     * a cada visita e inchava o banco.
     *
     * Validação de tipo e tamanho ficam a cargo de `UploadArquivo`, que
     * espelha o limite do servidor — o antigo teto de 5 MB aqui era mais
     * apertado que o do backend e levava o usuário a comprimir a foto por
     * fora antes de enviar, degradando-a.
     */
    fileFotoInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        fileFotoInput.disabled = true;

        const url = await UploadArquivo.preencherCampo(file, {
            dataInputId: 'fotoPerfilUrl',
            previewId: 'imgPreview'
        });

        fileFotoInput.disabled = false;

        // Limpa a seleção quando falha, para permitir tentar de novo com o
        // mesmo arquivo — sem isso o evento `change` não dispara na segunda vez.
        if (!url) fileFotoInput.value = '';
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

    // Funções

    async function loadEquipe() {
        if (loadingEquipe) loadingEquipe.style.display = 'inline';
        if (emptyEquipe) emptyEquipe.style.display = 'none';
        
        try {
            const response = await apiRequest('/admin/equipe');
            const data = response.data || [];
            
            equipeBody.innerHTML = '';
            
            if (data.length === 0) {
                if (emptyEquipe) emptyEquipe.style.display = 'block';
            } else {
                data.forEach(membro => {
                    const row = document.createElement('tr');
                    
                    const dataNascFormatada = membro.dataNascimento 
                        ? new Date(membro.dataNascimento).toLocaleDateString('pt-BR') 
                        : '-';

                    row.innerHTML = `
                        <td>
                            <img src="${membro.fotoPerfil || '../images/default-avatar.png'}" class="avatar-table" alt="${membro.nome}">
                        </td>
                        <td>${membro.nome}</td>
                        <td>${membro.funcao}</td>
                        <td>${dataNascFormatada}</td>
                        <td>
                            <span class="badge ${membro.ativo ? 'badge-success' : 'badge-danger'}">
                                ${membro.ativo ? 'Ativo' : 'Inativo'}
                            </span>
                        </td>
                        <td>
                            <button class="btn btn-sm btn-info btn-edit" data-id="${membro.id}"><i class="fas fa-edit"></i></button>
                            <button class="btn btn-sm btn-danger btn-delete" data-id="${membro.id}"><i class="fas fa-trash"></i></button>
                        </td>
                    `;
                    equipeBody.appendChild(row);
                });

                // Adiciona eventos nos botões recém criados
                document.querySelectorAll('.btn-edit').forEach(btn => {
                    btn.addEventListener('click', () => editMembro(btn.dataset.id));
                });
                document.querySelectorAll('.btn-delete').forEach(btn => {
                    btn.addEventListener('click', () => deleteMembro(btn.dataset.id));
                });
            }
        } catch (error) {
            console.error('Erro ao carregar equipe:', error);
            alert('Erro ao carregar a lista de equipe.');
        } finally {
            if (loadingEquipe) loadingEquipe.style.display = 'none';
        }
    }

    function openModal(membro = null) {
        modalMembro.classList.remove('hidden');
        formMembro.reset();
        
        if (membro) {
            modalTitle.textContent = 'Editar Membro';
            membroIdInput.value = membro.id;
            nomeInput.value = membro.nome;
            funcaoInput.value = membro.funcao;
            ativoInput.checked = membro.ativo;
            fotoPerfilUrlInput.value = membro.fotoPerfil;
            
            if (membro.dataNascimento) {
                const date = new Date(membro.dataNascimento);
                dataNascimentoInput.value = date.toISOString().split('T')[0];
            }
            
            if (membro.fotoPerfil) {
                imgPreview.src = membro.fotoPerfil;
                imgPreview.style.display = 'block';
            } else {
                imgPreview.style.display = 'none';
            }
        } else {
            modalTitle.textContent = 'Novo Membro';
            membroIdInput.value = '';
            imgPreview.style.display = 'none';
            ativoInput.checked = true;
        }
    }

    function closeModal() {
        modalMembro.classList.add('hidden');
    }

    async function saveMembro() {
        const id = membroIdInput.value;
        const nome = nomeInput.value;
        const dataNascimento = dataNascimentoInput.value;
        const funcao = funcaoInput.value;
        const ativo = ativoInput.checked;
        const fotoPerfil = fotoPerfilUrlInput.value;

        // Validação simples
        if (!nome || !dataNascimento || !funcao || !fotoPerfil) {
            alert('Todos os campos marcados com * são obrigatórios.');
            return;
        }

        const payload = {
            nome,
            dataNascimento,
            funcao,
            ativo,
            fotoPerfil
        };

        try {
            const method = id ? 'PUT' : 'POST';
            const endpoint = id ? `/admin/equipe/${id}` : '/admin/equipe';
            
            const response = await apiRequest(endpoint, {
                method,
                body: JSON.stringify(payload)
            });

            if (response.success) {
                closeModal();
                loadEquipe();
                if (typeof showToast !== 'undefined') {
                    showToast(`Membro ${id ? 'atualizado' : 'cadastrado'} com sucesso!`);
                } else {
                    alert(`Membro ${id ? 'atualizado' : 'cadastrado'} com sucesso!`);
                }
            }
        } catch (error) {
            console.error('Erro ao salvar membro:', error);
            alert('Erro ao salvar os dados do membro.');
        }
    }

    async function editMembro(id) {
        try {
            const response = await apiRequest('/admin/equipe');
            const data = response.data || [];
            const membro = data.find(m => m.id === id);
            if (membro) {
                openModal(membro);
            }
        } catch (error) {
            console.error('Erro ao buscar membro para edição:', error);
        }
    }

    async function deleteMembro(id) {
        const confirmed = confirm('Tem certeza que deseja excluir este membro da equipe?');
        if (!confirmed) return;

        try {
            const response = await apiRequest(`/admin/equipe/${id}`, {
                method: 'DELETE'
            });

            if (response.success) {
                loadEquipe();
                if (typeof showToast !== 'undefined') {
                    showToast('Membro excluído com sucesso!');
                } else {
                    alert('Membro excluído com sucesso!');
                }
            }
        } catch (error) {
            console.error('Erro ao excluir membro:', error);
            alert('Erro ao excluir o membro.');
        }
    }
});

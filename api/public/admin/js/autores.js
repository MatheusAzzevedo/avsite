document.addEventListener('DOMContentLoaded', () => {
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

    // Estado Local
    const STORAGE_KEY = 'avsite_mock_autores';
    let autores = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

    // Funções Auxiliares
    function saveAutores() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(autores));
    }

    function generateId() {
        return Math.random().toString(36).substring(2, 9);
    }

    function renderTable() {
        autoresBody.innerHTML = '';
        
        if (autores.length === 0) {
            autoresTable.style.display = 'none';
            emptyAutores.style.display = 'block';
            return;
        }

        autoresTable.style.display = 'table';
        emptyAutores.style.display = 'none';

        autores.forEach(autor => {
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
                openModal(id);
            });
        });
        
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                deleteAutor(id);
            });
        });
    }

    // Modal
    function openModal(id = null) {
        formAutor.reset();
        imgPreview.style.display = 'none';
        imgPreview.src = '';
        fotoUrlInput.value = '';

        if (id) {
            modalTitle.textContent = 'Editar Autor';
            const autor = autores.find(a => a.id === id);
            if (autor) {
                autorIdInput.value = autor.id;
                nomeInput.value = autor.nome;
                profissaoInput.value = autor.profissao || '';
                descricaoInput.value = autor.descricao || '';
                
                if (autor.foto) {
                    fotoUrlInput.value = autor.foto;
                    imgPreview.src = autor.foto;
                    imgPreview.style.display = 'block';
                }
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

    // Leitura da Imagem
    fileFoto.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                imgPreview.src = e.target.result;
                imgPreview.style.display = 'block';
                fotoUrlInput.value = e.target.result; // Salva o base64 para o mock
            }
            reader.readAsDataURL(file);
        }
    });

    // Salvar
    modalSave.addEventListener('click', () => {
        if (!formAutor.checkValidity()) {
            formAutor.reportValidity();
            return;
        }

        const id = autorIdInput.value;
        const autorData = {
            nome: nomeInput.value,
            profissao: profissaoInput.value,
            descricao: descricaoInput.value,
            foto: fotoUrlInput.value
        };

        if (id) {
            // Update
            const index = autores.findIndex(a => a.id === id);
            if (index > -1) {
                autores[index] = { ...autores[index], ...autorData, id };
            }
        } else {
            // Create
            autorData.id = generateId();
            autores.push(autorData);
        }

        saveAutores();
        renderTable();
        closeModal();
    });

    // Deletar
    function deleteAutor(id) {
        if (confirm('Tem certeza que deseja excluir este autor?')) {
            autores = autores.filter(a => a.id !== id);
            saveAutores();
            renderTable();
        }
    }

    // Eventos
    btnNovoAutor.addEventListener('click', () => openModal(null));
    modalClose.addEventListener('click', closeModal);
    modalCancel.addEventListener('click', closeModal);

    // Initial render
    renderTable();
});

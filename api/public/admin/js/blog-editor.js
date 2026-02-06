/**
 * Script do editor de blog (admin/blog-editor.html).
 * Externalizado para compatibilidade com Content-Security-Policy (CSP) - script-src 'self'.
 */

let isEditing = false;
let currentPostId = null;

/**
 * Explicação da função [initEditor]
 * Inicializa o editor, verificando se é edição ou criação.
 * Carrega dados do post se for edição (via API).
 */
function initEditor() {
    document.getElementById('postDate').valueAsDate = new Date();

    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');

    if (postId) {
        loadPostForEdit(postId);
    }

    document.getElementById('postExcerpt').addEventListener('input', updateExcerptCount);

    const postImageInput = document.getElementById('postImage');
    if (postImageInput) {
        postImageInput.addEventListener('change', function() {
            handleImageUpload(this);
        });
    }

    const postForm = document.getElementById('postForm');
    if (postForm) {
        postForm.addEventListener('submit', savePost);
    }

    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle && window.innerWidth <= 768) {
        sidebarToggle.style.display = 'inline-block';
    }

    window.addEventListener('resize', function() {
        if (sidebarToggle) {
            sidebarToggle.style.display = window.innerWidth <= 768 ? 'inline-block' : 'none';
        }
    });

    // Event listeners dos botões do editor de texto
    document.querySelectorAll('.editor-btn').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            formatText(this.dataset.command);
        });
    });

    // Botão de remover imagem
    const btnRemoveImage = document.getElementById('btnRemoveImage');
    if (btnRemoveImage) {
        btnRemoveImage.addEventListener('click', function(e) {
            e.preventDefault();
            removeImage();
        });
    }

    // Botão de inserir link
    const btnInsertLink = document.getElementById('btnInsertLink');
    if (btnInsertLink) {
        btnInsertLink.addEventListener('click', function(e) {
            e.preventDefault();
            insertLink();
        });
    }

    // Botão de salvar rascunho
    const btnSaveDraft = document.getElementById('btnSaveDraft');
    if (btnSaveDraft) {
        btnSaveDraft.addEventListener('click', function(e) {
            e.preventDefault();
            saveDraft();
        });
    }

    // Select de headings
    const headingSelect = document.querySelector('.editor-toolbar select');
    if (headingSelect) {
        headingSelect.addEventListener('change', function() {
            formatHeading(this.value);
            this.value = ''; // Reset select
        });
    }
}

/**
 * Explicação da função [loadPostForEdit]
 * Carrega os dados de um post existente para edição via API (assíncrono).
 * @param {string} postId - ID do post a editar
 */
async function loadPostForEdit(postId) {
    console.log('[Blog Editor] Carregando post para edição:', postId);
    try {
        const post = await BlogManager.getById(postId);
        if (!post) {
            showToast('Post não encontrado!', 'error');
            setTimeout(() => { window.location.href = 'blog.html'; }, 1500);
            return;
        }

        isEditing = true;
        currentPostId = postId;

        document.getElementById('pageTitle').textContent = 'Editar Post';
        document.getElementById('submitBtnText').textContent = 'Salvar Alterações';

        document.getElementById('postId').value = post.id;
        document.getElementById('postTitle').value = post.titulo || '';
        document.getElementById('postAuthor').value = post.autor || '';
        const dataVal = post.data ? (typeof post.data === 'string' ? post.data : post.data.toISOString ? post.data.toISOString() : post.data).substring(0, 10) : '';
        document.getElementById('postDate').value = dataVal;
        document.getElementById('postCategory').value = post.categoria || 'turismo';
        document.getElementById('postStatus').value = (post.status || 'RASCUNHO').toLowerCase();
        document.getElementById('postExcerpt').value = post.resumo || '';
        document.getElementById('postContent').innerHTML = post.conteudo || '';
        document.getElementById('postTags').value = Array.isArray(post.tags) ? post.tags.join(', ') : '';

        if (post.imagemCapa) {
            document.getElementById('postImageData').value = post.imagemCapa;
            document.getElementById('imagePreview').src = post.imagemCapa;
            document.getElementById('imagePreviewContainer').style.display = 'block';
        }

        updateExcerptCount();
        console.log('[Blog Editor] Post carregado com sucesso');
    } catch (err) {
        console.error('[Blog Editor] Erro ao carregar post:', err);
        showToast('Erro ao carregar post.', 'error');
        setTimeout(() => { window.location.href = 'blog.html'; }, 1500);
    }
}

/**
 * Explicação da função [handleImageUpload]
 * Processa o upload de imagem e converte para base64.
 * @param {HTMLInputElement} input - Input de arquivo
 */
function handleImageUpload(input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];

        if (file.size > 5 * 1024 * 1024) {
            showToast('A imagem deve ter no máximo 5MB', 'error');
            return;
        }

        const reader = new FileReader();

        reader.onload = function(e) {
            document.getElementById('postImageData').value = e.target.result;
            document.getElementById('imagePreview').src = e.target.result;
            document.getElementById('imagePreviewContainer').style.display = 'block';
        };

        reader.readAsDataURL(file);
    }
}

/**
 * Explicação da função [removeImage]
 * Remove a imagem de capa selecionada.
 */
function removeImage() {
    document.getElementById('postImageData').value = '';
    document.getElementById('postImage').value = '';
    document.getElementById('imagePreviewContainer').style.display = 'none';
}

/**
 * Explicação da função [updateExcerptCount]
 * Atualiza o contador de caracteres do resumo.
 */
function updateExcerptCount() {
    const excerpt = document.getElementById('postExcerpt');
    const count = document.getElementById('excerptCount');
    count.textContent = excerpt.value.length;
}

/**
 * Explicação da função [formatText]
 * Aplica formatação ao texto selecionado no editor.
 * @param {string} command - Comando do execCommand
 */
function formatText(command) {
    document.execCommand(command, false, null);
    document.getElementById('postContent').focus();
}

/**
 * Explicação da função [formatHeading]
 * Aplica um nível de título ao editor.
 * @param {string} tag - Tag HTML (h1, h2, h3, h4, p)
 */
function formatHeading(tag) {
    if (tag) {
        document.execCommand('formatBlock', false, tag);
    } else {
        document.execCommand('formatBlock', false, 'p');
    }
    document.getElementById('postContent').focus();
}

/**
 * Explicação da função [insertLink]
 * Insere um link no conteúdo do post.
 */
function insertLink() {
    const url = prompt('Digite a URL:');
    if (url) {
        document.execCommand('createLink', false, url);
    }
    document.getElementById('postContent').focus();
}

/**
 * Explicação da função [getPostData]
 * Coleta todos os dados do formulário.
 * @returns {Object} Dados do post
 */
function getPostData() {
    const tagsString = document.getElementById('postTags').value;
    const tags = tagsString ? tagsString.split(',').map(tag => tag.trim()).filter(tag => tag) : [];

    return {
        titulo: document.getElementById('postTitle').value.trim(),
        autor: document.getElementById('postAuthor').value.trim(),
        data: document.getElementById('postDate').value,
        categoria: document.getElementById('postCategory').value,
        status: document.getElementById('postStatus').value,
        imagemCapa: document.getElementById('postImageData').value,
        resumo: document.getElementById('postExcerpt').value.trim(),
        conteudo: document.getElementById('postContent').innerHTML,
        tags: tags
    };
}

/**
 * Explicação da função [validatePost]
 * Valida os dados obrigatórios do post.
 * @param {Object} postData - Dados do post
 * @returns {boolean} Se é válido
 */
function validatePost(postData) {
    if (!postData.titulo) {
        showToast('O título é obrigatório.', 'error');
        document.getElementById('postTitle').focus();
        return false;
    }

    if (!postData.autor) {
        showToast('O autor é obrigatório.', 'error');
        document.getElementById('postAuthor').focus();
        return false;
    }

    if (!postData.data) {
        showToast('A data é obrigatória.', 'error');
        document.getElementById('postDate').focus();
        return false;
    }

    const content = document.getElementById('postContent').textContent.trim();
    if (!content) {
        showToast('O conteúdo do post é obrigatório.', 'error');
        document.getElementById('postContent').focus();
        return false;
    }

    return true;
}

/**
 * Explicação da função [savePost]
 * Salva o post na API (cria novo ou atualiza existente). Assíncrono.
 * @param {Event} event - Evento do formulário
 */
async function savePost(event) {
    event.preventDefault();

    const postData = getPostData();
    if (!validatePost(postData)) return;

    const payload = Object.assign({}, postData, {
        status: (postData.status || 'rascunho').toUpperCase() === 'PUBLICADO' ? 'PUBLICADO' : 'RASCUNHO'
    });

    try {
        let result;
        if (isEditing && currentPostId) {
            result = await BlogManager.update(currentPostId, payload);
            showToast('Post atualizado com sucesso!', 'success');
        } else {
            result = await BlogManager.create(payload);
            showToast('Post criado com sucesso!', 'success');
        }
        console.log('[Blog Editor] Post salvo:', result);
        setTimeout(() => { window.location.href = 'blog.html'; }, 1500);
    } catch (err) {
        console.error('[Blog Editor] Erro ao salvar:', err);
        showToast(err && err.message ? err.message : 'Erro ao salvar post.', 'error');
    }
}

/**
 * Explicação da função [saveDraft]
 * Salva o post como rascunho na API (não requer validação completa). Assíncrono.
 */
async function saveDraft() {
    const postData = getPostData();
    postData.status = 'RASCUNHO';

    if (!postData.titulo) {
        showToast('Adicione pelo menos um título para salvar o rascunho.', 'error');
        document.getElementById('postTitle').focus();
        return;
    }

    try {
        let result;
        if (isEditing && currentPostId) {
            result = await BlogManager.update(currentPostId, postData);
        } else {
            result = await BlogManager.create(postData);
        }

        if (result) {
            showToast('Rascunho salvo com sucesso!', 'success');
            if (!isEditing) {
                isEditing = true;
                currentPostId = result.id;
                document.getElementById('postId').value = result.id;
                document.getElementById('pageTitle').textContent = 'Editar Post';
                document.getElementById('submitBtnText').textContent = 'Salvar Alterações';
                window.history.replaceState({}, '', 'blog-editor.html?id=' + result.id);
            }
        } else {
            showToast('Erro ao salvar rascunho.', 'error');
        }
    } catch (err) {
        console.error('[Blog Editor] Erro ao salvar rascunho:', err);
        showToast('Erro ao salvar rascunho.', 'error');
    }
}

// Atalhos de teclado
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey || e.metaKey) {
        switch(e.key.toLowerCase()) {
            case 's':
                e.preventDefault();
                saveDraft();
                break;
            case 'b':
                if (document.activeElement.id === 'postContent') {
                    e.preventDefault();
                    formatText('bold');
                }
                break;
            case 'i':
                if (document.activeElement.id === 'postContent') {
                    e.preventDefault();
                    formatText('italic');
                }
                break;
            case 'u':
                if (document.activeElement.id === 'postContent') {
                    e.preventDefault();
                    formatText('underline');
                }
                break;
        }
    }
});

// Inicializa o editor quando a página carrega
document.addEventListener('DOMContentLoaded', initEditor);

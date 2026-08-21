/**
 * Script do editor de blog (admin/blog-editor.html).
 * Externalizado para compatibilidade com Content-Security-Policy (CSP) - script-src 'self'.
 */

let isEditing = false;
let currentPostId = null;

// URLs das imagens da galeria do post no R2, máximo de 4
const MAX_GALERIA = 4;
let galeriaImages = [];

/**
 * Explicação da função [initEditor]
 * Inicializa o editor, verificando se é edição ou criação.
 * Carrega dados do post se for edição (via API).
 */
async function initEditor() {
    document.getElementById('postDate').valueAsDate = new Date();

    await loadAutores();

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

    // Galeria de imagens
    const postGaleriaInput = document.getElementById('postGaleria');
    if (postGaleriaInput) {
        postGaleriaInput.addEventListener('change', function() {
            handleGalleryUpload(this);
            this.value = ''; // permite reselecionar o mesmo arquivo
        });
    }
    const galeriaUploadArea = document.querySelector('[data-upload-target="postGaleria"]');
    if (galeriaUploadArea) {
        galeriaUploadArea.addEventListener('click', function() {
            document.getElementById('postGaleria').click();
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

async function loadAutores() {
    try {
        const response = await apiRequest('/admin/autores');
        const autores = response.data || [];
        const select = document.getElementById('postAuthor');
        select.innerHTML = '<option value="">Selecione um autor...</option>';
        autores.forEach(a => {
            const opt = document.createElement('option');
            opt.value = a.id;
            opt.textContent = a.nome;
            select.appendChild(opt);
        });
    } catch(err) {
        console.error('Erro ao carregar autores', err);
        const select = document.getElementById('postAuthor');
        if (select) select.innerHTML = '<option value="">Erro ao carregar autores</option>';
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
        document.getElementById('postAuthor').value = post.autorId || '';
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

        // Galeria existente
        if (Array.isArray(post.galeria) && post.galeria.length > 0) {
            galeriaImages = post.galeria
                .map(function(img) { return typeof img === 'string' ? img : (img && img.url ? img.url : null); })
                .filter(Boolean)
                .slice(0, MAX_GALERIA);
            renderGalleryPreview();
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
 * Envia a imagem de capa ao Cloudflare R2 e guarda a URL no campo do post.
 *
 * Antes a capa era convertida para Base64 e gravada na própria coluna
 * `imagemCapa`, o que fazia a listagem pública do blog trafegar a imagem
 * inteira de cada post — uma delas com 441 KB.
 *
 * Tipo e tamanho são validados por `UploadArquivo`, que espelha o limite do
 * servidor; o teto de 5 MB daqui era mais apertado e levava o usuário a
 * comprimir a imagem por fora antes de enviar.
 *
 * @param {HTMLInputElement} input - Input de arquivo
 */
async function handleImageUpload(input) {
    const file = input.files && input.files[0];
    if (!file) return;

    input.disabled = true;

    const url = await UploadArquivo.preencherCampo(file, {
        dataInputId: 'postImageData',
        previewId: 'imagePreview',
        containerId: 'imagePreviewContainer'
    });

    input.disabled = false;

    // Sem limpar a seleção, escolher o mesmo arquivo de novo não dispara o evento.
    if (!url) input.value = '';
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
 * Explicação da função [handleGalleryUpload]
 * Processa o upload de múltiplas imagens da galeria (base64), respeitando o limite de 4.
 * @param {HTMLInputElement} input - Input de arquivo (multiple)
 */
async function handleGalleryUpload(input) {
    if (!input.files || input.files.length === 0) return;

    const vagas = MAX_GALERIA - galeriaImages.length;
    if (vagas <= 0) {
        showToast('A galeria aceita no máximo ' + MAX_GALERIA + ' imagens.', 'error');
        input.value = '';
        return;
    }

    const escolhidos = Array.from(input.files);
    if (escolhidos.length > vagas) {
        showToast('Só cabem mais ' + vagas + ' imagem(ns); as demais foram ignoradas.', 'error');
    }

    input.disabled = true;

    // Sequencial de propósito: em paralelo, várias fotos grandes saturam a
    // conexão e todas demoram mais. O helper reporta qual está sendo enviada.
    const resultados = await UploadArquivo.enviarVarias(escolhidos.slice(0, vagas), {
        aoIniciarArquivo: function(indice, total, nome) {
            showToast('Enviando ' + indice + ' de ' + total + ': ' + nome, 'info');
        }
    });

    input.disabled = false;
    input.value = '';

    resultados.filter(function(r) { return r.ok; })
              .forEach(function(r) { galeriaImages.push(r.dados.url); });

    const falhas = resultados.filter(function(r) { return !r.ok; });
    falhas.forEach(function(r) {
        showToast('Falhou: ' + r.arquivo + ' — ' + r.erro, 'error');
    });

    renderGalleryPreview();
}

/**
 * Explicação da função [renderGalleryPreview]
 * Renderiza a prévia das imagens da galeria com botão de remover.
 */
function renderGalleryPreview() {
    const container = document.getElementById('galeriaPreview');
    if (!container) return;

    container.innerHTML = galeriaImages.map(function(img, index) {
        return '<div style="position: relative; border-radius: var(--radius-md); overflow: hidden;">' +
            '<img src="' + img + '" style="width: 100%; height: 100px; object-fit: cover;">' +
            '<button type="button" data-gallery-index="' + index + '" class="remove-gallery-image" style="position: absolute; top: 0.25rem; right: 0.25rem; background: var(--danger-color); color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; font-size: 0.7rem;">' +
            '<i class="fas fa-times"></i></button>' +
            '</div>';
    }).join('');

    container.querySelectorAll('.remove-gallery-image').forEach(function(btn) {
        btn.addEventListener('click', function() {
            removeGalleryImage(parseInt(this.dataset.galleryIndex, 10));
        });
    });
}

/**
 * Explicação da função [removeGalleryImage]
 * Remove uma imagem da galeria pelo índice.
 * @param {number} index - Posição da imagem
 */
function removeGalleryImage(index) {
    galeriaImages.splice(index, 1);
    renderGalleryPreview();
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

    const titulo = document.getElementById('postTitle').value.trim();
    const autorId = document.getElementById('postAuthor').value.trim();
    const data = document.getElementById('postDate').value;
    const categoria = document.getElementById('postCategory').value;
    const status = document.getElementById('postStatus').value;
    const imagemCapa = document.getElementById('postImageData').value;
    const resumo = document.getElementById('postExcerpt').value.trim();

    console.log('[Blog Editor getPostData] Status value raw:', status);
    console.log('[Blog Editor getPostData] Status element:', document.getElementById('postStatus'));

    return {
        titulo: titulo,
        autorId: autorId,
        data: data,
        categoria: categoria,
        status: status,
        imagemCapa: imagemCapa,
        resumo: resumo,
        conteudo: document.getElementById('postContent').innerHTML,
        tags: tags,
        galeria: galeriaImages.slice(0, MAX_GALERIA)
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

    if (!postData.autorId) {
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
    console.log('[Blog Editor] Dados coletados do formulário:', postData);
    
    if (!validatePost(postData)) return;

    const payload = Object.assign({}, postData, {
        status: (postData.status || 'rascunho').toUpperCase() === 'PUBLICADO' ? 'PUBLICADO' : 'RASCUNHO'
    });

    console.log('[Blog Editor] Payload sendo enviado à API:', payload);
    console.log('[Blog Editor] Status normalizado:', payload.status);

    try {
        let result;
        if (isEditing && currentPostId) {
            console.log('[Blog Editor] Atualizando post:', currentPostId);
            result = await BlogManager.update(currentPostId, payload);
            showToast('Post atualizado com sucesso!', 'success');
        } else {
            console.log('[Blog Editor] Criando novo post...');
            result = await BlogManager.create(payload);
            console.log('[Blog Editor] Post criado com ID:', result?.id);
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

/**
 * Explicação do Arquivo [excursao-editor.js]
 *
 * Script do editor de excursões. Gerencia criação e edição de excursões.
 * Externalizado para compatibilidade com Content-Security-Policy (CSP).
 */

/**
 * Notificação Toast com fallback se não estiver definida
 */
function showNotification(message, type = 'info') {
  // Se showToast estiver disponível (de admin-main.js), usa ela
  if (typeof showToast !== 'undefined') {
    showToast(message, type);
    return;
  }
  // Fallback: alert se showToast não estiver disponível
  console.warn('[Excursão Editor] showToast não disponível. Mensagem:', message);
  alert(message);
}

// Variáveis globais
let isEditing = false;
let currentExcursaoId = null;
let galeriaImages = [];

/**
 * Inicializa o editor quando a página carrega
 */
async function initEditor() {
  const params = new URLSearchParams(window.location.search);
  const excursaoId = params.get('id');

  if (excursaoId) {
    isEditing = true;
    currentExcursaoId = excursaoId;
    document.getElementById('excursaoId').value = excursaoId;
    document.getElementById('pageTitle').textContent = 'Editar Excursão';
    document.getElementById('submitBtnText').textContent = 'Atualizar Excursão';
    await loadExcursao(excursaoId);
  }
}

/**
 * Carrega dados da excursão para edição
 */
async function loadExcursao(excursaoId) {
  try {
    console.log('[Excursão Editor] Carregando excursão para edição:', excursaoId);

    const excursao = await ExcursaoManager.getById(excursaoId);

    if (!excursao) {
      showNotification('Excursão não encontrada!', 'error');
      setTimeout(() => (window.location.href = 'excursoes.html'), 2000);
      return;
    }

    // Preenche o formulário
    document.getElementById('excursaoTitulo').value = excursao.titulo || '';
    document.getElementById('excursaoSubtitulo').value = excursao.subtitulo || '';
    document.getElementById('excursaoPreco').value = excursao.preco || '';
    document.getElementById('excursaoDuracao').value = excursao.duracao || '';
    document.getElementById('excursaoCategoria').value = excursao.categoria || '';
    document.getElementById('excursaoStatus').value = (excursao.status || 'ATIVO').toLowerCase();
    document.getElementById('excursaoDescricao').innerHTML = excursao.descricao || '';
    document.getElementById('excursaoInclusos').value = excursao.inclusos || '';
    document.getElementById('excursaoRecomendacoes').value = excursao.recomendacoes || '';
    document.getElementById('excursaoLocal').value = excursao.local || '';
    document.getElementById('excursaoHorario').value = excursao.horario || '';
    document.getElementById('excursaoTags').value =
      Array.isArray(excursao.tags) ? excursao.tags.join(', ') : '';

    // Imagens
    if (excursao.imagemCapa) {
      document.getElementById('imagemCapaData').value = excursao.imagemCapa;
      document.getElementById('previewCapa').src = excursao.imagemCapa;
      document.getElementById('previewCapaContainer').style.display = 'block';
    }

    if (excursao.imagemPrincipal) {
      document.getElementById('imagemPrincipalData').value = excursao.imagemPrincipal;
      document.getElementById('previewPrincipal').src = excursao.imagemPrincipal;
      document.getElementById('previewPrincipalContainer').style.display = 'block';
    }

    // Galeria
    if (excursao.galeria && excursao.galeria.length > 0) {
      galeriaImages = excursao.galeria.map((img) => img.url);
      renderGalleryPreview();
    }

    console.log('[Excursão Editor] Excursão carregada com sucesso');
  } catch (error) {
    console.error('[Excursão Editor] Erro ao carregar:', error);
    showNotification('Erro ao carregar excursão!', 'error');
  }
}

/**
 * Processa o upload de uma imagem individual
 */
function handleImageUpload(input, previewId, dataInputId) {
  if (input.files && input.files[0]) {
    const file = input.files[0];

    if (file.size > 20 * 1024 * 1024) {
      showNotification('A imagem deve ter no máximo 20MB', 'error');
      return;
    }

    const reader = new FileReader();

    reader.onload = function (e) {
      document.getElementById(dataInputId).value = e.target.result;
      document.getElementById(previewId).src = e.target.result;
      document.getElementById(previewId + 'Container').style.display = 'block';
    };

    reader.readAsDataURL(file);
  }
}

/**
 * Remove uma imagem individual
 */
function removeImage(dataInputId, containerId, fileInputId) {
  document.getElementById(dataInputId).value = '';
  document.getElementById(fileInputId).value = '';
  document.getElementById(containerId).style.display = 'none';
}

/**
 * Processa o upload de múltiplas imagens para a galeria
 */
function handleGalleryUpload(input) {
  if (input.files) {
    Array.from(input.files).forEach((file) => {
      if (file.size > 20 * 1024 * 1024) {
        showNotification(`Imagem ${file.name} muito grande (máx 20MB)`, 'warning');
        return;
      }

      const reader = new FileReader();
      reader.onload = function (e) {
        galeriaImages.push(e.target.result);
        renderGalleryPreview();
      };
      reader.readAsDataURL(file);
    });
  }
}

/**
 * Renderiza a prévia das imagens da galeria
 */
function renderGalleryPreview() {
  const container = document.getElementById('galeriaPreview');
  container.innerHTML = galeriaImages
    .map(
      (img, index) => `
        <div style="position: relative; border-radius: var(--radius-md); overflow: hidden;">
            <img src="${img}" style="width: 100%; height: 100px; object-fit: cover;">
            <button type="button" data-gallery-index="${index}" class="remove-gallery-image" style="position: absolute; top: 0.25rem; right: 0.25rem; background: var(--danger-color); color: white; border: none; border-radius: 50%; width: 20px; height: 20px; cursor: pointer; font-size: 0.625rem;">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `
    )
    .join('');

  // Anexa event listeners aos botões de remover
  container.querySelectorAll('.remove-gallery-image').forEach((btn) => {
    btn.addEventListener('click', function () {
      const index = parseInt(this.dataset.galleryIndex);
      removeGalleryImage(index);
    });
  });
}

/**
 * Remove uma imagem da galeria
 */
function removeGalleryImage(index) {
  galeriaImages.splice(index, 1);
  renderGalleryPreview();
}

/**
 * Funções do Editor de Texto Rico
 */
function formatText(command) {
  document.execCommand(command, false, null);
  document.getElementById('excursaoDescricao').focus();
}

function formatHeading(tag) {
  if (tag) {
    document.execCommand('formatBlock', false, tag);
  } else {
    document.execCommand('formatBlock', false, 'p');
  }
  document.getElementById('excursaoDescricao').focus();
}

/**
 * Coleta todos os dados do formulário
 */
function getExcursaoData() {
  const tagsString = document.getElementById('excursaoTags').value;
  const tags = tagsString
    ? tagsString
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag)
    : [];

  return {
    titulo: document.getElementById('excursaoTitulo').value.trim(),
    subtitulo: document.getElementById('excursaoSubtitulo').value.trim(),
    preco: parseFloat(document.getElementById('excursaoPreco').value) || 0,
    duracao: document.getElementById('excursaoDuracao').value.trim(),
    categoria: document.getElementById('excursaoCategoria').value,
    status: document.getElementById('excursaoStatus').value,
    imagemCapa: document.getElementById('imagemCapaData').value,
    imagemPrincipal: document.getElementById('imagemPrincipalData').value,
    galeria: galeriaImages,
    descricao: document.getElementById('excursaoDescricao').innerHTML,
    inclusos: document.getElementById('excursaoInclusos').value.trim(),
    recomendacoes: document.getElementById('excursaoRecomendacoes').value.trim(),
    local: document.getElementById('excursaoLocal').value.trim(),
    horario: document.getElementById('excursaoHorario').value.trim(),
    tags: tags,
  };
}

/**
 * Valida os dados obrigatórios da excursão
 */
function validateExcursao(excursaoData) {
  if (!excursaoData.titulo) {
    showNotification('O título é obrigatório.', 'error');
    document.getElementById('excursaoTitulo').focus();
    return false;
  }

  if (!excursaoData.subtitulo) {
    showNotification('O subtítulo é obrigatório.', 'error');
    document.getElementById('excursaoSubtitulo').focus();
    return false;
  }

  if (!excursaoData.preco || excursaoData.preco <= 0) {
    showNotification('O preço deve ser maior que zero.', 'error');
    document.getElementById('excursaoPreco').focus();
    return false;
  }

  if (!excursaoData.categoria) {
    showNotification('A categoria é obrigatória.', 'error');
    document.getElementById('excursaoCategoria').focus();
    return false;
  }

  return true;
}

/**
 * Salva a excursão via API (cria nova ou atualiza existente)
 */
async function saveExcursao(event) {
  event.preventDefault();

  const excursaoData = getExcursaoData();

  if (!validateExcursao(excursaoData)) {
    return;
  }

  // Converte status para maiúsculo para a API
  excursaoData.status = excursaoData.status.toUpperCase();

  // Mostra loading
  const submitBtn = document.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
  submitBtn.disabled = true;

  try {
    console.log('[Excursão Editor] Salvando excursão:', excursaoData);
    let result;

    if (isEditing && currentExcursaoId) {
      result = await ExcursaoManager.update(currentExcursaoId, excursaoData);

      if (result) {
        showNotification('Excursão atualizada com sucesso!', 'success');
      } else {
        showNotification('Erro ao atualizar excursão.', 'error');
        return;
      }
    } else {
      result = await ExcursaoManager.create(excursaoData);

      if (result) {
        showNotification('Excursão criada com sucesso!', 'success');
      } else {
        showNotification('Erro ao criar excursão.', 'error');
        return;
      }
    }

    console.log('[Excursão Editor] Excursão salva:', result);

    setTimeout(() => {
      window.location.href = 'excursoes.html';
    }, 1500);
  } catch (error) {
    console.error('[Excursão Editor] Erro ao salvar:', error);
    showNotification(error.message || 'Erro ao salvar excursão.', 'error');
  } finally {
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  }
}

/**
 * Salva a excursão como inativa
 */
function saveAsInactive() {
  document.getElementById('excursaoStatus').value = 'inativo';
  const form = document.getElementById('excursaoForm');
  const event = new Event('submit', { cancelable: true });
  form.dispatchEvent(event);
}

/**
 * Anexa event listeners quando DOM estiver pronto
 */
document.addEventListener('DOMContentLoaded', function () {
  // Inicializa o editor
  initEditor();

  // Form submit
  const form = document.getElementById('excursaoForm');
  if (form) {
    form.addEventListener('submit', saveExcursao);
  }

  // Botão Salvar como Inativo
  const saveInactiveBtn = document.querySelector('.btn-secondary[data-action="save-inactive"]');
  if (saveInactiveBtn) {
    saveInactiveBtn.addEventListener('click', saveAsInactive);
  }

  // File uploads - Imagem Capa
  const imagemCapaInput = document.getElementById('imagemCapa');
  if (imagemCapaInput) {
    imagemCapaInput.addEventListener('change', function () {
      handleImageUpload(this, 'previewCapa', 'imagemCapaData');
    });
  }

  // File uploads - Imagem Principal
  const imagemPrincipalInput = document.getElementById('imagemPrincipal');
  if (imagemPrincipalInput) {
    imagemPrincipalInput.addEventListener('change', function () {
      handleImageUpload(this, 'previewPrincipal', 'imagemPrincipalData');
    });
  }

  // File uploads - Galeria
  const imagemGaleriaInput = document.getElementById('imagemGaleria');
  if (imagemGaleriaInput) {
    imagemGaleriaInput.addEventListener('change', function () {
      handleGalleryUpload(this);
    });
  }

  // Click areas for file uploads
  const capaUploadArea = document.querySelector('[data-upload-target="imagemCapa"]');
  if (capaUploadArea) {
    capaUploadArea.addEventListener('click', function () {
      document.getElementById('imagemCapa').click();
    });
  }

  const principalUploadArea = document.querySelector('[data-upload-target="imagemPrincipal"]');
  if (principalUploadArea) {
    principalUploadArea.addEventListener('click', function () {
      document.getElementById('imagemPrincipal').click();
    });
  }

  const galeriaUploadArea = document.querySelector('[data-upload-target="imagemGaleria"]');
  if (galeriaUploadArea) {
    galeriaUploadArea.addEventListener('click', function () {
      document.getElementById('imagemGaleria').click();
    });
  }

  // Botões de remover imagem
  const removeCapaBtn = document.querySelector('[data-remove="imagemCapa"]');
  if (removeCapaBtn) {
    removeCapaBtn.addEventListener('click', function () {
      removeImage('imagemCapaData', 'previewCapaContainer', 'imagemCapa');
    });
  }

  const removePrincipalBtn = document.querySelector('[data-remove="imagemPrincipal"]');
  if (removePrincipalBtn) {
    removePrincipalBtn.addEventListener('click', function () {
      removeImage('imagemPrincipalData', 'previewPrincipalContainer', 'imagemPrincipal');
    });
  }

  // Editor de texto - botões
  document.querySelectorAll('[data-format]').forEach((btn) => {
    btn.addEventListener('click', function () {
      formatText(this.dataset.format);
    });
  });

  // Editor de texto - heading select
  const headingSelect = document.querySelector('[data-format-heading]');
  if (headingSelect) {
    headingSelect.addEventListener('change', function () {
      formatHeading(this.value);
    });
  }

  // Atalhos de teclado
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      saveAsInactive();
    }
  });

  // Mobile sidebar toggle
  if (window.innerWidth <= 768) {
    document.getElementById('sidebarToggle').style.display = 'inline-block';
  }

  window.addEventListener('resize', function () {
    if (window.innerWidth <= 768) {
      document.getElementById('sidebarToggle').style.display = 'inline-block';
    } else {
      document.getElementById('sidebarToggle').style.display = 'none';
    }
  });
});

// Expor funções globalmente para compatibilidade
window.saveExcursao = saveExcursao;
window.handleImageUpload = handleImageUpload;
window.removeImage = removeImage;
window.handleGalleryUpload = handleGalleryUpload;
window.removeGalleryImage = removeGalleryImage;
window.formatText = formatText;
window.formatHeading = formatHeading;
window.saveAsInactive = saveAsInactive;

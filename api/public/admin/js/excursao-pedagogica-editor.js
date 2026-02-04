/**
 * Explicação do Arquivo [excursao-pedagogica-editor.js]
 *
 * Script do editor de excursões pedagógicas. Gerencia criação e edição com código único
 * para o cliente buscar. Usa ExcursaoPedagogicaManager e API /api/excursoes-pedagogicas.
 */

function showNotificationPedagogica(message, type) {
  if (typeof showToast !== 'undefined') {
    showToast(message, type);
    return;
  }
  console.warn('[Excursão Pedagógica Editor] Mensagem:', message);
  alert(message);
}

let isEditingPedagogica = false;
let currentExcursaoPedagogicaId = null;
let galeriaImagesPedagogica = [];

async function initEditorPedagogica() {
  const params = new URLSearchParams(window.location.search);
  const excursaoId = params.get('id');

  if (excursaoId) {
    isEditingPedagogica = true;
    currentExcursaoPedagogicaId = excursaoId;
    document.getElementById('excursaoId').value = excursaoId;
    document.getElementById('pageTitle').textContent = 'Editar Excursão Pedagógica';
    document.getElementById('submitBtnText').textContent = 'Atualizar Excursão Pedagógica';
    await loadExcursaoPedagogica(excursaoId);
  }
}

async function loadExcursaoPedagogica(excursaoId) {
  try {
    console.log('[Excursão Pedagógica Editor] Carregando:', excursaoId);

    const excursao = await ExcursaoPedagogicaManager.getById(excursaoId);

    if (!excursao) {
      showNotificationPedagogica('Excursão pedagógica não encontrada!', 'error');
      setTimeout(function () {
        window.location.href = 'excursoes-pedagogicas.html';
      }, 2000);
      return;
    }

    document.getElementById('excursaoCodigo').value = excursao.codigo || '';
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
    if (excursao.galeria && excursao.galeria.length > 0) {
      galeriaImagesPedagogica = excursao.galeria.map(function (img) {
        return typeof img === 'string' ? img : img.url;
      });
      renderGalleryPreviewPedagogica();
    }

    console.log('[Excursão Pedagógica Editor] Carregada com sucesso');
  } catch (error) {
    console.error('[Excursão Pedagógica Editor] Erro ao carregar:', error);
    showNotificationPedagogica('Erro ao carregar excursão pedagógica!', 'error');
  }
}

function handleImageUploadPedagogica(input, previewId, dataInputId) {
  if (input.files && input.files[0]) {
    var file = input.files[0];
    if (file.size > 20 * 1024 * 1024) {
      showNotificationPedagogica('A imagem deve ter no máximo 20MB', 'error');
      return;
    }
    var reader = new FileReader();
    reader.onload = function (e) {
      document.getElementById(dataInputId).value = e.target.result;
      document.getElementById(previewId).src = e.target.result;
      document.getElementById(previewId + 'Container').style.display = 'block';
    };
    reader.readAsDataURL(file);
  }
}

function removeImagePedagogica(dataInputId, containerId, fileInputId) {
  document.getElementById(dataInputId).value = '';
  document.getElementById(fileInputId).value = '';
  document.getElementById(containerId).style.display = 'none';
}

function handleGalleryUploadPedagogica(input) {
  if (input.files) {
    Array.from(input.files).forEach(function (file) {
      if (file.size > 20 * 1024 * 1024) {
        showNotificationPedagogica('Imagem ' + file.name + ' muito grande (máx 20MB)', 'warning');
        return;
      }
      var reader = new FileReader();
      reader.onload = function (e) {
        galeriaImagesPedagogica.push(e.target.result);
        renderGalleryPreviewPedagogica();
      };
      reader.readAsDataURL(file);
    });
  }
}

function renderGalleryPreviewPedagogica() {
  var container = document.getElementById('galeriaPreview');
  container.innerHTML = galeriaImagesPedagogica
    .map(
      function (img, index) {
        return (
          '<div style="position: relative; border-radius: var(--radius-md); overflow: hidden;">' +
          '<img src="' +
          img.replace(/"/g, '&quot;') +
          '" style="width: 100%; height: 100px; object-fit: cover;">' +
          '<button type="button" data-gallery-index="' +
          index +
          '" class="remove-gallery-image-pedagogica" style="position: absolute; top: 0.25rem; right: 0.25rem; background: var(--danger-color); color: white; border: none; border-radius: 50%; width: 20px; height: 20px; cursor: pointer; font-size: 0.625rem;"><i class="fas fa-times"></i></button>' +
          '</div>'
        );
      }
    )
    .join('');

  container.querySelectorAll('.remove-gallery-image-pedagogica').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var index = parseInt(this.dataset.galleryIndex, 10);
      galeriaImagesPedagogica.splice(index, 1);
      renderGalleryPreviewPedagogica();
    });
  });
}

function formatTextPedagogica(command) {
  document.execCommand(command, false, null);
  document.getElementById('excursaoDescricao').focus();
}

function formatHeadingPedagogica(tag) {
  if (tag) {
    document.execCommand('formatBlock', false, tag);
  } else {
    document.execCommand('formatBlock', false, 'p');
  }
  document.getElementById('excursaoDescricao').focus();
}

function getExcursaoPedagogicaData() {
  var tagsString = document.getElementById('excursaoTags').value;
  var tags = tagsString
    ? tagsString
        .split(',')
        .map(function (tag) {
          return tag.trim();
        })
        .filter(function (tag) {
          return tag;
        })
    : [];

  return {
    codigo: document.getElementById('excursaoCodigo').value.trim(),
    titulo: document.getElementById('excursaoTitulo').value.trim(),
    subtitulo: document.getElementById('excursaoSubtitulo').value.trim(),
    preco: parseFloat(document.getElementById('excursaoPreco').value) || 0,
    duracao: document.getElementById('excursaoDuracao').value.trim(),
    categoria: document.getElementById('excursaoCategoria').value,
    status: document.getElementById('excursaoStatus').value,
    imagemCapa: document.getElementById('imagemCapaData').value,
    imagemPrincipal: document.getElementById('imagemPrincipalData').value,
    galeria: galeriaImagesPedagogica,
    descricao: document.getElementById('excursaoDescricao').innerHTML,
    inclusos: document.getElementById('excursaoInclusos').value.trim(),
    recomendacoes: document.getElementById('excursaoRecomendacoes').value.trim(),
    local: document.getElementById('excursaoLocal').value.trim(),
    horario: document.getElementById('excursaoHorario').value.trim(),
    tags: tags
  };
}

var codigoRegex = /^[A-Za-z0-9_-]+$/;

function validateExcursaoPedagogica(data) {
  if (!data.codigo) {
    showNotificationPedagogica('O código único é obrigatório.', 'error');
    document.getElementById('excursaoCodigo').focus();
    return false;
  }
  if (!codigoRegex.test(data.codigo)) {
    showNotificationPedagogica('O código deve conter apenas letras, números, hífen e underscore.', 'error');
    document.getElementById('excursaoCodigo').focus();
    return false;
  }
  if (!data.titulo) {
    showNotificationPedagogica('O título é obrigatório.', 'error');
    document.getElementById('excursaoTitulo').focus();
    return false;
  }
  if (!data.preco || data.preco <= 0) {
    showNotificationPedagogica('O preço deve ser maior que zero.', 'error');
    document.getElementById('excursaoPreco').focus();
    return false;
  }
  if (!data.categoria) {
    showNotificationPedagogica('A categoria é obrigatória.', 'error');
    document.getElementById('excursaoCategoria').focus();
    return false;
  }
  return true;
}

async function saveExcursaoPedagogica(event) {
  event.preventDefault();

  var data = getExcursaoPedagogicaData();
  if (!validateExcursaoPedagogica(data)) {
    return;
  }

  data.status = data.status.toUpperCase();

  var submitBtn = document.querySelector('#excursaoPedagogicaForm button[type="submit"]');
  var originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
  submitBtn.disabled = true;

  try {
    var result;
    if (isEditingPedagogica && currentExcursaoPedagogicaId) {
      result = await ExcursaoPedagogicaManager.update(currentExcursaoPedagogicaId, data);
      if (result) {
        showNotificationPedagogica('Excursão pedagógica atualizada com sucesso!', 'success');
      } else {
        showNotificationPedagogica('Erro ao atualizar excursão pedagógica.', 'error');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        return;
      }
    } else {
      result = await ExcursaoPedagogicaManager.create(data);
      if (result) {
        showNotificationPedagogica('Excursão pedagógica criada com sucesso!', 'success');
      } else {
        showNotificationPedagogica('Erro ao criar excursão pedagógica.', 'error');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        return;
      }
    }

    setTimeout(function () {
      window.location.href = 'excursoes-pedagogicas.html';
    }, 1500);
  } catch (error) {
    console.error('[Excursão Pedagógica Editor] Erro ao salvar:', error);
    showNotificationPedagogica(error.message || 'Erro ao salvar excursão pedagógica.', 'error');
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  }
}

function saveAsInactivePedagogica() {
  document.getElementById('excursaoStatus').value = 'inativo';
  var form = document.getElementById('excursaoPedagogicaForm');
  var event = new Event('submit', { cancelable: true });
  form.dispatchEvent(event);
}

document.addEventListener('DOMContentLoaded', function () {
  initEditorPedagogica();

  var form = document.getElementById('excursaoPedagogicaForm');
  if (form) {
    form.addEventListener('submit', saveExcursaoPedagogica);
  }

  var saveInactiveBtn = document.querySelector('.btn-secondary[data-action="save-inactive"]');
  if (saveInactiveBtn) {
    saveInactiveBtn.addEventListener('click', saveAsInactivePedagogica);
  }

  var imagemCapaInput = document.getElementById('imagemCapa');
  if (imagemCapaInput) {
    imagemCapaInput.addEventListener('change', function () {
      handleImageUploadPedagogica(this, 'previewCapa', 'imagemCapaData');
    });
  }
  var imagemPrincipalInput = document.getElementById('imagemPrincipal');
  if (imagemPrincipalInput) {
    imagemPrincipalInput.addEventListener('change', function () {
      handleImageUploadPedagogica(this, 'previewPrincipal', 'imagemPrincipalData');
    });
  }
  var imagemGaleriaInput = document.getElementById('imagemGaleria');
  if (imagemGaleriaInput) {
    imagemGaleriaInput.addEventListener('change', function () {
      handleGalleryUploadPedagogica(this);
    });
  }

  var capaUploadArea = document.querySelector('[data-upload-target="imagemCapa"]');
  if (capaUploadArea) {
    capaUploadArea.addEventListener('click', function () {
      document.getElementById('imagemCapa').click();
    });
  }
  var principalUploadArea = document.querySelector('[data-upload-target="imagemPrincipal"]');
  if (principalUploadArea) {
    principalUploadArea.addEventListener('click', function () {
      document.getElementById('imagemPrincipal').click();
    });
  }
  var galeriaUploadArea = document.querySelector('[data-upload-target="imagemGaleria"]');
  if (galeriaUploadArea) {
    galeriaUploadArea.addEventListener('click', function () {
      document.getElementById('imagemGaleria').click();
    });
  }

  var removeCapaBtn = document.querySelector('[data-remove="imagemCapa"]');
  if (removeCapaBtn) {
    removeCapaBtn.addEventListener('click', function () {
      removeImagePedagogica('imagemCapaData', 'previewCapaContainer', 'imagemCapa');
    });
  }
  var removePrincipalBtn = document.querySelector('[data-remove="imagemPrincipal"]');
  if (removePrincipalBtn) {
    removePrincipalBtn.addEventListener('click', function () {
      removeImagePedagogica('imagemPrincipalData', 'previewPrincipalContainer', 'imagemPrincipal');
    });
  }

  document.querySelectorAll('[data-format]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      formatTextPedagogica(this.dataset.format);
    });
  });
  var headingSelect = document.querySelector('[data-format-heading]');
  if (headingSelect) {
    headingSelect.addEventListener('change', function () {
      formatHeadingPedagogica(this.value);
    });
  }

  if (window.innerWidth <= 768 && document.getElementById('sidebarToggle')) {
    document.getElementById('sidebarToggle').style.display = 'inline-block';
  }
  window.addEventListener('resize', function () {
    var toggle = document.getElementById('sidebarToggle');
    if (toggle) {
      toggle.style.display = window.innerWidth <= 768 ? 'inline-block' : 'none';
    }
  });
});

/**
 * Checkout do cliente - resumo da excursão (do localStorage) e formulários por participante.
 * Script externalizado para compatibilidade com Content-Security-Policy (CSP).
 */
(function () {
    var excursao = null;

    function stripHtml(html) {
        if (!html) return '';
        var div = document.createElement('div');
        div.innerHTML = html;
        return (div.textContent || div.innerText || '').trim();
    }

    function parseListText(str) {
        if (!str || typeof str !== 'string') return [];
        return str.split(/\n/).map(function (s) { return s.replace(/^\s*[-•]\s*/, '').trim(); }).filter(Boolean);
    }

    function formatBRL(num) {
        return (num != null ? Number(num).toFixed(2) : '0,00').replace('.', ',');
    }

    function exibirResumo() {
        var titulo = document.getElementById('resumoTitulo');
        var qtd = document.getElementById('resumoQtd');
        var valorUnit = document.getElementById('resumoValorUnit');
        var total = document.getElementById('resumoTotal');
        if (titulo) titulo.textContent = excursao.titulo || '';
        if (qtd) qtd.textContent = excursao.quantidade || 0;
        if (valorUnit) valorUnit.textContent = formatBRL(excursao.preco);
        if (total) total.textContent = (excursao.preco != null && excursao.quantidade ? formatBRL(excursao.preco * excursao.quantidade) : '0,00');
    }

    function preencherDadosViagem() {
        var qtd = parseInt(excursao.quantidade, 10) || 1;
        var totalValor = (excursao.preco != null ? Number(excursao.preco) : 0) * qtd;
        var produtoTexto = (excursao.titulo || 'Excursão') + ' x ' + qtd;
        var totalStr = 'R$ ' + formatBRL(totalValor);

        var elProduto = document.getElementById('dadosViagemProduto');
        var elSubtotal = document.getElementById('dadosViagemSubtotal');
        var elTotalLabel = document.getElementById('dadosViagemTotalLabel');
        var elTotal = document.getElementById('dadosViagemTotal');
        if (elProduto) elProduto.textContent = produtoTexto;
        if (elSubtotal) elSubtotal.textContent = totalStr;
        if (elTotalLabel) elTotalLabel.textContent = totalStr;
        if (elTotal) elTotal.textContent = totalStr;

        var sobre = stripHtml(excursao.descricao || '') || excursao.subtitulo || '—';
        if (sobre.length > 400) sobre = sobre.substring(0, 397) + '...';
        var elSobre = document.getElementById('dadosViagemSobre');
        if (elSobre) elSobre.textContent = sobre;

        var inclusosList = parseListText(excursao.inclusos);
        var elInclusos = document.getElementById('dadosViagemInclusos');
        if (elInclusos) {
            if (inclusosList.length) {
                elInclusos.innerHTML = inclusosList.map(function (item) { return '<li>' + (item.replace(/</g, '&lt;')) + '</li>'; }).join('');
            } else {
                elInclusos.textContent = '—';
            }
        }

        var recList = parseListText(excursao.recomendacoes);
        var elRec = document.getElementById('dadosViagemRecomendacoes');
        if (elRec) {
            if (recList.length) {
                elRec.innerHTML = recList.map(function (item) { return '<li>' + (item.replace(/</g, '&lt;')) + '</li>'; }).join('');
            } else {
                elRec.textContent = '—';
            }
        }

        var elLocal = document.getElementById('dadosViagemLocal');
        var elHorario = document.getElementById('dadosViagemHorario');
        if (elLocal) elLocal.textContent = excursao.local || '—';
        if (elHorario) elHorario.textContent = excursao.horario || '—';
    }

    function gerarFormularios() {
        var container = document.getElementById('alunosContainer');
        if (!container) return;
        var qtd = Math.max(1, Math.min(50, parseInt(excursao.quantidade, 10) || 1));
        var i;
        for (i = 1; i <= qtd; i++) {
            container.innerHTML +=
                '<section class="form-section" data-aluno="' + i + '">' +
                '<h2 class="form-section-title"><i class="fas fa-user"></i> Aluno ' + i + '</h2>' +
                '<div class="form-grid">' +
                '<div class="form-group">' +
                '<label for="nomeAluno_' + i + '">Nome completo <span class="required">*</span></label>' +
                '<input type="text" id="nomeAluno_' + i + '" name="nomeAluno_' + i + '" required minlength="3" placeholder="Ex.: Maria Silva">' +
                '</div>' +
                '<div class="form-group">' +
                '<label for="idadeAluno_' + i + '">Idade</label>' +
                '<span class="label-hint">Entre 1 e 120</span>' +
                '<input type="number" id="idadeAluno_' + i + '" name="idadeAluno_' + i + '" min="1" max="120" placeholder="Ex.: 14">' +
                '</div>' +
                '</div>' +
                '<div class="form-grid">' +
                '<div class="form-group">' +
                '<label for="escolaAluno_' + i + '">Escola</label>' +
                '<input type="text" id="escolaAluno_' + i + '" name="escolaAluno_' + i + '" placeholder="Ex.: E.E. Nelson Ferreira">' +
                '</div>' +
                '<div class="form-group">' +
                '<label for="serieAluno_' + i + '">Série</label>' +
                '<input type="text" id="serieAluno_' + i + '" name="serieAluno_' + i + '" placeholder="Ex.: 6º ano">' +
                '</div>' +
                '</div>' +
                '<h3 class="form-section-subtitle">Dados do responsável</h3>' +
                '<div class="form-grid">' +
                '<div class="form-group">' +
                '<label for="responsavel_' + i + '">Nome do responsável</label>' +
                '<input type="text" id="responsavel_' + i + '" name="responsavel_' + i + '" placeholder="Ex.: João Silva">' +
                '</div>' +
                '<div class="form-group">' +
                '<label for="telefoneResponsavel_' + i + '">Telefone</label>' +
                '<span class="label-hint">Formato: (11) 98888-8888</span>' +
                '<input type="tel" id="telefoneResponsavel_' + i + '" name="telefoneResponsavel_' + i + '" placeholder="(11) 98888-8888">' +
                '</div>' +
                '</div>' +
                '<div class="form-grid form-grid-full">' +
                '<div class="form-group">' +
                '<label for="emailResponsavel_' + i + '">Email do responsável</label>' +
                '<input type="email" id="emailResponsavel_' + i + '" name="emailResponsavel_' + i + '" placeholder="exemplo@email.com">' +
                '</div>' +
                '</div>' +
                '</section>';
        }
    }

    function getFormValue(form, name) {
        var el = form.elements[name];
        return el ? el.value.trim() : '';
    }

    /**
     * Remove marcação de erro dos campos e mensagens inline.
     */
    function clearFieldErrors(form) {
        if (!form) return;
        var inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(function (el) {
            el.classList.remove('input-invalid');
            el.removeAttribute('aria-invalid');
        });
        form.querySelectorAll('.field-error-msg').forEach(function (el) {
            el.remove();
        });
    }

    /**
     * Converte path da API (ex: dadosAlunos.0.emailResponsavel) em nome do input (emailResponsavel_1).
     */
    function apiPathToInputName(path) {
        var match = path && path.match(/^dadosAlunos\.(\d+)\.(.+)$/);
        if (!match) return null;
        var index = parseInt(match[1], 10);
        var field = match[2];
        return field + '_' + (index + 1);
    }

    /**
     * Exibe erros de validação: lista no topo e marcação nos campos.
     */
    function showValidationErrors(form, title, details, errorDiv) {
        if (!form || !details || !details.length) return;

        var list = [];
        var fieldNames = {
            nomeAluno: 'Nome do aluno',
            idadeAluno: 'Idade',
            escolaAluno: 'Escola',
            serieAluno: 'Série',
            responsavel: 'Nome do responsável',
            telefoneResponsavel: 'Telefone',
            emailResponsavel: 'Email do responsável'
        };

        details.forEach(function (d) {
            var inputName = apiPathToInputName(d.field);
            var label = d.field;
            if (inputName) {
                var idx = inputName.replace(/^.+\_/, '');
                var fieldKey = inputName.replace(/\_\d+$/, '');
                label = 'Aluno ' + idx + ' – ' + (fieldNames[fieldKey] || fieldKey);
            }
            list.push({ label: label, message: d.message, inputName: inputName });
        });

        details.forEach(function (d) {
            var inputName = apiPathToInputName(d.field);
            if (!inputName) return;
            var input = form.elements[inputName];
            if (!input) return;
            input.classList.add('input-invalid');
            input.setAttribute('aria-invalid', 'true');
            var wrap = input.closest('.form-group');
            if (wrap && !wrap.querySelector('.field-error-msg')) {
                var msg = document.createElement('span');
                msg.className = 'field-error-msg';
                msg.setAttribute('role', 'alert');
                msg.textContent = d.message;
                wrap.appendChild(msg);
            }
        });

        if (errorDiv) {
            errorDiv.innerHTML =
                '<p class="error-summary-title"><i class="fas fa-exclamation-circle"></i> ' + (title || 'Dados inválidos') + '</p>' +
                '<ul class="error-summary-list">' +
                list.map(function (item) {
                    return '<li><strong>' + (item.label || item.message) + '</strong>: ' + (item.inputName ? item.message : item.message) + '</li>';
                }).join('') +
                '</ul>';
            errorDiv.classList.add('show');
            errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    async function init() {
        await clienteAuth.requireAuth();

        var data = localStorage.getItem('checkout_excursao');
        if (!data) {
            alert('Nenhuma excursão selecionada');
            window.location.href = 'dashboard.html';
            return;
        }

        try {
            excursao = JSON.parse(data);
        } catch (e) {
            console.error('[Checkout] Erro ao ler excursão:', e);
            alert('Dados da excursão inválidos');
            window.location.href = 'dashboard.html';
            return;
        }

        if (!excursao.codigo || !excursao.quantidade) {
            alert('Nenhuma excursão selecionada');
            window.location.href = 'dashboard.html';
            return;
        }

        exibirResumo();
        preencherDadosViagem();
        gerarFormularios();

        var voltar = document.getElementById('voltarLink');
        if (voltar) voltar.addEventListener('click', function (e) { e.preventDefault(); history.back(); });

        var form = document.getElementById('checkoutForm');
        if (!form) return;

        form.addEventListener('submit', async function (e) {
            e.preventDefault();

            var finalizarBtn = document.getElementById('finalizarBtn');
            var errorDiv = document.getElementById('error');
            if (errorDiv) errorDiv.classList.remove('show');
            if (finalizarBtn) {
                finalizarBtn.disabled = true;
                finalizarBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
            }

            var dadosAlunos = [];
            var qtd = Math.max(1, Math.min(50, parseInt(excursao.quantidade, 10) || 1));
            var i;
            for (i = 1; i <= qtd; i++) {
                dadosAlunos.push({
                    nomeAluno: getFormValue(form, 'nomeAluno_' + i),
                    idadeAluno: parseInt(getFormValue(form, 'idadeAluno_' + i), 10) || undefined,
                    escolaAluno: getFormValue(form, 'escolaAluno_' + i) || undefined,
                    serieAluno: getFormValue(form, 'serieAluno_' + i) || undefined,
                    responsavel: getFormValue(form, 'responsavel_' + i) || undefined,
                    telefoneResponsavel: getFormValue(form, 'telefoneResponsavel_' + i) || undefined,
                    emailResponsavel: getFormValue(form, 'emailResponsavel_' + i) || undefined
                });
            }

            try {
                var response = await clienteAuth.fetchAuth('/cliente/pedidos', {
                    method: 'POST',
                    body: JSON.stringify({
                        codigoExcursao: excursao.codigo,
                        quantidade: excursao.quantidade,
                        dadosAlunos: dadosAlunos
                    })
                });

                var resData = await response.json();

                if (response.ok && resData.success) {
                    localStorage.removeItem('checkout_excursao');
                    alert('Pedido criado com sucesso!');
                    window.location.href = 'pedidos.html';
                    return;
                }

                // Remove marcação de erro anterior dos campos
                clearFieldErrors(form);

                if (!response.ok && resData.details && Array.isArray(resData.details) && resData.details.length > 0) {
                    showValidationErrors(form, resData.error, resData.details, errorDiv);
                } else {
                    if (errorDiv) {
                        errorDiv.innerHTML = '<i class="fas fa-exclamation-circle"></i> ' + (resData.error || 'Erro ao criar pedido');
                        errorDiv.classList.add('show');
                    }
                }
            } catch (err) {
                console.error('[Checkout] Erro:', err);
                clearFieldErrors(document.getElementById('checkoutForm'));
                if (errorDiv) {
                    errorDiv.innerHTML = '<i class="fas fa-exclamation-circle"></i> ' + (err.message || 'Erro ao criar pedido');
                    errorDiv.classList.add('show');
                }
            } finally {
                if (finalizarBtn) {
                    finalizarBtn.disabled = false;
                    finalizarBtn.innerHTML = '<i class="fas fa-check-circle"></i> Finalizar Pedido';
                }
            }
        });
    }

    if (typeof clienteAuth !== 'undefined') {
        init();
    } else {
        document.addEventListener('DOMContentLoaded', function () {
            if (typeof clienteAuth !== 'undefined') init();
        });
    }
})();

/**
 * Checkout do cliente - resumo da excursão (do localStorage) e formulários por participante.
 * Script externalizado para compatibilidade com Content-Security-Policy (CSP).
 */
(function () {
    var excursao = null;

    /** Exibe mensagem na tela (toast) em vez de alert. type: 'success' | 'error' | 'info' */
    function showToast(message, type) {
        type = type || 'info';
        var el = document.getElementById('checkoutToast');
        if (!el) return;
        el.textContent = message;
        el.className = 'checkout-toast show ' + type;
        el.setAttribute('role', 'alert');
        var t = setTimeout(function () {
            el.classList.remove('show');
        }, 5000);
        el.ontransitionend = el.ontransitionend || null;
    }

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

    var respFieldMap = { nome: 'respNome', sobrenome: 'respSobrenome', cpf: 'respCpf', pais: 'respPais', cep: 'respCep', endereco: 'respEndereco', complemento: 'respComplemento', numero: 'respNumero', cidade: 'respCidade', estado: 'respEstado', bairro: 'respBairro', telefone: 'respTelefone', email: 'respEmail' };

    function gerarResponsavelBlock() {
        var container = document.getElementById('responsavelContainer');
        if (!container) return;
        var estados = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];
        var opts = estados.map(function (uf) { return '<option value="' + uf + '">' + uf + '</option>'; }).join('');
        container.innerHTML =
            '<section class="form-section">' +
            '<h2 class="form-section-title"><i class="fas fa-user-tie"></i> Dados do Responsável Financeiro</h2>' +
            '<p class="subtitle" style="margin-bottom: 1rem;">Preencha os dados de quem fará o pagamento (um por pedido).</p>' +
            '<div class="form-grid">' +
            '<div class="form-group"><label for="respNome">Nome <span class="required">*</span></label><input type="text" id="respNome" name="respNome" required placeholder="Nome">' +
            '</div><div class="form-group"><label for="respSobrenome">Sobrenome <span class="required">*</span></label><input type="text" id="respSobrenome" name="respSobrenome" required placeholder="Sobrenome">' +
            '</div></div>' +
            '<div class="form-group"><label for="respCpf">CPF <span class="required">*</span></label><span class="label-hint">Formato: 000.000.000-00</span><input type="text" id="respCpf" name="respCpf" required placeholder="000.000.000-00">' +
            '</div>' +
            '<div class="form-group"><label for="respPais">País <span class="required">*</span></label><select id="respPais" name="respPais" required><option value="Brasil">Brasil</option><option value="Argentina">Argentina</option><option value="Uruguai">Uruguai</option><option value="Chile">Chile</option><option value="Paraguai">Paraguai</option></select>' +
            '</div>' +
            '<div class="form-grid"><div class="form-group"><label for="respCep">CEP <span class="required">*</span></label><input type="text" id="respCep" name="respCep" required placeholder="00000-000"></div>' +
            '<div class="form-group"><label for="respEndereco">Endereço <span class="required">*</span></label><input type="text" id="respEndereco" name="respEndereco" required placeholder="Rua e número"></div></div>' +
            '<div class="form-grid"><div class="form-group"><label for="respNumero">Número <span class="required">*</span></label><input type="text" id="respNumero" name="respNumero" required placeholder="Nº"></div>' +
            '<div class="form-group"><label for="respComplemento">Complemento</label><input type="text" id="respComplemento" name="respComplemento" placeholder="Apto, sala..."></div></div>' +
            '<div class="form-grid"><div class="form-group"><label for="respCidade">Cidade <span class="required">*</span></label><input type="text" id="respCidade" name="respCidade" required placeholder="Cidade"></div>' +
            '<div class="form-group"><label for="respEstado">Estado <span class="required">*</span></label><select id="respEstado" name="respEstado" required><option value="">Selecione</option>' + opts + '</select></div></div>' +
            '<div class="form-group"><label for="respBairro">Bairro</label><input type="text" id="respBairro" name="respBairro" placeholder="Bairro">' +
            '</div>' +
            '<div class="form-grid"><div class="form-group"><label for="respTelefone">Telefone <span class="required">*</span></label><span class="label-hint">(11) 98888-8888</span><input type="tel" id="respTelefone" name="respTelefone" required placeholder="(11) 98888-8888"></div>' +
            '<div class="form-group"><label for="respEmail">Email <span class="required">*</span></label><input type="email" id="respEmail" name="respEmail" required placeholder="email@exemplo.com"></div></div>' +
            '</section>';
    }

    function gerarFormularios() {
        var container = document.getElementById('alunosContainer');
        if (!container) return;
        var qtd = Math.max(1, Math.min(50, parseInt(excursao.quantidade, 10) || 1));
        var i;
        for (i = 1; i <= qtd; i++) {
            container.innerHTML +=
                '<details class="aluno-dropdown form-section-aluno" data-aluno="' + i + '" open>' +
                '<summary class="aluno-dropdown-header">' +
                '<span class="aluno-summary-text"><i class="fas fa-user-graduate"></i> Aluno ' + i + ' – Informações do estudante</span>' +
                '<span class="aluno-summary-hint">Clique para preencher os dados do aluno</span>' +
                '<i class="fas fa-chevron-down"></i>' +
                '</summary>' +
                '<div class="aluno-dropdown-content">' +
                '<div class="form-grid">' +
                '<div class="form-group"><label for="nomeAluno_' + i + '">Nome completo do estudante <span class="required">*</span></label><input type="text" id="nomeAluno_' + i + '" name="nomeAluno_' + i + '" required minlength="3" placeholder="Ex.: Maria Silva"></div>' +
                '<div class="form-group"><label for="dataNascimento_' + i + '">Data de nascimento <span class="required">*</span></label><input type="date" id="dataNascimento_' + i + '" name="dataNascimento_' + i + '" required></div>' +
                '</div>' +
                '<div class="form-grid">' +
                '<div class="form-group"><label for="cpfAluno_' + i + '">CPF do estudante <span class="required">*</span></label><span class="label-hint">000.000.000-00</span><input type="text" id="cpfAluno_' + i + '" name="cpfAluno_' + i + '" required placeholder="000.000.000-00"></div>' +
                '<div class="form-group"><label for="rgAluno_' + i + '">RG do aluno</label><input type="text" id="rgAluno_' + i + '" name="rgAluno_' + i + '" placeholder="MG 14.123.456"></div>' +
                '</div>' +
                '<div class="form-grid">' +
                '<div class="form-group"><label for="idadeAluno_' + i + '">Idade</label><input type="number" id="idadeAluno_' + i + '" name="idadeAluno_' + i + '" min="1" max="120" placeholder="Ex.: 14"></div>' +
                '<div class="form-group"><label for="serieAluno_' + i + '">Série <span class="required">*</span></label><input type="text" id="serieAluno_' + i + '" name="serieAluno_' + i + '" required placeholder="Ex.: 2º ano"></div>' +
                '</div>' +
                '<div class="form-grid">' +
                '<div class="form-group"><label for="turma_' + i + '">Turma <span class="required">*</span></label><input type="text" id="turma_' + i + '" name="turma_' + i + '" required placeholder="Ex.: A, B, C"></div>' +
                '<div class="form-group"><label for="escolaAluno_' + i + '">Escola</label><input type="text" id="escolaAluno_' + i + '" name="escolaAluno_' + i + '" placeholder="Ex.: E.E. Nelson Ferreira"></div>' +
                '</div>' +
                '<div class="form-group"><label for="unidadeColegio_' + i + '">Unidade do colégio <span class="required">*</span></label><input type="text" id="unidadeColegio_' + i + '" name="unidadeColegio_' + i + '" required placeholder="Unidade à qual o estudante pertence">' +
                '</div>' +
                '<h3 class="form-section-subtitle"><i class="fas fa-heartbeat"></i> Informações médicas</h3>' +
                '<div class="form-group"><label for="alergiasCuidados_' + i + '">Alergias ou cuidados especiais? <span class="required">*</span></label><textarea id="alergiasCuidados_' + i + '" name="alergiasCuidados_' + i + '" rows="3" required placeholder="Descreva alergias, restrições ou cuidados especiais"></textarea></div>' +
                '<div class="form-grid">' +
                '<div class="form-group"><label for="planoSaude_' + i + '">Plano de saúde do aluno</label><input type="text" id="planoSaude_' + i + '" name="planoSaude_' + i + '" placeholder="Nome do plano"></div>' +
                '<div class="form-group"><label for="medicamentosFebre_' + i + '">Medicamentos em caso de febre/dor</label><input type="text" id="medicamentosFebre_' + i + '" name="medicamentosFebre_' + i + '" placeholder="Ex.: Paracetamol"></div>' +
                '</div>' +
                '<div class="form-group"><label for="medicamentosAlergia_' + i + '">Medicamentos em caso de alergia</label><input type="text" id="medicamentosAlergia_' + i + '" name="medicamentosAlergia_' + i + '" placeholder="Ex.: Antialérgico"></div>' +
                '</div>' +
                '</details>';
        }
    }

    function getFormValue(form, name) {
        var el = form.elements[name];
        return el ? el.value.trim() : '';
    }

    var pedidoIdPagamento = null;
    var valorPagamento = 0;
    var pixQrCode = null;
    var pollStatusInterval = null;
    var pollStatusTimeout = null;
    var pagamentoListenersAdded = false;

    function mostrarEtapaPagamento(pedidoId, valorTotal) {
        pedidoIdPagamento = pedidoId;
        valorPagamento = valorTotal;
        var form = document.getElementById('checkoutForm');
        var stepPag = document.getElementById('checkoutStepPagamento');
        var finalizarBtn = document.getElementById('finalizarBtn');

        // Pré-preenche dados do titular do cartão com dados do RESPONSÁVEL (nunca do aluno)
        var respNome = (document.getElementById('respNome') && document.getElementById('respNome').value) || '';
        var respSobrenome = (document.getElementById('respSobrenome') && document.getElementById('respSobrenome').value) || '';
        var respCpf = (document.getElementById('respCpf') && document.getElementById('respCpf').value) || '';
        var respCep = (document.getElementById('respCep') && document.getElementById('respCep').value) || '';
        var respNumero = (document.getElementById('respNumero') && document.getElementById('respNumero').value) || '';
        var respTelefone = (document.getElementById('respTelefone') && document.getElementById('respTelefone').value) || '';
        var respEmail = (document.getElementById('respEmail') && document.getElementById('respEmail').value) || '';
        var nomeCompletoResp = [respNome, respSobrenome].filter(Boolean).join(' ').trim();
        var cardHolder = document.getElementById('cardHolder');
        var cardHolderName = document.getElementById('cardHolderName');
        var cardHolderEmail = document.getElementById('cardHolderEmail');
        var cardHolderCpf = document.getElementById('cardHolderCpf');
        var cardHolderCep = document.getElementById('cardHolderCep');
        var cardHolderAddressNumber = document.getElementById('cardHolderAddressNumber');
        var cardHolderPhone = document.getElementById('cardHolderPhone');
        if (cardHolder && nomeCompletoResp) cardHolder.value = nomeCompletoResp;
        if (cardHolderName && nomeCompletoResp) cardHolderName.value = nomeCompletoResp;
        if (cardHolderEmail && respEmail) cardHolderEmail.value = respEmail;
        if (cardHolderCpf && respCpf) cardHolderCpf.value = respCpf;
        if (cardHolderCep && respCep) cardHolderCep.value = respCep;
        if (cardHolderAddressNumber && respNumero) cardHolderAddressNumber.value = respNumero;
        if (cardHolderPhone && respTelefone) cardHolderPhone.value = respTelefone;

        if (form) form.style.display = 'none';
        if (finalizarBtn) finalizarBtn.style.display = 'none';
        if (stepPag) {
            stepPag.classList.add('show');
            var pagamentoValorEl = document.getElementById('pagamentoValor');
            if (pagamentoValorEl) pagamentoValorEl.textContent = 'R$ ' + formatBRL(valorTotal);
        }

        if (!pagamentoListenersAdded) {
            pagamentoListenersAdded = true;
            var opcaoPix = document.getElementById('opcaoPix');
            var opcaoCartao = document.getElementById('opcaoCartao');
            var pixBox = document.getElementById('pixBox');
            var cartaoBox = document.getElementById('cartaoBox');
            if (opcaoPix) {
                opcaoPix.addEventListener('click', function () {
                    document.querySelectorAll('.payment-option').forEach(function (o) { o.classList.remove('selected'); });
                    opcaoPix.classList.add('selected');
                    if (pixBox) pixBox.classList.remove('show');
                    if (cartaoBox) cartaoBox.classList.remove('show');
                    if (pixBox) pixBox.classList.add('show');
                    gerarPix();
                });
            }
            if (opcaoCartao) {
                opcaoCartao.addEventListener('click', function () {
                    document.querySelectorAll('.payment-option').forEach(function (o) { o.classList.remove('selected'); });
                    opcaoCartao.classList.add('selected');
                    if (pixBox) pixBox.classList.remove('show');
                    if (cartaoBox) cartaoBox.classList.add('show');
                });
            }
            var btnCopiarPix = document.getElementById('btnCopiarPix');
            if (btnCopiarPix) {
                btnCopiarPix.addEventListener('click', function () {
                    if (pixQrCode) {
                        navigator.clipboard.writeText(pixQrCode).then(function () {
                            showToast('Código PIX copiado! Cole no app do seu banco.', 'success');
                        }).catch(function () { showToast('Não foi possível copiar.', 'error'); });
                    }
                });
            }
            var formCartao = document.getElementById('formCartao');
            if (formCartao) {
                formCartao.addEventListener('submit', function (e) {
                    e.preventDefault();
                    pagarComCartao();
                });
            }
        }

        // Seleção inicial: PIX em destaque e exibir QR Code
        document.querySelectorAll('.payment-option').forEach(function (o) { o.classList.remove('selected'); });
        var opcaoPixEl = document.getElementById('opcaoPix');
        var pixBoxEl = document.getElementById('pixBox');
        var cartaoBoxEl = document.getElementById('cartaoBox');
        if (opcaoPixEl) opcaoPixEl.classList.add('selected');
        if (pixBoxEl) pixBoxEl.classList.add('show');
        if (cartaoBoxEl) cartaoBoxEl.classList.remove('show');
        gerarPix();
    }

    function gerarPix() {
        var container = document.getElementById('pixQrContainer');
        var btn = document.getElementById('btnCopiarPix');
        if (!pedidoIdPagamento || !container) return;
        container.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Gerando cobrança PIX...</p>';
        if (btn) btn.style.display = 'none';
        clienteAuth.fetchAuth('/cliente/pagamento/pix', {
            method: 'POST',
            body: JSON.stringify({ pedidoId: pedidoIdPagamento })
        }).then(function (response) {
            return response.json().catch(function () { return {}; }).then(function (data) {
                if (!response.ok) {
                    var msg = (data && (data.error || data.message)) || 'Erro ao gerar PIX. Tente novamente.';
                    container.innerHTML = '<p style="color: var(--danger-color);"><i class="fas fa-exclamation-circle"></i> ' + String(msg).replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</p>';
                    if (btn) btn.style.display = 'none';
                    return;
                }
                if (!data.success || !data.data) {
                    var errMsg = (data && (data.error || data.message)) || 'Erro ao gerar PIX';
                    container.innerHTML = '<p style="color: var(--danger-color);"><i class="fas fa-exclamation-circle"></i> ' + String(errMsg).replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</p>';
                    if (btn) btn.style.display = 'none';
                    return;
                }
                pixQrCode = data.data.qrCode || '';
                var html = '';
                if (data.data.qrCodeImage) {
                    var imgBase64 = String(data.data.qrCodeImage).trim();
                    var imgSrc = imgBase64.indexOf('data:') === 0 ? imgBase64 : ('data:image/png;base64,' + imgBase64);
                    html += '<img src="' + imgSrc.replace(/"/g, '&quot;') + '" alt="QR Code PIX">';
                }
                if (pixQrCode) {
                    html += '<p class="pix-code-text" style="margin-top: 0.75rem;">Ou copie o código PIX com o botão abaixo.</p>';
                }
                if (!html) html = '<p style="color: var(--text-light);">Use o botão abaixo para copiar o código PIX.</p>';
                container.innerHTML = html;
                if (btn) btn.style.display = 'inline-block';
                iniciarPollStatus();
            });
        }).catch(function (err) {
            container.innerHTML = '<p style="color: var(--danger-color);"><i class="fas fa-exclamation-circle"></i> Falha na conexão. Verifique sua internet e tente novamente.</p>';
            if (btn) btn.style.display = 'none';
            console.error('[Checkout] PIX:', err);
        });
    }

    function iniciarPollStatus() {
        if (pollStatusInterval) clearInterval(pollStatusInterval);
        if (pollStatusTimeout) clearTimeout(pollStatusTimeout);

        function pararPolling() {
            if (pollStatusInterval) { clearInterval(pollStatusInterval); pollStatusInterval = null; }
            if (pollStatusTimeout) { clearTimeout(pollStatusTimeout); pollStatusTimeout = null; }
        }

        function doCheck() {
            if (!pedidoIdPagamento) return;
            clienteAuth.fetchAuth('/cliente/pagamento/' + pedidoIdPagamento + '/status').then(function (r) { return r.json(); }).then(function (data) {
                if (data.success && data.data && (data.data.status === 'PAGO' || data.data.status === 'CONFIRMADO')) {
                    pararPolling();
                    showToast('Pagamento confirmado! Redirecionando...', 'success');
                    window.location.href = 'pedidos.html';
                }
            }).catch(function () {});
        }

        // Primeira verificação: 3 minutos após a compra
        pollStatusTimeout = setTimeout(function () {
            pollStatusTimeout = null;
            doCheck();
            // Depois: a cada 4 horas
            pollStatusInterval = setInterval(doCheck, 4 * 60 * 60 * 1000);
        }, 3 * 60 * 1000);
    }

    function onlyDigits(s) {
        return String(s).replace(/\D/g, '');
    }

    function pagarComCartao() {
        var btn = document.getElementById('btnPagarCartao');
        var num = onlyDigits(document.getElementById('cardNumber').value);
        var expiry = document.getElementById('cardExpiry').value.trim();
        var parts = expiry.split('/');
        var expiryMonth = (parts[0] || '').replace(/\D/g, '');
        var expiryYear = (parts[1] || '').replace(/\D/g, '');
        if (expiryYear.length === 2) expiryYear = '20' + expiryYear;
        var creditCard = {
            holderName: document.getElementById('cardHolder').value.trim(),
            number: num,
            expiryMonth: expiryMonth.length === 1 ? '0' + expiryMonth : expiryMonth,
            expiryYear: expiryYear,
            ccv: document.getElementById('cardCvv').value.replace(/\D/g, '')
        };
        var creditCardHolderInfo = {
            name: document.getElementById('cardHolderName').value.trim(),
            email: document.getElementById('cardHolderEmail').value.trim(),
            cpfCnpj: onlyDigits(document.getElementById('cardHolderCpf').value),
            postalCode: onlyDigits(document.getElementById('cardHolderCep').value),
            addressNumber: document.getElementById('cardHolderAddressNumber').value.trim(),
            phone: onlyDigits(document.getElementById('cardHolderPhone').value)
        };
        if (creditCard.number.length < 13 || creditCard.expiryMonth.length !== 2 || creditCard.expiryYear.length !== 4 || creditCard.ccv.length < 3) {
            showToast('Preencha corretamente os dados do cartão (número, validade MM/AA e CVV).', 'error');
            return;
        }
        if (creditCardHolderInfo.cpfCnpj.length < 11 || creditCardHolderInfo.postalCode.length < 8 || creditCardHolderInfo.phone.length < 10) {
            showToast('Preencha CPF (11 dígitos), CEP (8 dígitos) e telefone.', 'error');
            return;
        }
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
        clienteAuth.fetchAuth('/cliente/pagamento/cartao', {
            method: 'POST',
            body: JSON.stringify({
                pedidoId: pedidoIdPagamento,
                creditCard: creditCard,
                creditCardHolderInfo: creditCardHolderInfo
            })
        }).then(function (r) { return r.json(); }).then(function (data) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-lock"></i> Pagar com cartão';
            if (data.success) {
                showToast(data.message || 'Pagamento processado! Redirecionando...', 'success');
                window.location.href = 'pedidos.html';
            } else {
                showToast(data.error || 'Erro ao processar pagamento.', 'error');
            }
        }).catch(function (err) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-lock"></i> Pagar com cartão';
            showToast(err.message || 'Erro ao processar. Tente novamente.', 'error');
        });
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
     * Converte path da API em nome do input.
     * dadosAlunos.0.emailResponsavel -> emailResponsavel_1; dadosResponsavelFinanceiro.nome -> respNome
     */
    function apiPathToInputName(path) {
        var mAluno = path && path.match(/^dadosAlunos\.(\d+)\.(.+)$/);
        if (mAluno) return mAluno[2] + '_' + (parseInt(mAluno[1], 10) + 1);
        var mResp = path && path.match(/^dadosResponsavelFinanceiro\.(.+)$/);
        if (mResp && respFieldMap[mResp[1]]) return respFieldMap[mResp[1]];
        return null;
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
            dataNascimento: 'Data de nascimento',
            escolaAluno: 'Escola',
            serieAluno: 'Série',
            turma: 'Turma',
            unidadeColegio: 'Unidade do colégio',
            cpfAluno: 'CPF do estudante',
            rgAluno: 'RG do aluno',
            responsavel: 'Nome do responsável',
            telefoneResponsavel: 'Telefone',
            emailResponsavel: 'Email do responsável',
            alergiasCuidados: 'Alergias/cuidados especiais',
            planoSaude: 'Plano de saúde',
            medicamentosFebre: 'Medicamentos febre/dor',
            medicamentosAlergia: 'Medicamentos alergia'
        };
        var respLabels = { nome: 'Nome', sobrenome: 'Sobrenome', cpf: 'CPF', pais: 'País', cep: 'CEP', endereco: 'Endereço', complemento: 'Complemento', numero: 'Número', cidade: 'Cidade', estado: 'Estado', bairro: 'Bairro', telefone: 'Telefone', email: 'Email' };

        details.forEach(function (d) {
            var inputName = apiPathToInputName(d.field);
            var label = d.field;
            if (inputName) {
                var mResp = d.field && d.field.match(/^dadosResponsavelFinanceiro\.(.+)$/);
                if (mResp && respLabels[mResp[1]]) {
                    label = 'Responsável – ' + respLabels[mResp[1]];
                } else {
                    var idx = (inputName.match(/_(\d+)$/) || [])[1];
                    var fieldKey = inputName.replace(/\_\d+$/, '');
                    label = idx ? 'Aluno ' + idx + ' – ' + (fieldNames[fieldKey] || fieldKey) : (fieldNames[fieldKey] || fieldKey);
                }
            }
            list.push({ label: label, message: d.message, inputName: inputName });
        });

        details.forEach(function (d) {
            var inputName = apiPathToInputName(d.field);
            if (!inputName) return;
            var input = form.querySelector('[name="' + inputName + '"]') || form.elements[inputName];
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
            showToast('Nenhuma excursão selecionada. Redirecionando...', 'error');
            setTimeout(function () { window.location.href = 'dashboard.html'; }, 1500);
            return;
        }

        try {
            excursao = JSON.parse(data);
        } catch (e) {
            console.error('[Checkout] Erro ao ler excursão:', e);
            showToast('Dados da excursão inválidos. Redirecionando...', 'error');
            setTimeout(function () { window.location.href = 'dashboard.html'; }, 1500);
            return;
        }

        if (!excursao.codigo || !excursao.quantidade) {
            showToast('Nenhuma excursão selecionada. Redirecionando...', 'error');
            setTimeout(function () { window.location.href = 'dashboard.html'; }, 1500);
            return;
        }

        exibirResumo();
        preencherDadosViagem();
        gerarResponsavelBlock();
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

            var dadosResponsavelFinanceiro = {
                nome: getFormValue(form, 'respNome'),
                sobrenome: getFormValue(form, 'respSobrenome'),
                cpf: getFormValue(form, 'respCpf'),
                pais: getFormValue(form, 'respPais'),
                cep: getFormValue(form, 'respCep'),
                endereco: getFormValue(form, 'respEndereco'),
                complemento: getFormValue(form, 'respComplemento') || undefined,
                numero: getFormValue(form, 'respNumero'),
                cidade: getFormValue(form, 'respCidade'),
                estado: getFormValue(form, 'respEstado'),
                bairro: getFormValue(form, 'respBairro') || undefined,
                telefone: getFormValue(form, 'respTelefone'),
                email: getFormValue(form, 'respEmail')
            };

            var dadosAlunos = [];
            var qtd = Math.max(1, Math.min(50, parseInt(excursao.quantidade, 10) || 1));
            var i;
            for (i = 1; i <= qtd; i++) {
                dadosAlunos.push({
                    nomeAluno: getFormValue(form, 'nomeAluno_' + i),
                    idadeAluno: parseInt(getFormValue(form, 'idadeAluno_' + i), 10) || undefined,
                    dataNascimento: getFormValue(form, 'dataNascimento_' + i) || undefined,
                    escolaAluno: getFormValue(form, 'escolaAluno_' + i) || undefined,
                    serieAluno: getFormValue(form, 'serieAluno_' + i) || undefined,
                    turma: getFormValue(form, 'turma_' + i) || undefined,
                    unidadeColegio: getFormValue(form, 'unidadeColegio_' + i) || undefined,
                    cpfAluno: getFormValue(form, 'cpfAluno_' + i) || undefined,
                    rgAluno: getFormValue(form, 'rgAluno_' + i) || undefined,
                    alergiasCuidados: getFormValue(form, 'alergiasCuidados_' + i) || undefined,
                    planoSaude: getFormValue(form, 'planoSaude_' + i) || undefined,
                    medicamentosFebre: getFormValue(form, 'medicamentosFebre_' + i) || undefined,
                    medicamentosAlergia: getFormValue(form, 'medicamentosAlergia_' + i) || undefined
                });
            }

            try {
                var response = await clienteAuth.fetchAuth('/cliente/pedidos', {
                    method: 'POST',
                    body: JSON.stringify({
                        codigoExcursao: excursao.codigo,
                        quantidade: excursao.quantidade,
                        dadosResponsavelFinanceiro: dadosResponsavelFinanceiro,
                        dadosAlunos: dadosAlunos
                    })
                });

                var resData = await response.json();

                if (response.ok && resData.success) {
                    localStorage.removeItem('checkout_excursao');
                    var pedidoId = resData.data && resData.data.id;
                    var valorTotal = (resData.data && resData.data.valorTotal != null) ? Number(resData.data.valorTotal) : (excursao.preco * excursao.quantidade);
                    if (!pedidoId) {
                        showToast('Pedido criado, mas não foi possível abrir o pagamento.', 'error');
                        setTimeout(function () { window.location.href = 'pedidos.html'; }, 2500);
                        return;
                    }
                    mostrarEtapaPagamento(pedidoId, valorTotal);
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

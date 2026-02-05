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
                '<h2><i class="fas fa-user"></i> Aluno ' + i + '</h2>' +
                '<div class="form-grid">' +
                '<div class="form-group"><label>Nome Completo *</label><input type="text" name="nomeAluno_' + i + '" required minlength="3"></div>' +
                '<div class="form-group"><label>Idade</label><input type="number" name="idadeAluno_' + i + '" min="1" max="120"></div>' +
                '</div>' +
                '<div class="form-grid">' +
                '<div class="form-group"><label>Escola</label><input type="text" name="escolaAluno_' + i + '"></div>' +
                '<div class="form-group"><label>Série</label><input type="text" name="serieAluno_' + i + '"></div>' +
                '</div>' +
                '<h3 style="font-size: 1rem; color: #666; margin-top: 1rem;">Dados do Responsável</h3>' +
                '<div class="form-grid">' +
                '<div class="form-group"><label>Nome do Responsável</label><input type="text" name="responsavel_' + i + '"></div>' +
                '<div class="form-group"><label>Telefone</label><input type="tel" name="telefoneResponsavel_' + i + '" placeholder="(11) 98888-8888"></div>' +
                '<div class="form-group"><label>Email</label><input type="email" name="emailResponsavel_' + i + '"></div>' +
                '</div>';
        }
    }

    function getFormValue(form, name) {
        var el = form.elements[name];
        return el ? el.value.trim() : '';
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
                } else {
                    throw new Error(resData.error || 'Erro ao criar pedido');
                }
            } catch (err) {
                console.error('[Checkout] Erro:', err);
                if (errorDiv) {
                    errorDiv.textContent = err.message || 'Erro ao criar pedido';
                    errorDiv.classList.add('show');
                }
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

/**
 * Explicação do Arquivo [status-pedido-modal.js]
 *
 * Modal de alteração do status de um pedido, compartilhado pelas telas de
 * Listagem Convencional e de Listas de Alunos.
 *
 * Por que é um componente e não código repetido nas duas telas: a regra que
 * decide o que é permitido vem do backend, mas a forma de apresentá-la — o que
 * fica bloqueado, o que exige confirmação, como a consequência é escrita — é
 * justamente o que não pode divergir entre as telas. Duplicar significaria que
 * um ajuste na explicação vale numa tela e não na outra.
 *
 * Uso:
 *   StatusPedidoModal.abrir(pedidoId, { aoConcluir: recarregarLista });
 *
 * O modal monta a própria marcação na primeira abertura, então as páginas só
 * precisam incluir este script.
 */

const StatusPedidoModal = (function () {
  const ID_OVERLAY = 'modalStatusPedido';

  let pedidoAtualId = null;
  let dadosAvaliacao = null;
  let statusEscolhido = null;
  let aoConcluirCallback = null;

  /**
   * Explicação da função [obterToken]
   * Recupera o token do admin, seguindo o mesmo caminho das demais telas.
   */
  function obterToken() {
    return typeof AuthManager !== 'undefined'
      ? AuthManager.getToken()
      : localStorage.getItem('avorar_token');
  }

  /**
   * Explicação da função [escapar]
   * Escapa texto vindo da API antes de injetar no HTML.
   */
  function escapar(texto) {
    const div = document.createElement('div');
    div.textContent = texto === null || texto === undefined ? '' : String(texto);
    return div.innerHTML;
  }

  /**
   * Explicação da função [garantirMarcacao]
   * Cria o overlay do modal na primeira abertura e liga os eventos fixos.
   */
  function garantirMarcacao() {
    if (document.getElementById(ID_OVERLAY)) return;

    // Classes próprias, e não as do modal de cada página: a Listagem
    // Convencional define `.modal-content` no próprio HTML e a tela de listas usa
    // `.modal` do CSS global. Reaproveitar uma das duas deixaria o componente
    // sem estilo na outra tela.
    const overlay = document.createElement('div');
    overlay.id = ID_OVERLAY;
    overlay.className = 'status-pedido-overlay oculto';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'modalStatusPedidoTitulo');
    overlay.innerHTML = `
      <div class="status-pedido-caixa">
        <div class="status-pedido-cabecalho">
          <h3 id="modalStatusPedidoTitulo"><i class="fas fa-exchange-alt"></i> Alterar status do pedido</h3>
          <button type="button" class="status-pedido-fechar" id="btnFecharModalStatusPedido" aria-label="Fechar">&times;</button>
        </div>
        <div class="status-pedido-corpo">
          <div id="statusPedidoResumo" class="status-pedido-resumo"></div>
          <div id="statusPedidoOpcoes" class="status-pedido-opcoes"></div>
          <div id="statusPedidoConfirmacoes" class="status-pedido-confirmacoes"></div>
          <label class="status-pedido-aviso-cliente">
            <input type="checkbox" id="statusPedidoAvisarCliente">
            <span>Avisar o cliente por e-mail sobre esta mudança</span>
          </label>
        </div>
        <div class="status-pedido-rodape">
          <button type="button" class="btn btn-secondary" id="btnCancelarModalStatusPedido">Cancelar</button>
          <button type="button" class="btn btn-success" id="btnSalvarModalStatusPedido" disabled>
            <i class="fas fa-save"></i> Salvar status
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById('btnFecharModalStatusPedido').addEventListener('click', fechar);
    document.getElementById('btnCancelarModalStatusPedido').addEventListener('click', fechar);
    document.getElementById('btnSalvarModalStatusPedido').addEventListener('click', salvar);
  }

  /**
   * Explicação da função [fechar]
   * Oculta o modal e descarta o estado da avaliação carregada.
   */
  function fechar() {
    const overlay = document.getElementById(ID_OVERLAY);
    if (overlay) {
      overlay.classList.add('oculto');
      document.body.style.overflow = '';
    }
    pedidoAtualId = null;
    dadosAvaliacao = null;
    statusEscolhido = null;
  }

  /**
   * Explicação da função [renderizarResumo]
   * Mostra o retrato do pedido que sustenta os vereditos: quanto foi pago, em
   * que excursão ele está e como andam as vagas.
   *
   * O operador precisa desse contexto para julgar a consequência; sem ele, as
   * frases das opções seriam afirmações sem lastro visível.
   */
  function renderizarResumo(dados) {
    const el = document.getElementById('statusPedidoResumo');
    const p = dados.pedido;
    const e = dados.excursao;
    const g = dados.gateway;

    const partes = [];
    partes.push('<strong>Status atual:</strong> ' + escapar(p.status));

    if (p.dataPagamento) {
      const valor = Number(p.valorTotal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      partes.push('<strong>' + escapar(valor) + '</strong> recebidos em ' +
        escapar(new Date(p.dataPagamento).toLocaleDateString('pt-BR')));
    }

    if (p.clienteNome) partes.push('Cliente: ' + escapar(p.clienteNome));

    let html = '<p>' + partes.join(' &middot; ') + '</p>';

    if (e) {
      const vagasTexto = e.vagasTotais === null
        ? 'vagas ilimitadas'
        : (e.vagasOcupadasPorOutros + ' de ' + e.vagasTotais + ' vagas ocupadas por outros pedidos');
      html += '<p>' + escapar(e.titulo) + ' &middot; ' + escapar(vagasTexto) + '</p>';
    }

    // Três situações distintas: não ter cobrança é normal, a consulta falhar não.
    if (g && g.situacao === 'consultado') {
      const gatewayTexto = 'Gateway: ' + escapar(g.statusBruto) +
        (g.reconheceuPagamento ? ' (pagamento reconhecido)' : ' (sem pagamento reconhecido)');
      html += '<p class="status-pedido-gateway">' + gatewayTexto + '</p>';
    } else if (g && g.situacao === 'sem_cobranca') {
      html += '<p class="status-pedido-gateway">Sem cobrança registrada em gateway para este pedido.</p>';
    } else {
      html += '<p class="status-pedido-gateway status-pedido-gateway-indisponivel">' +
        'Não foi possível consultar o gateway agora — a situação da cobrança não pôde ser verificada.</p>';
    }

    el.innerHTML = html;
  }

  /**
   * Explicação da função [renderizarOpcoes]
   * Desenha os seis status como lista, cada um com o veredito e os motivos.
   *
   * É lista e não `select` porque cada opção carrega a própria explicação: num
   * seletor, a consequência só apareceria depois da escolha — tarde demais.
   */
  function renderizarOpcoes(opcoes) {
    const el = document.getElementById('statusPedidoOpcoes');

    el.innerHTML = opcoes.map(function (o) {
      const desabilitado = o.veredito === 'atual' || o.veredito === 'bloqueado';
      const motivos = o.motivos.map(function (m) {
        return '<li>' + escapar(m) + '</li>';
      }).join('');

      let etiqueta = '';
      if (o.veredito === 'atual') etiqueta = '<span class="status-pedido-etiqueta">status atual</span>';
      if (o.veredito === 'bloqueado') etiqueta = '<span class="status-pedido-etiqueta bloqueado">bloqueado</span>';
      if (o.veredito === 'exige_confirmacao') etiqueta = '<span class="status-pedido-etiqueta atencao">exige confirmação</span>';

      return '' +
        '<label class="status-pedido-opcao ' + o.veredito + '">' +
          '<input type="radio" name="statusPedidoDestino" value="' + escapar(o.status) + '"' +
            (desabilitado ? ' disabled' : '') + '>' +
          '<div class="status-pedido-opcao-corpo">' +
            '<div class="status-pedido-opcao-titulo">' + escapar(o.rotulo) + etiqueta + '</div>' +
            '<ul class="status-pedido-motivos">' + motivos + '</ul>' +
          '</div>' +
        '</label>';
    }).join('');

    el.querySelectorAll('input[name="statusPedidoDestino"]').forEach(function (radio) {
      radio.addEventListener('change', function () {
        statusEscolhido = this.value;
        renderizarConfirmacoes();
      });
    });
  }

  /**
   * Explicação da função [renderizarConfirmacoes]
   * Exibe as caixas de confirmação exigidas pelo status escolhido.
   *
   * Cada caixa repete a consequência específica daquele pedido, em vez de um
   * "tem certeza?" genérico — a intenção é que a frase seja lida, não clicada.
   */
  function renderizarConfirmacoes() {
    const el = document.getElementById('statusPedidoConfirmacoes');
    const btnSalvar = document.getElementById('btnSalvarModalStatusPedido');

    const opcao = (dadosAvaliacao.opcoes || []).find(function (o) {
      return o.status === statusEscolhido;
    });

    if (!opcao || opcao.confirmacoes.length === 0) {
      el.innerHTML = '';
      btnSalvar.disabled = !statusEscolhido;
      return;
    }

    const textos = {
      sem_vaga: 'Estou ciente de que a excursão ficará acima do limite de vagas.',
      dinheiro_reconhecido: 'Estou ciente de que o valor já recebido NÃO será estornado por esta mudança.',
      sem_confirmacao_gateway: 'Estou ciente de que o gateway não confirma este pagamento.'
    };

    el.innerHTML = '<div class="status-pedido-confirmacoes-caixa">' +
      opcao.confirmacoes.map(function (token) {
        return '<label class="status-pedido-confirmacao">' +
          '<input type="checkbox" class="status-pedido-confirmacao-check" value="' + escapar(token) + '">' +
          '<span>' + escapar(textos[token] || token) + '</span>' +
        '</label>';
      }).join('') +
    '</div>';

    el.querySelectorAll('.status-pedido-confirmacao-check').forEach(function (check) {
      check.addEventListener('change', atualizarBotaoSalvar);
    });

    atualizarBotaoSalvar();

    // Traz a confirmação para a vista. Sem isso ela nasce abaixo da lista de
    // opções, fora da área visível: o operador veria apenas o botão de salvar
    // travado, sem o motivo na tela.
    //
    // Rola a própria caixa e não o invólucro: o invólucro ocupa altura zero até
    // o conteúdo ser desenhado, e `nearest` concluía que já estava visível.
    const caixa = el.querySelector('.status-pedido-confirmacoes-caixa');
    // Rolagem instantânea: com `behavior: 'smooth'` a animação não chegava a
    // acontecer dentro do corpo do modal, e a caixa continuava fora da vista.
    if (caixa) caixa.scrollIntoView({ block: 'center' });
  }

  /**
   * Explicação da função [atualizarBotaoSalvar]
   * Só libera a gravação quando todas as confirmações exigidas estão marcadas.
   */
  function atualizarBotaoSalvar() {
    const btnSalvar = document.getElementById('btnSalvarModalStatusPedido');
    const checks = document.querySelectorAll('.status-pedido-confirmacao-check');
    const todasMarcadas = Array.prototype.every.call(checks, function (c) { return c.checked; });
    btnSalvar.disabled = !statusEscolhido || !todasMarcadas;
  }

  /**
   * Explicação da função [abrir]
   * Carrega a avaliação do pedido no backend e exibe o modal preenchido.
   */
  async function abrir(pedidoId, opcoes) {
    garantirMarcacao();

    pedidoAtualId = pedidoId;
    statusEscolhido = null;
    aoConcluirCallback = (opcoes && opcoes.aoConcluir) || null;

    const overlay = document.getElementById(ID_OVERLAY);
    document.getElementById('statusPedidoOpcoes').innerHTML =
      '<p><i class="fas fa-spinner fa-spin"></i> Avaliando as opções para este pedido...</p>';
    document.getElementById('statusPedidoConfirmacoes').innerHTML = '';
    document.getElementById('statusPedidoResumo').innerHTML = '';
    document.getElementById('statusPedidoAvisarCliente').checked = false;
    document.getElementById('btnSalvarModalStatusPedido').disabled = true;

    overlay.classList.remove('oculto');
    document.body.style.overflow = 'hidden';

    try {
      const token = obterToken();
      if (!token) {
        window.location.href = 'login.html';
        return;
      }

      console.log('[Status Pedido] Consultando opções de status para o pedido:', pedidoId);

      const resposta = await fetch('/api/admin/pedidos/' + encodeURIComponent(pedidoId) + '/opcoes-status', {
        headers: { 'Authorization': 'Bearer ' + token }
      });

      const resultado = await resposta.json();

      if (!resposta.ok || !resultado.success) {
        throw new Error(resultado.error || resultado.message || 'Erro ao avaliar as opções de status');
      }

      dadosAvaliacao = resultado.data;
      console.log('[Status Pedido] Opções avaliadas:', dadosAvaliacao.opcoes);

      renderizarResumo(dadosAvaliacao);
      renderizarOpcoes(dadosAvaliacao.opcoes);
    } catch (erro) {
      console.error('[Status Pedido] Erro ao abrir o modal:', erro);
      document.getElementById('statusPedidoOpcoes').innerHTML =
        '<p style="color: var(--danger-color);"><i class="fas fa-exclamation-circle"></i> ' +
        escapar(erro.message || 'Erro ao carregar as opções') + '</p>';
    }
  }

  /**
   * Explicação da função [salvar]
   * Envia o novo status com as confirmações marcadas e recarrega a lista.
   *
   * O backend reavalia tudo de novo: entre abrir o modal e salvar, outra pessoa
   * pode ter ocupado a última vaga ou o pagamento pode ter entrado.
   */
  async function salvar() {
    if (!pedidoAtualId || !statusEscolhido) return;

    const btnSalvar = document.getElementById('btnSalvarModalStatusPedido');
    const textoOriginal = btnSalvar.innerHTML;
    btnSalvar.disabled = true;
    btnSalvar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';

    try {
      const token = obterToken();
      const confirmacoes = Array.prototype.map.call(
        document.querySelectorAll('.status-pedido-confirmacao-check:checked'),
        function (c) { return c.value; }
      );

      const corpo = {
        status: statusEscolhido,
        confirmacoes: confirmacoes,
        avisarCliente: document.getElementById('statusPedidoAvisarCliente').checked
      };

      console.log('[Status Pedido] Salvando alteração:', { pedidoId: pedidoAtualId, corpo: corpo });

      const resposta = await fetch('/api/admin/pedidos/' + encodeURIComponent(pedidoAtualId) + '/status', {
        method: 'PATCH',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(corpo)
      });

      const resultado = await resposta.json();

      if (!resposta.ok || !resultado.success) {
        const motivos = resultado.data && resultado.data.motivos
          ? '\n\n' + resultado.data.motivos.join('\n')
          : '';
        throw new Error((resultado.error || 'Erro ao alterar o status') + motivos);
      }

      console.log('[Status Pedido] Status alterado com sucesso');
      if (typeof showSuccess === 'function') {
        showSuccess('Status do pedido alterado com sucesso!');
      } else {
        alert('Status do pedido alterado com sucesso!');
      }

      const callback = aoConcluirCallback;
      fechar();
      if (typeof callback === 'function') callback();
    } catch (erro) {
      console.error('[Status Pedido] Erro ao salvar:', erro);
      if (typeof showError === 'function') {
        showError(erro.message || 'Erro ao alterar o status');
      } else {
        alert(erro.message || 'Erro ao alterar o status');
      }
      btnSalvar.disabled = false;
      btnSalvar.innerHTML = textoOriginal;
    }
  }

  return { abrir: abrir, fechar: fechar };
})();

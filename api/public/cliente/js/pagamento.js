/**
 * Explicação do Arquivo [pagamento.js]
 * 
 * Gerencia o fluxo de pagamento após a criação do pedido.
 * Permite ao cliente escolher entre PIX (QR Code) e Cartão de Crédito.
 * 
 * Fluxo:
 * 1. Recebe pedidoId via URL params
 * 2. Carrega dados do pedido via API
 * 3. Exibe opções de pagamento (PIX ou Cartão)
 * 4. PIX: Gera QR Code via API Asaas e faz polling de status
 * 5. Cartão: Envia dados do cartão para processamento via API Asaas
 * 6. Após pagamento confirmado, mostra sucesso e link para "Meus Pedidos"
 */

let pedidoId = '';
let pedidoData = null;
let pixPollingInterval = null;

// ============================================================
// Inicialização
// ============================================================

/**
 * Explicação da função [init]:
 * Inicializa a página de pagamento.
 * Verifica autenticação, extrai pedidoId da URL, carrega dados do pedido.
 */
async function init() {
    console.log('[Pagamento] Inicializando página de pagamento...');

    // Extrai pedidoId da URL
    const params = new URLSearchParams(window.location.search);
    pedidoId = params.get('pedidoId') || '';

    if (!pedidoId) {
        console.error('[Pagamento] pedidoId não encontrado na URL');
        showPageError('Pedido não encontrado. Redirecionando...');
        setTimeout(() => window.location.href = '/cliente/pedidos.html', 2000);
        return;
    }

    console.log('[Pagamento] pedidoId:', pedidoId);

    // Verifica autenticação
    const isAuth = await clienteAuth.requireAuth();
    if (!isAuth) return;

    // Carrega dados do pedido
    await loadPedido();

    // Setup de eventos
    setupTabs();
    setupPixButton();
    setupCardForm();
    setupCardMasks();

    // Mostra conteúdo
    document.getElementById('loadingPage').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';

    console.log('[Pagamento] Página inicializada com sucesso');
}

// ============================================================
// Carregar dados do pedido
// ============================================================

/**
 * Explicação da função [loadPedido]:
 * Busca os dados do pedido na API para exibir resumo (viagem, valor, quantidade).
 * Também verifica se o pedido já foi pago (para não permitir pagamento duplicado).
 */
async function loadPedido() {
    try {
        console.log('[Pagamento] Carregando dados do pedido:', pedidoId);

        const response = await clienteAuth.fetchAuth(`/cliente/pedidos/${pedidoId}`);

        if (!response.ok) {
            throw new Error('Pedido não encontrado');
        }

        const result = await response.json();
        pedidoData = result.data || result;

        console.log('[Pagamento] Dados do pedido carregados:', pedidoData);

        // Verifica se já foi pago
        if (pedidoData.status === 'PAGO' || pedidoData.status === 'CONFIRMADO') {
            console.log('[Pagamento] Pedido já pago, exibindo sucesso');
            showSuccess('Este pedido já foi pago!');
            return;
        }

        // Renderiza resumo
        renderOrderSummary();
    } catch (error) {
        console.error('[Pagamento] Erro ao carregar pedido:', error);
        showPageError('Erro ao carregar dados do pedido. Verifique se o pedido existe.');
    }
}

/**
 * Explicação da função [renderOrderSummary]:
 * Renderiza o resumo do pedido no topo da página (nome da viagem, quantidade, valor total).
 */
function renderOrderSummary() {
    if (!pedidoData) return;

    const titulo = (pedidoData.excursaoPedagogica && pedidoData.excursaoPedagogica.titulo)
        ? pedidoData.excursaoPedagogica.titulo
        : (pedidoData.excursao && pedidoData.excursao.titulo)
            ? pedidoData.excursao.titulo
            : 'Viagem';

    document.getElementById('tripName').textContent = titulo;
    document.getElementById('orderQty').textContent = `${pedidoData.quantidade} passageiro(s)`;
    document.getElementById('orderTotal').textContent = formatMoney(pedidoData.valorTotal);
}

// ============================================================
// Tabs de método de pagamento
// ============================================================

/**
 * Explicação da função [setupTabs]:
 * Configura as abas PIX / Cartão de Crédito.
 * Alterna entre painéis ao clicar nas tabs.
 */
function setupTabs() {
    const tabs = document.querySelectorAll('.method-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const method = tab.dataset.method;
            console.log('[Pagamento] Método selecionado:', method);

            // Ativa tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Mostra painel
            document.querySelectorAll('.method-panel').forEach(p => p.classList.remove('active'));
            document.getElementById(method === 'pix' ? 'panelPix' : 'panelCartao').classList.add('active');

            // Limpa alertas ao trocar
            hideAlerts();
        });
    });
}

// ============================================================
// PIX - Geração de QR Code e polling
// ============================================================

/**
 * Explicação da função [setupPixButton]:
 * Configura o botão "Gerar QR Code PIX" que chama a API para criar a cobrança PIX.
 */
function setupPixButton() {
    const btn = document.getElementById('btnGeneratePix');
    btn.addEventListener('click', async () => {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando...';
        hideAlerts();

        try {
            console.log('[Pagamento PIX] Gerando cobrança PIX para pedidoId:', pedidoId);

            const response = await clienteAuth.fetchAuth('/cliente/pagamento/pix', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pedidoId })
            });

            const result = await response.json();
            console.log('[Pagamento PIX] Resposta da API:', result);

            if (!response.ok || !result.success) {
                throw new Error(result.error || result.message || 'Erro ao gerar PIX');
            }

            // Verifica se já foi pago (reconciliação)
            if (result.data.status === 'PAGO') {
                console.log('[Pagamento PIX] Pagamento já confirmado via reconciliação');
                showSuccess('Pagamento já foi confirmado!');
                return;
            }

            // Exibe QR Code
            displayPixQrCode(result.data);

            // Inicia polling de status
            startPixPolling();

        } catch (error) {
            console.error('[Pagamento PIX] Erro:', error);
            showAlert('error', error.message || 'Erro ao gerar QR Code PIX. Tente novamente.');
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-qrcode"></i> Gerar QR Code PIX';
        }
    });
}

/**
 * Explicação da função [displayPixQrCode]:
 * Exibe o QR Code PIX gerado pela API Asaas.
 * Mostra a imagem do QR Code e o código copia-e-cola.
 */
function displayPixQrCode(data) {
    console.log('[Pagamento PIX] Exibindo QR Code');

    // Esconde botão de gerar, mostra área do QR Code
    document.getElementById('pixGenerateArea').style.display = 'none';
    document.getElementById('pixQrcodeArea').style.display = 'block';

    // QR Code Image - o Asaas retorna base64
    const qrImg = document.getElementById('pixQrcodeImg');
    if (data.qrCodeImage) {
        // Se já é base64, adiciona prefixo data:image
        if (data.qrCodeImage.startsWith('data:')) {
            qrImg.src = data.qrCodeImage;
        } else {
            qrImg.src = `data:image/png;base64,${data.qrCodeImage}`;
        }
    }

    // Código copia-e-cola
    const pixCode = document.getElementById('pixCopyCode');
    if (data.qrCode) {
        pixCode.value = data.qrCode;
    }

    // Botão copiar
    document.getElementById('btnCopyPix').addEventListener('click', () => {
        navigator.clipboard.writeText(pixCode.value).then(() => {
            const btn = document.getElementById('btnCopyPix');
            btn.classList.add('copied');
            btn.innerHTML = '<i class="fas fa-check"></i> Copiado!';
            setTimeout(() => {
                btn.classList.remove('copied');
                btn.innerHTML = '<i class="fas fa-copy"></i> Copiar código PIX';
            }, 3000);
        }).catch(() => {
            // Fallback para navegadores que não suportam clipboard API
            pixCode.select();
            document.execCommand('copy');
            const btn = document.getElementById('btnCopyPix');
            btn.classList.add('copied');
            btn.innerHTML = '<i class="fas fa-check"></i> Copiado!';
            setTimeout(() => {
                btn.classList.remove('copied');
                btn.innerHTML = '<i class="fas fa-copy"></i> Copiar código PIX';
            }, 3000);
        });
    });
}

/**
 * Explicação da função [startPixPolling]:
 * Inicia verificação periódica do status do pagamento PIX.
 * A cada 5 segundos consulta a API para ver se o pagamento foi confirmado.
 * Quando confirmado, para o polling e mostra tela de sucesso.
 */
function startPixPolling() {
    console.log('[Pagamento PIX] Iniciando polling de status...');

    // Limpa polling anterior se existir
    if (pixPollingInterval) {
        clearInterval(pixPollingInterval);
    }

    pixPollingInterval = setInterval(async () => {
        try {
            console.log('[Pagamento PIX] Verificando status do pagamento...');

            const response = await clienteAuth.fetchAuth(`/cliente/pagamento/${pedidoId}/status`);
            const result = await response.json();

            console.log('[Pagamento PIX] Status atual:', result.data?.status);

            if (result.success && result.data) {
                const status = result.data.status;

                if (status === 'PAGO' || status === 'CONFIRMADO') {
                    console.log('[Pagamento PIX] Pagamento confirmado!');
                    clearInterval(pixPollingInterval);
                    pixPollingInterval = null;
                    showSuccess('Pagamento PIX confirmado com sucesso!');
                }
            }
        } catch (error) {
            console.error('[Pagamento PIX] Erro no polling:', error);
            // Não para o polling por erro temporário
        }
    }, 5000); // A cada 5 segundos
}

// ============================================================
// Cartão de Crédito
// ============================================================

/**
 * Explicação da função [setupCardForm]:
 * Configura o formulário de pagamento com cartão de crédito.
 * Ao submeter, valida os dados e envia para a API Asaas.
 */
function setupCardForm() {
    document.getElementById('cardForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        hideAlerts();

        const btn = document.getElementById('btnPayCard');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando pagamento...';

        try {
            // Coleta dados do cartão
            const cardNumberRaw = document.getElementById('cardNumber').value.replace(/\s/g, '');
            const expiryRaw = document.getElementById('cardExpiry').value; // MM/AAAA
            const [expiryMonth, expiryYear] = expiryRaw.split('/');

            const payload = {
                pedidoId,
                creditCard: {
                    holderName: document.getElementById('cardHolderName').value.trim(),
                    number: cardNumberRaw,
                    expiryMonth: expiryMonth,
                    expiryYear: expiryYear,
                    ccv: document.getElementById('cardCvv').value.trim()
                },
                creditCardHolderInfo: {
                    name: document.getElementById('holderName').value.trim(),
                    email: document.getElementById('holderEmail').value.trim(),
                    cpfCnpj: document.getElementById('holderCpf').value.replace(/\D/g, ''),
                    postalCode: document.getElementById('holderPostalCode').value.replace(/\D/g, ''),
                    addressNumber: document.getElementById('holderAddressNumber').value.trim(),
                    phone: document.getElementById('holderPhone').value.replace(/\D/g, '')
                }
            };

            console.log('[Pagamento Cartão] Enviando pagamento:', { pedidoId, holderName: payload.creditCard.holderName });

            const response = await clienteAuth.fetchAuth('/cliente/pagamento/cartao', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            console.log('[Pagamento Cartão] Resposta da API:', result);

            if (!response.ok || !result.success) {
                throw new Error(result.error || result.message || 'Erro ao processar pagamento');
            }

            if (result.data.status === 'PAGO') {
                showSuccess('Pagamento com cartão aprovado!');
            } else {
                // Aguardando processamento
                showAlert('success', 'Pagamento em processamento. Você será notificado quando for confirmado.');
                setTimeout(() => {
                    window.location.href = '/cliente/pedidos.html';
                }, 3000);
            }

        } catch (error) {
            console.error('[Pagamento Cartão] Erro:', error);
            showAlert('error', error.message || 'Erro ao processar pagamento com cartão. Verifique os dados e tente novamente.');
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-lock"></i> Pagar com Cartão';
        }
    });
}

/**
 * Explicação da função [setupCardMasks]:
 * Aplica máscaras de formatação nos campos do formulário de cartão.
 * Número do cartão: 0000 0000 0000 0000
 * Validade: MM/AAAA
 * CPF: 000.000.000-00
 * CEP: 00000-000
 * Telefone: (00) 00000-0000
 */
function setupCardMasks() {
    // Máscara número do cartão: 0000 0000 0000 0000
    document.getElementById('cardNumber').addEventListener('input', function(e) {
        let val = e.target.value.replace(/\D/g, '');
        val = val.replace(/(\d{4})(?=\d)/g, '$1 ');
        e.target.value = val.substring(0, 19);
    });

    // Máscara validade: MM/AAAA
    document.getElementById('cardExpiry').addEventListener('input', function(e) {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length >= 2) {
            val = val.substring(0, 2) + '/' + val.substring(2, 6);
        }
        e.target.value = val;
    });

    // Máscara CVV: apenas números
    document.getElementById('cardCvv').addEventListener('input', function(e) {
        e.target.value = e.target.value.replace(/\D/g, '').substring(0, 4);
    });

    // Máscara CPF: 000.000.000-00
    document.getElementById('holderCpf').addEventListener('input', function(e) {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length <= 11) {
            val = val.replace(/(\d{3})(\d)/, '$1.$2');
            val = val.replace(/(\d{3})(\d)/, '$1.$2');
            val = val.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        }
        e.target.value = val;
    });

    // Máscara CEP: 00000-000
    document.getElementById('holderPostalCode').addEventListener('input', function(e) {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length <= 8) {
            val = val.replace(/(\d{5})(\d)/, '$1-$2');
        }
        e.target.value = val;
    });

    // Máscara telefone: (00) 00000-0000
    document.getElementById('holderPhone').addEventListener('input', function(e) {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length <= 11) {
            val = val.replace(/^(\d{2})(\d)/, '($1) $2');
            val = val.replace(/(\d{4,5})(\d{4})$/, '$1-$2');
        }
        e.target.value = val;
    });

    // Pré-preenche dados do titular a partir dos dados do cliente logado
    prefillHolderData();
}

/**
 * Explicação da função [prefillHolderData]:
 * Pré-preenche campos do titular do cartão com dados do cliente logado.
 * Facilita a experiência do usuário que já tem dados cadastrados.
 */
function prefillHolderData() {
    const cliente = clienteAuth.getCliente();
    if (!cliente) return;

    console.log('[Pagamento] Pré-preenchendo dados do titular com dados do cliente');

    if (cliente.nome) {
        document.getElementById('holderName').value = cliente.nome;
        document.getElementById('cardHolderName').value = cliente.nome;
    }
    if (cliente.email) {
        document.getElementById('holderEmail').value = cliente.email;
    }
    if (cliente.cpf) {
        // Formata CPF
        let cpf = cliente.cpf.replace(/\D/g, '');
        if (cpf.length === 11) {
            cpf = cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        }
        document.getElementById('holderCpf').value = cpf;
    }
    if (cliente.telefone) {
        document.getElementById('holderPhone').value = cliente.telefone;
    }
}

// ============================================================
// UI Helpers
// ============================================================

/**
 * Explicação da função [showSuccess]:
 * Exibe a tela de sucesso após confirmação do pagamento.
 * Esconde o card de pagamento e mostra mensagem de confirmação.
 */
function showSuccess(message) {
    // Para polling se ativo
    if (pixPollingInterval) {
        clearInterval(pixPollingInterval);
        pixPollingInterval = null;
    }

    document.getElementById('paymentCard').style.display = 'none';
    document.getElementById('successCard').style.display = 'block';
    document.getElementById('successMessage').textContent = message || 'Seu pagamento foi processado com sucesso.';
    hideAlerts();
}

/**
 * Explicação da função [showAlert]:
 * Exibe alerta de erro ou sucesso na página.
 */
function showAlert(type, message) {
    hideAlerts();
    const el = document.getElementById(type === 'error' ? 'alertError' : 'alertSuccess');
    const msgEl = document.getElementById(type === 'error' ? 'alertErrorMsg' : 'alertSuccessMsg');
    msgEl.textContent = message;
    el.classList.add('show');
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/**
 * Explicação da função [hideAlerts]:
 * Esconde todos os alertas da página.
 */
function hideAlerts() {
    document.getElementById('alertError').classList.remove('show');
    document.getElementById('alertSuccess').classList.remove('show');
}

/**
 * Explicação da função [showPageError]:
 * Exibe erro no loading page (antes de carregar o conteúdo principal).
 */
function showPageError(message) {
    const loadingEl = document.getElementById('loadingPage');
    loadingEl.innerHTML = `
        <i class="fas fa-exclamation-circle" style="color: var(--danger-color);"></i>
        <p style="color: var(--danger-color);">${message}</p>
    `;
}

/**
 * Explicação da função [formatMoney]:
 * Formata valor numérico para moeda brasileira (R$ X.XXX,XX).
 */
function formatMoney(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

// ============================================================
// Startup
// ============================================================

document.addEventListener('DOMContentLoaded', init);

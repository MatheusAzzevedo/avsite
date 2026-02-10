/**
 * Checkout Convencional - Frontend
 * Gera formulário dinâmico para dados de passageiros (sem informações de aluno/escola)
 */

let viagemSlug = '';
let quantidade = 1;
let excursaoData = null;

// Extrai parâmetros da URL
function getURLParams() {
    const params = new URLSearchParams(window.location.search);
    viagemSlug = params.get('viagem') || '';
    quantidade = parseInt(params.get('quantidade') || '1', 10);

    console.log('[Checkout Convencional] Parâmetros:', { viagemSlug, quantidade });

    if (!viagemSlug) {
        showError('Viagem não especificada. Redirecionando...');
        setTimeout(() => window.location.href = '/excursoes', 2000);
        return false;
    }
    return true;
}

// Carrega dados da viagem
async function loadExcursao() {
    try {
        const response = await fetch(`/api/excursoes/slug/${viagemSlug}`);
        if (!response.ok) throw new Error('Viagem não encontrada');

        excursaoData = await response.json();
        renderResumo();
        renderPassageirosForm();
    } catch (error) {
        console.error('[Checkout Convencional] Erro ao carregar viagem:', error);
        showError('Erro ao carregar informações da viagem. Tente novamente.');
    }
}

// Renderiza resumo do pedido
function renderResumo() {
    if (!excursaoData) return;

    document.getElementById('viagemTitulo').textContent = excursaoData.titulo || 'Viagem';
    document.getElementById('resumoQuantidade').textContent = quantidade;

    const valorUnitario = parseFloat(excursaoData.preco) || 0;
    const valorTotal = valorUnitario * quantidade;

    document.getElementById('resumoValorUnitario').textContent = formatMoney(valorUnitario);
    document.getElementById('resumoTotal').textContent = formatMoney(valorTotal);
}

// Renderiza formulário dinâmico (um bloco por passageiro)
function renderPassageirosForm() {
    const container = document.getElementById('passageirosContainer');
    container.innerHTML = '';

    for (let i = 0; i < quantidade; i++) {
        const passageiroIndex = i + 1;
        const detailsEl = document.createElement('details');
        detailsEl.className = 'passageiro-dropdown';
        detailsEl.open = i === 0; // Primeiro aberto por padrão

        detailsEl.innerHTML = `
            <summary class="passageiro-dropdown-header">
                <div>
                    <span class="passageiro-summary-text">Passageiro ${passageiroIndex}</span>
                    <span class="passageiro-summary-hint">Clique para preencher</span>
                </div>
                <i class="fas fa-chevron-down"></i>
            </summary>
            <div class="passageiro-dropdown-content">
                <div class="form-grid">
                    <div class="form-group">
                        <label>Nome <span class="required">*</span></label>
                        <input type="text" name="passageiro_${i}_nome" required data-index="${i}" data-field="nome">
                    </div>
                    <div class="form-group">
                        <label>Sobrenome <span class="required">*</span></label>
                        <input type="text" name="passageiro_${i}_sobrenome" required data-index="${i}" data-field="sobrenome">
                    </div>
                    <div class="form-group">
                        <label>CPF <span class="required">*</span></label>
                        <input type="text" name="passageiro_${i}_cpf" placeholder="000.000.000-00" required data-index="${i}" data-field="cpf" maxlength="14">
                    </div>
                    <div class="form-group">
                        <label>País <span class="required">*</span></label>
                        <input type="text" name="passageiro_${i}_pais" value="Brasil" required data-index="${i}" data-field="pais">
                    </div>
                    <div class="form-group">
                        <label>CEP <span class="required">*</span></label>
                        <input type="text" name="passageiro_${i}_cep" placeholder="00000-000" required data-index="${i}" data-field="cep" maxlength="9">
                    </div>
                    <div class="form-group">
                        <label>Endereço <span class="required">*</span></label>
                        <input type="text" name="passageiro_${i}_endereco" required data-index="${i}" data-field="endereco">
                    </div>
                    <div class="form-group">
                        <label>Número <span class="required">*</span></label>
                        <input type="text" name="passageiro_${i}_numero" required data-index="${i}" data-field="numero">
                    </div>
                    <div class="form-group">
                        <label>Complemento</label>
                        <input type="text" name="passageiro_${i}_complemento" data-index="${i}" data-field="complemento">
                    </div>
                    <div class="form-group">
                        <label>Cidade <span class="required">*</span></label>
                        <input type="text" name="passageiro_${i}_cidade" required data-index="${i}" data-field="cidade">
                    </div>
                    <div class="form-group">
                        <label>Estado <span class="required">*</span></label>
                        <input type="text" name="passageiro_${i}_estado" placeholder="SP" required data-index="${i}" data-field="estado" maxlength="2">
                    </div>
                    <div class="form-group">
                        <label>Bairro</label>
                        <input type="text" name="passageiro_${i}_bairro" data-index="${i}" data-field="bairro">
                    </div>
                    <div class="form-group">
                        <label>Telefone <span class="required">*</span></label>
                        <input type="text" name="passageiro_${i}_telefone" placeholder="(11) 98888-8888" required data-index="${i}" data-field="telefone" maxlength="15">
                    </div>
                    <div class="form-group form-grid-full">
                        <label>Email <span class="required">*</span></label>
                        <input type="email" name="passageiro_${i}_email" required data-index="${i}" data-field="email">
                    </div>
                </div>
            </div>
        `;

        container.appendChild(detailsEl);
    }

    // Aplica máscaras nos campos
    applyMasks();
}

// Aplica máscaras de formatação (CPF, CEP, telefone)
function applyMasks() {
    document.querySelectorAll('input[data-field="cpf"]').forEach(input => {
        input.addEventListener('input', function(e) {
            let val = e.target.value.replace(/\D/g, '');
            if (val.length <= 11) {
                val = val.replace(/(\d{3})(\d)/, '$1.$2');
                val = val.replace(/(\d{3})(\d)/, '$1.$2');
                val = val.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
            }
            e.target.value = val;
        });
    });

    document.querySelectorAll('input[data-field="cep"]').forEach(input => {
        input.addEventListener('input', function(e) {
            let val = e.target.value.replace(/\D/g, '');
            if (val.length <= 8) {
                val = val.replace(/(\d{5})(\d)/, '$1-$2');
            }
            e.target.value = val;
        });
    });

    document.querySelectorAll('input[data-field="telefone"]').forEach(input => {
        input.addEventListener('input', function(e) {
            let val = e.target.value.replace(/\D/g, '');
            if (val.length <= 11) {
                val = val.replace(/^(\d{2})(\d)/, '($1) $2');
                val = val.replace(/(\d{4,5})(\d{4})$/, '$1-$2');
            }
            e.target.value = val;
        });
    });

    document.querySelectorAll('input[data-field="estado"]').forEach(input => {
        input.addEventListener('input', function(e) {
            e.target.value = e.target.value.toUpperCase();
        });
    });
}

// Coleta dados do formulário
function collectFormData() {
    const dadosPassageiros = [];

    for (let i = 0; i < quantidade; i++) {
        const passageiro = {
            nome: getFieldValue(i, 'nome'),
            sobrenome: getFieldValue(i, 'sobrenome'),
            cpf: getFieldValue(i, 'cpf'),
            pais: getFieldValue(i, 'pais'),
            cep: getFieldValue(i, 'cep'),
            endereco: getFieldValue(i, 'endereco'),
            numero: getFieldValue(i, 'numero'),
            complemento: getFieldValue(i, 'complemento'),
            cidade: getFieldValue(i, 'cidade'),
            estado: getFieldValue(i, 'estado'),
            bairro: getFieldValue(i, 'bairro'),
            telefone: getFieldValue(i, 'telefone'),
            email: getFieldValue(i, 'email')
        };
        dadosPassageiros.push(passageiro);
    }

    return {
        excursaoSlug: viagemSlug,
        quantidade,
        dadosPassageiros
    };
}

// Helper: pega valor de um campo
function getFieldValue(index, field) {
    const input = document.querySelector(`input[data-index="${index}"][data-field="${field}"]`);
    return input ? input.value.trim() : '';
}

// Validação básica do formulário
function validateForm() {
    const errors = [];
    const requiredFields = ['nome', 'sobrenome', 'cpf', 'pais', 'cep', 'endereco', 'numero', 'cidade', 'estado', 'telefone', 'email'];

    for (let i = 0; i < quantidade; i++) {
        for (const field of requiredFields) {
            const val = getFieldValue(i, field);
            if (!val) {
                errors.push(`Passageiro ${i + 1}: campo "${field}" é obrigatório`);
            }
        }
    }

    return errors;
}

// Exibe erros no topo do formulário
function showFormErrors(errors) {
    const errorSummary = document.getElementById('errorSummary');
    const errorList = document.getElementById('errorList');

    if (errors.length === 0) {
        errorSummary.classList.remove('show');
        return;
    }

    errorList.innerHTML = errors.map(err => `<li>${err}</li>`).join('');
    errorSummary.classList.add('show');
    errorSummary.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Submissão do formulário
document.getElementById('checkoutForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const errors = validateForm();
    if (errors.length > 0) {
        showFormErrors(errors);
        return;
    }

    const btnFinalizar = document.getElementById('btnFinalizar');
    btnFinalizar.disabled = true;
    btnFinalizar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';

    try {
        const payload = collectFormData();
        console.log('[Checkout Convencional] Enviando pedido:', payload);

        const response = await authFetch('/api/cliente/pedidos/convencional', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro ao criar pedido');
        }

        const result = await response.json();
        console.log('[Checkout Convencional] Pedido criado:', result);

        alert('Pedido criado com sucesso! Você será redirecionado para a página de pagamento.');
        // TODO: Redirecionar para página de pagamento com ID do pedido
        window.location.href = `/cliente/pedidos.html`;
    } catch (error) {
        console.error('[Checkout Convencional] Erro ao criar pedido:', error);
        showError(error.message || 'Erro ao processar pedido. Tente novamente.');
        btnFinalizar.disabled = false;
        btnFinalizar.innerHTML = '<i class="fas fa-check-circle"></i> Finalizar Pedido';
    }
});

// Helpers
function formatMoney(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function showError(msg) {
    showFormErrors([msg]);
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log('[Checkout Convencional] Inicializando...');

    if (!getURLParams()) return;

    // Verifica autenticação
    authManager.requireAuth(function() {
        loadExcursao();
    });
});

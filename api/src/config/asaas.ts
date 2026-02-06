/**
 * Explicação do Arquivo [asaas.ts]
 * 
 * Configuração e serviço de integração com Asaas (Gateway de Pagamento).
 * Gerencia criação de cobranças, consulta de status e processamento de webhooks.
 * 
 * Métodos de pagamento suportados:
 * - PIX (instantâneo)
 * - Cartão de Crédito
 * - Boleto (opcional)
 */

import { AsaasClient } from 'asaas';
import { logger } from '../utils/logger';

/**
 * Cliente Asaas — API Key lida apenas das variáveis de ambiente (ex.: Railway).
 * Nenhuma chave deve ficar no código; configure ASAAS_API_KEY no Railway → Variables.
 * A chave é trimada para evitar 401 por espaços/quebras de linha ao colar no Railway.
 */
const asaasApiKeyRaw = process.env.ASAAS_API_KEY || '';
const asaasApiKey = asaasApiKeyRaw.trim();
const asaasEnvRaw = process.env.ASAAS_ENVIRONMENT || 'production';
const asaasEnv = asaasEnvRaw.trim().toLowerCase(); // production ou sandbox

// Log de inicialização (avisa se havia espaços na chave)
if (!asaasApiKey) {
  logger.warn('[Asaas] ⚠️ ASAAS_API_KEY não está definida! Configure a variável no Railway.');
} else {
  const hadWhitespace = asaasApiKeyRaw.length !== asaasApiKey.length;
  logger.info('[Asaas] ✅ API Key carregada com sucesso', {
    context: {
      environment: asaasEnv,
      keyPrefix: asaasApiKey.substring(0, 15) + '...',
      keyLength: asaasApiKey.length,
      ...(hadWhitespace && { warning: 'Espaços removidos da chave (trim)' })
    }
  });
}

export const asaasClient = new AsaasClient(asaasApiKey, {
  sandbox: asaasEnv === 'sandbox'
});

/**
 * Explicação da função [criarCobrancaAsaas]
 * 
 * Cria uma cobrança no Asaas para PIX ou Cartão.
 * 
 * Fluxo:
 * 1. Cria cliente no Asaas (se não existir)
 * 2. Cria cobrança com valor e descrição
 * 3. Retorna dados da cobrança (ID, QR Code PIX, link de pagamento)
 * 
 * @param dados - Dados da cobrança
 * @returns Dados da cobrança criada
 */
export async function criarCobrancaAsaas(dados: {
  clienteEmail: string;
  clienteNome: string;
  clienteCpf?: string;
  clienteTelefone?: string;
  valor: number;
  descricao: string;
  metodoPagamento: 'PIX' | 'CREDIT_CARD' | 'BOLETO';
  externalReference?: string; // ID do pedido no nosso sistema
  dueDate?: Date; // Data de vencimento (para boleto)
}) {
  try {
    logger.info('[Asaas] Criando cobrança', {
      context: {
        email: dados.clienteEmail,
        valor: dados.valor,
        metodo: dados.metodoPagamento,
        reference: dados.externalReference
      }
    });

    // 1. Criar ou buscar cliente no Asaas (IAsaasCustomer exige cpfCnpj: string)
    const customerData = {
      name: dados.clienteNome,
      email: dados.clienteEmail,
      cpfCnpj: String(dados.clienteCpf ?? ''),
      phone: String(dados.clienteTelefone ?? '')
    };

    logger.info('[Asaas] Criando/buscando cliente no Asaas', {
      context: { email: dados.clienteEmail }
    });

    // Busca cliente existente por email
    let asaasCustomer;
    try {
      const customers = await asaasClient.customers.list({ email: dados.clienteEmail });
      if (customers.data && customers.data.length > 0) {
        asaasCustomer = customers.data[0];
        logger.info('[Asaas] Cliente já existe', {
          context: { customerId: asaasCustomer.id }
        });
      }
    } catch (error) {
      logger.warn('[Asaas] Erro ao buscar cliente, criando novo', {
        context: { error: error instanceof Error ? error.message : 'Unknown' }
      });
    }

    // Cria cliente se não existir
    if (!asaasCustomer) {
      asaasCustomer = await asaasClient.customers.new(customerData);
      logger.info('[Asaas] Novo cliente criado no Asaas', {
        context: { customerId: asaasCustomer.id }
      });
    }

    // 2. Criar cobrança
    const paymentData: any = {
      customer: asaasCustomer.id,
      billingType: dados.metodoPagamento,
      value: dados.valor,
      description: dados.descricao,
      externalReference: dados.externalReference,
      dueDate: dados.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 dias se não informado
    };

    logger.info('[Asaas] Criando cobrança', {
      context: {
        customerId: asaasCustomer.id,
        billingType: dados.metodoPagamento,
        value: dados.valor
      }
    });

    const payment = await asaasClient.payments.new(paymentData);

    logger.info('[Asaas] Cobrança criada com sucesso', {
      context: {
        paymentId: payment.id,
        status: payment.status,
        billingType: payment.billingType,
        value: payment.value
      }
    });

    // 3. Para PIX, buscar QR Code
    let pixData = null;
    if (dados.metodoPagamento === 'PIX') {
      try {
        logger.info('[Asaas] Buscando QR Code PIX', {
          context: { paymentId: payment.id }
        });

        const paymentId = payment.id;
        if (typeof paymentId !== 'string' || !paymentId) throw new Error('Asaas retornou cobrança sem id');
        const pixResponse = await asaasClient.payments.getPixQrCode(paymentId);
        pixData = {
          qrCode: pixResponse.payload,
          qrCodeImage: pixResponse.encodedImage,
          expirationDate: pixResponse.expirationDate
        };

        logger.info('[Asaas] QR Code PIX obtido', {
          context: { paymentId: payment.id, hasQrCode: !!pixData.qrCode }
        });
      } catch (error) {
        logger.error('[Asaas] Erro ao buscar QR Code PIX', {
          context: {
            paymentId: payment.id,
            error: error instanceof Error ? error.message : 'Unknown'
          }
        });
      }
    }

    return {
      id: payment.id,
      status: payment.status,
      value: payment.value,
      billingType: payment.billingType,
      invoiceUrl: payment.invoiceUrl,
      bankSlipUrl: payment.bankSlipUrl,
      pixData,
      dueDate: payment.dueDate
    };
  } catch (error) {
    logger.error('[Asaas] Erro ao criar cobrança', {
      context: {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        dados: {
          email: dados.clienteEmail,
          valor: dados.valor,
          metodo: dados.metodoPagamento
        }
      }
    });
    throw error;
  }
}

/**
 * Explicação da função [criarCobrancaCartaoAsaas]
 *
 * Cria cobrança no Asaas com cartão de crédito (pagamento imediato).
 * Usa a API REST do Asaas diretamente para enviar creditCard e creditCardHolderInfo.
 *
 * @param dados - Dados do pedido, cliente e cartão
 * @returns Dados da cobrança criada (id, status, value)
 */
export async function criarCobrancaCartaoAsaas(dados: {
  clienteEmail: string;
  clienteNome: string;
  clienteCpf?: string;
  clienteTelefone?: string;
  valor: number;
  descricao: string;
  externalReference: string;
  creditCard: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  creditCardHolderInfo: {
    name: string;
    email: string;
    cpfCnpj: string;
    postalCode: string;
    addressNumber: string;
    phone: string;
  };
}) {
  const baseUrl = asaasEnv === 'sandbox'
    ? 'https://sandbox.asaas.com/api/v3'
    : 'https://api.asaas.com/v3';

  let asaasCustomer: { id: string };
  try {
    const customers = await asaasClient.customers.list({ email: dados.clienteEmail });
    if (customers.data && customers.data.length > 0) {
      asaasCustomer = customers.data[0];
    } else {
      asaasCustomer = await asaasClient.customers.new({
        name: dados.clienteNome,
        email: dados.clienteEmail,
        cpfCnpj: String(dados.clienteCpf ?? dados.creditCardHolderInfo.cpfCnpj ?? ''),
        phone: String(dados.clienteTelefone ?? dados.creditCardHolderInfo.phone ?? '')
      });
    }
  } catch (error) {
    logger.error('[Asaas Cartão] Erro ao obter cliente', {
      context: { error: error instanceof Error ? error.message : 'Unknown' }
    });
    throw error;
  }

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 1);

  const body = {
    customer: asaasCustomer.id,
    billingType: 'CREDIT_CARD',
    value: dados.valor,
    description: dados.descricao,
    externalReference: dados.externalReference,
    dueDate: dueDate.toISOString().split('T')[0],
    creditCard: {
      holderName: dados.creditCard.holderName,
      number: dados.creditCard.number.replace(/\D/g, ''),
      expiryMonth: dados.creditCard.expiryMonth.replace(/\D/g, ''),
      expiryYear: dados.creditCard.expiryYear.replace(/\D/g, ''),
      ccv: dados.creditCard.ccv.replace(/\D/g, '')
    },
    creditCardHolderInfo: {
      name: dados.creditCardHolderInfo.name,
      email: dados.creditCardHolderInfo.email,
      cpfCnpj: dados.creditCardHolderInfo.cpfCnpj.replace(/\D/g, ''),
      postalCode: dados.creditCardHolderInfo.postalCode.replace(/\D/g, ''),
      addressNumber: dados.creditCardHolderInfo.addressNumber,
      phone: dados.creditCardHolderInfo.phone.replace(/\D/g, '')
    }
  };

  logger.info('[Asaas Cartão] Criando cobrança com cartão', {
    context: { customerId: asaasCustomer.id, valor: dados.valor, reference: dados.externalReference }
  });

  const response = await fetch(`${baseUrl}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Avorar-Turismo-API/1.0',
      access_token: asaasApiKey
    },
    body: JSON.stringify(body)
  });

  const payment = (await response.json()) as {
    id?: string;
    status?: string;
    value?: number;
    errors?: Array<{ description?: string }>;
    error?: string;
  };

  if (!response.ok) {
    logger.error('[Asaas Cartão] Erro na API', {
      context: {
        status: response.status,
        errors: payment.errors,
        description: payment.errors?.[0]?.description
      }
    });
    throw new Error(
      payment.errors?.[0]?.description || payment.error || `Asaas retornou ${response.status}`
    );
  }

  logger.info('[Asaas Cartão] Cobrança criada', {
    context: { paymentId: payment.id, status: payment.status }
  });

  return {
    id: payment.id,
    status: payment.status,
    value: payment.value
  };
}

/**
 * Explicação da função [consultarPagamentoAsaas]
 * 
 * Consulta status de um pagamento no Asaas.
 * 
 * @param paymentId - ID do pagamento no Asaas
 * @returns Dados do pagamento
 */
export async function consultarPagamentoAsaas(paymentId: string) {
  try {
    logger.info('[Asaas] Consultando pagamento', {
      context: { paymentId }
    });

    const payment = await asaasClient.payments.getById(paymentId);

    logger.info('[Asaas] Pagamento consultado', {
      context: {
        paymentId: payment.id,
        status: payment.status,
        value: payment.value
      }
    });

    return {
      id: payment.id,
      status: payment.status,
      value: payment.value,
      billingType: payment.billingType,
      confirmedDate: payment.confirmedDate,
      paymentDate: payment.paymentDate
    };
  } catch (error) {
    logger.error('[Asaas] Erro ao consultar pagamento', {
      context: {
        paymentId,
        error: error instanceof Error ? error.message : 'Unknown'
      }
    });
    throw error;
  }
}

/**
 * Explicação da função [processarWebhookAsaas]
 * 
 * Processa webhook do Asaas.
 * Asaas envia notificações quando status do pagamento muda.
 * 
 * Eventos importantes:
 * - PAYMENT_RECEIVED: Pagamento confirmado
 * - PAYMENT_CONFIRMED: Pagamento creditado
 * - PAYMENT_OVERDUE: Pagamento vencido
 * - PAYMENT_DELETED: Pagamento deletado
 * 
 * @param event - Tipo do evento
 * @param payment - Dados do pagamento
 * @returns Status mapeado para o sistema
 */
export function processarWebhookAsaas(event: string, payment: any): {
  statusPedido: string;
  devePagar: boolean;
  deveConfirmar: boolean;
} {
  logger.info('[Asaas Webhook] Processando evento', {
    context: {
      event,
      paymentId: payment.id,
      status: payment.status,
      value: payment.value
    }
  });

  // Mapeia status do Asaas para status do Pedido
  const statusMap: Record<string, { statusPedido: string; devePagar: boolean; deveConfirmar: boolean }> = {
    'PAYMENT_RECEIVED': { statusPedido: 'PAGO', devePagar: true, deveConfirmar: false },
    'PAYMENT_CONFIRMED': { statusPedido: 'CONFIRMADO', devePagar: true, deveConfirmar: true },
    'PAYMENT_OVERDUE': { statusPedido: 'EXPIRADO', devePagar: false, deveConfirmar: false },
    'PAYMENT_DELETED': { statusPedido: 'CANCELADO', devePagar: false, deveConfirmar: false }
  };

  const result = statusMap[event] || { statusPedido: 'PENDENTE', devePagar: false, deveConfirmar: false };

  logger.info('[Asaas Webhook] Evento processado', {
    context: {
      event,
      paymentId: payment.id,
      novoStatus: result.statusPedido
    }
  });

  return result;
}

/**
 * Explicação da função [listarPagamentosPorReferencia]
 *
 * Lista pagamentos no Asaas pelo externalReference (ex.: ID do pedido).
 * Usado para reconciliar quando a API retorna erro mas a cobrança foi processada.
 *
 * @param externalReference - Referência externa (ex.: pedido.id)
 * @returns Lista de pagamentos ou array vazio
 */
export async function listarPagamentosPorReferencia(externalReference: string): Promise<Array<{
  id: string;
  status: string;
  value: number;
  billingType?: string;
}>> {
  const baseUrl = asaasEnv === 'sandbox'
    ? 'https://sandbox.asaas.com/api/v3'
    : 'https://api.asaas.com/v3';
  const url = `${baseUrl}/payments?externalReference=${encodeURIComponent(externalReference)}`;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Avorar-Turismo-API/1.0',
        access_token: asaasApiKey
      }
    });
    const data = (await response.json()) as { data?: Array<{ id: string; status: string; value: number; billingType?: string }> };
    const list = data.data || [];
    logger.info('[Asaas] Pagamentos por referência', {
      context: { externalReference, total: list.length }
    });
    return list;
  } catch (error) {
    logger.warn('[Asaas] Erro ao listar pagamentos por referência', {
      context: { externalReference, error: error instanceof Error ? error.message : 'Unknown' }
    });
    return [];
  }
}

/**
 * Explicação da função [verificarConfigAsaas]
 * 
 * Verifica se a API Key do Asaas está configurada.
 * 
 * @returns true se configurado
 */
export function verificarConfigAsaas(): boolean {
  if (!asaasApiKey) {
    logger.error('[Asaas] ❌ ASAAS_API_KEY não está definida no ambiente!', {
      context: {
        errorType: 'MISSING_API_KEY',
        environment: asaasEnv,
        solution: 'Configure ASAAS_API_KEY nas Variables do Railway'
      }
    });
    return false;
  }

  if (asaasApiKey.length < 10) {
    logger.error('[Asaas] ❌ ASAAS_API_KEY parece estar inválida (muito curta)', {
      context: {
        errorType: 'INVALID_API_KEY',
        keyLength: asaasApiKey.length,
        solution: 'Verifique se a chave foi copiada corretamente no Railway'
      }
    });
    return false;
  }

  logger.info('[Asaas] ✅ Configuração verificada', {
    context: {
      environment: asaasEnv,
      keyPrefix: asaasApiKey.substring(0, 15) + '...',
      keyLength: asaasApiKey.length
    }
  });

  return true;
}

/**
 * Explicação da função [healthCheckAsaas]
 *
 * Testa conexão real com a API do Asaas usando a chave configurada.
 * Faz uma requisição GET /customers?limit=1 para verificar se a chave é válida.
 * Chamada na inicialização do servidor para diagnóstico imediato.
 *
 * @returns { ok: boolean, error?: string }
 */
export async function healthCheckAsaas(): Promise<{ ok: boolean; error?: string }> {
  if (!asaasApiKey) {
    return { ok: false, error: 'ASAAS_API_KEY não definida' };
  }

  const baseUrl = asaasEnv === 'sandbox'
    ? 'https://sandbox.asaas.com/api/v3'
    : 'https://api.asaas.com/v3';

  try {
    const response = await fetch(`${baseUrl}/customers?limit=1`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Avorar-Turismo-API/1.0',
        'access_token': asaasApiKey
      }
    });

    if (response.ok) {
      logger.info('[Asaas] ✅ Health check OK — conexão com Asaas funcionando', {
        context: { environment: asaasEnv, status: response.status }
      });
      return { ok: true };
    }

    // Erro de autenticação
    const body = await response.text();
    let errorDetail = `HTTP ${response.status}`;
    try {
      const json = JSON.parse(body);
      if (json.errors && json.errors.length > 0) {
        errorDetail = json.errors.map((e: { description?: string }) => e.description || '').join('; ');
      }
    } catch { /* body não era JSON */ }

    if (response.status === 401) {
      logger.error('[Asaas] ❌ Health check FALHOU — API Key REJEITADA pelo Asaas (401 Unauthorized)', {
        context: {
          status: 401,
          environment: asaasEnv,
          baseUrl,
          keyPrefix: asaasApiKey.substring(0, 15) + '...',
          keyLength: asaasApiKey.length,
          errorDetail,
          solucao: [
            '1. Acesse o painel Asaas → Integrações → Chaves de API',
            '2. Verifique se a chave está ATIVA (não revogada)',
            '3. Gere uma nova chave se necessário',
            '4. Atualize ASAAS_API_KEY no Railway e faça redeploy',
            '5. Certifique-se de que ASAAS_ENVIRONMENT corresponde ao tipo da chave (production/sandbox)'
          ]
        }
      });
      return { ok: false, error: `API Key rejeitada (401). ${errorDetail}` };
    }

    logger.error('[Asaas] ⚠️ Health check — resposta inesperada', {
      context: { status: response.status, errorDetail }
    });
    return { ok: false, error: `Resposta inesperada: HTTP ${response.status}` };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro desconhecido';
    logger.error('[Asaas] ❌ Health check FALHOU — erro de rede', {
      context: { error: msg }
    });
    return { ok: false, error: msg };
  }
}
